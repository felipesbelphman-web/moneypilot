begin;

do $snapshot$
declare
  snapshot jsonb;
begin
  select jsonb_build_object(
    'tables', (
      select jsonb_object_agg(c.relname, c.oid::text order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
        and c.relkind in ('r', 'p')
    ),
    'row_counts', jsonb_build_object(
      'transactions', (select count(*) from public.transactions),
      'budgets', (select count(*) from public.budgets),
      'budget_adjustments', (select count(*) from public.budget_adjustments),
      'goals', (select count(*) from public.goals),
      'goal_contribution_plans', (select count(*) from public.goal_contribution_plans)
    ),
    'rls', (
      select jsonb_object_agg(c.relname, c.relrowsecurity order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
        and c.relkind in ('r', 'p')
    ),
    'policies', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
      from (
        select tablename, policyname, permissive, roles, cmd, qual, with_check
        from pg_policies
        where schemaname = 'public'
          and tablename in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
      ) p
    )
  ) into snapshot;

  perform set_config('moneypilot.financial_integrity_snapshot', snapshot::text, true);
end
$snapshot$;

alter table public.transactions
  add constraint transactions_payment_not_blank
  check (btrim(payment) <> '');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_amount_positive'
  ) then
    alter table public.transactions
      add constraint transactions_amount_positive check (amount > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_required_text_not_blank'
  ) then
    alter table public.transactions
      add constraint transactions_required_text_not_blank check (
        btrim(id) <> ''
        and btrim(description) <> ''
        and btrim(category) <> ''
        and btrim(category_color) <> ''
        and btrim(date) <> ''
        and btrim(origin) <> ''
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.budgets'::regclass
      and conname = 'budgets_budget_positive'
  ) then
    alter table public.budgets
      add constraint budgets_budget_positive check (budget > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.budgets'::regclass
      and conname = 'budgets_required_text_not_blank'
  ) then
    alter table public.budgets
      add constraint budgets_required_text_not_blank check (
        btrim(id) <> ''
        and btrim(category) <> ''
        and btrim(subtitle) <> ''
        and btrim(color) <> ''
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goals'::regclass
      and conname = 'goals_target_amount_positive'
  ) then
    alter table public.goals
      add constraint goals_target_amount_positive check (target_amount > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goals'::regclass
      and conname = 'goals_saved_amount_nonnegative'
  ) then
    alter table public.goals
      add constraint goals_saved_amount_nonnegative check (saved_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goals'::regclass
      and conname = 'goals_saved_not_above_target'
  ) then
    alter table public.goals
      add constraint goals_saved_not_above_target
      check (saved_amount <= target_amount);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goals'::regclass
      and conname = 'goals_required_text_not_blank'
  ) then
    alter table public.goals
      add constraint goals_required_text_not_blank check (
        btrim(id) <> ''
        and btrim(name) <> ''
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goal_contribution_plans'::regclass
      and conname = 'goal_contribution_plans_values_nonnegative'
  ) then
    alter table public.goal_contribution_plans
      add constraint goal_contribution_plans_values_nonnegative check (
        monthly_target >= 0
        and baseline_required_monthly_contribution >= 0
        and savings_boost >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goal_contribution_plans'::regclass
      and conname = 'goal_contribution_plans_goal_id_not_blank'
  ) then
    alter table public.goal_contribution_plans
      add constraint goal_contribution_plans_goal_id_not_blank
      check (btrim(goal_id) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.budget_adjustments'::regclass
      and conname = 'budget_adjustments_values_nonnegative'
  ) then
    alter table public.budget_adjustments
      add constraint budget_adjustments_values_nonnegative check (
        target_remaining_spend >= 0
        and baseline_projected_total >= 0
        and adjustment_needed >= 0
        and suggested_weekly_reduction >= 0
      );
  end if;
end
$$;

create unique index if not exists budgets_user_month_normalized_category_uidx
  on public.budgets (user_id, month, lower(btrim(category)));

create unique index if not exists goals_one_primary_per_user_uidx
  on public.goals (user_id)
  where priority = 'primary';

with expected_constraints(table_name, constraint_name) as (
  values
    ('transactions', 'transactions_payment_not_blank'),
    ('transactions', 'transactions_amount_positive'),
    ('transactions', 'transactions_required_text_not_blank'),
    ('budgets', 'budgets_budget_positive'),
    ('budgets', 'budgets_required_text_not_blank'),
    ('goals', 'goals_target_amount_positive'),
    ('goals', 'goals_saved_amount_nonnegative'),
    ('goals', 'goals_saved_not_above_target'),
    ('goals', 'goals_required_text_not_blank'),
    ('goal_contribution_plans', 'goal_contribution_plans_values_nonnegative'),
    ('goal_contribution_plans', 'goal_contribution_plans_goal_id_not_blank'),
    ('budget_adjustments', 'budget_adjustments_values_nonnegative')
),
expected_indexes(table_name, index_name) as (
  values
    ('budgets', 'budgets_user_month_normalized_category_uidx'),
    ('goals', 'goals_one_primary_per_user_uidx')
),
snapshot as (
  select current_setting('moneypilot.financial_integrity_snapshot')::jsonb value
),
current_state as (
  select jsonb_build_object(
    'tables', (
      select jsonb_object_agg(c.relname, c.oid::text order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
        and c.relkind in ('r', 'p')
    ),
    'row_counts', jsonb_build_object(
      'transactions', (select count(*) from public.transactions),
      'budgets', (select count(*) from public.budgets),
      'budget_adjustments', (select count(*) from public.budget_adjustments),
      'goals', (select count(*) from public.goals),
      'goal_contribution_plans', (select count(*) from public.goal_contribution_plans)
    ),
    'rls', (
      select jsonb_object_agg(c.relname, c.relrowsecurity order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
        and c.relkind in ('r', 'p')
    ),
    'policies', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
      from (
        select tablename, policyname, permissive, roles, cmd, qual, with_check
        from pg_policies
        where schemaname = 'public'
          and tablename in ('transactions', 'budgets', 'budget_adjustments', 'goals', 'goal_contribution_plans')
      ) p
    )
  ) value
),
incompatible(check_name, count) as (
  select 'transactions_incompatible', count(*) from public.transactions
  where amount <= 0 or btrim(id) = '' or btrim(description) = ''
     or btrim(category) = '' or btrim(category_color) = '' or btrim(payment) = ''
     or btrim(date) = '' or btrim(origin) = ''
  union all
  select 'budgets_incompatible', count(*) from public.budgets
  where budget <= 0 or btrim(id) = '' or btrim(category) = ''
     or btrim(subtitle) = '' or btrim(color) = ''
  union all
  select 'goals_incompatible', count(*) from public.goals
  where target_amount <= 0 or saved_amount < 0 or saved_amount > target_amount
     or btrim(id) = '' or btrim(name) = ''
  union all
  select 'goal_contribution_plans_incompatible', count(*) from public.goal_contribution_plans
  where monthly_target < 0 or baseline_required_monthly_contribution < 0
     or savings_boost < 0 or btrim(goal_id) = ''
  union all
  select 'budget_adjustments_incompatible', count(*) from public.budget_adjustments
  where target_remaining_spend < 0 or baseline_projected_total < 0
     or adjustment_needed < 0 or suggested_weekly_reduction < 0
  union all
  select 'duplicate_normalized_budgets', count(*) from (
    select 1 from public.budgets
    group by user_id, month, lower(btrim(category)) having count(*) > 1
  ) duplicates
  union all
  select 'users_with_multiple_primary_goals', count(*) from (
    select 1 from public.goals where priority = 'primary'
    group by user_id having count(*) > 1
  ) duplicates
),
results(check_name, status, result) as (
  select
    'constraint:' || expected.table_name || '.' || expected.constraint_name,
    case when actual.oid is not null and actual.convalidated then 'ok' else 'failed' end,
    jsonb_build_object('exists', actual.oid is not null, 'validated', coalesce(actual.convalidated, false))
  from expected_constraints expected
  left join pg_constraint actual
    on actual.conrelid = format('public.%I', expected.table_name)::regclass
   and actual.conname = expected.constraint_name
  union all
  select
    'index:' || expected.table_name || '.' || expected.index_name,
    case when actual.indexname is not null then 'ok' else 'failed' end,
    jsonb_build_object('exists', actual.indexname is not null, 'definition', actual.indexdef)
  from expected_indexes expected
  left join pg_indexes actual
    on actual.schemaname = 'public'
   and actual.tablename = expected.table_name
   and actual.indexname = expected.index_name
  union all
  select check_name, case when count = 0 then 'ok' else 'failed' end, to_jsonb(count)
  from incompatible
  union all
  select 'tables_preserved',
    case when snapshot.value -> 'tables' = current_state.value -> 'tables' then 'ok' else 'failed' end,
    jsonb_build_object('unchanged', snapshot.value -> 'tables' = current_state.value -> 'tables')
  from snapshot cross join current_state
  union all
  select 'data_row_counts_preserved',
    case when snapshot.value -> 'row_counts' = current_state.value -> 'row_counts' then 'ok' else 'failed' end,
    jsonb_build_object(
      'unchanged', snapshot.value -> 'row_counts' = current_state.value -> 'row_counts',
      'counts', current_state.value -> 'row_counts'
    )
  from snapshot cross join current_state
  union all
  select 'rls_preserved',
    case when snapshot.value -> 'rls' = current_state.value -> 'rls'
           and not (current_state.value -> 'rls' @> '{"transactions": false}')
           and not (current_state.value -> 'rls' @> '{"budgets": false}')
           and not (current_state.value -> 'rls' @> '{"budget_adjustments": false}')
           and not (current_state.value -> 'rls' @> '{"goals": false}')
           and not (current_state.value -> 'rls' @> '{"goal_contribution_plans": false}')
      then 'ok' else 'failed' end,
    jsonb_build_object('unchanged', snapshot.value -> 'rls' = current_state.value -> 'rls', 'state', current_state.value -> 'rls')
  from snapshot cross join current_state
  union all
  select 'policies_preserved',
    case when snapshot.value -> 'policies' = current_state.value -> 'policies' then 'ok' else 'failed' end,
    jsonb_build_object(
      'unchanged', snapshot.value -> 'policies' = current_state.value -> 'policies',
      'policy_count', jsonb_array_length(current_state.value -> 'policies')
    )
  from snapshot cross join current_state
)
select check_name, status, result
from results
order by check_name;

rollback;
