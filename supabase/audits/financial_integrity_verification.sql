begin transaction read only;

with expected_constraints(table_name, constraint_name) as (
  values
    ('transactions', 'transactions_amount_positive'),
    ('transactions', 'transactions_required_text_not_blank'),
    ('transactions', 'transactions_payment_not_blank'),
    ('budgets', 'budgets_budget_positive'),
    ('budgets', 'budgets_required_text_not_blank'),
    ('budgets', 'budgets_month_format'),
    ('goals', 'goals_target_amount_positive'),
    ('goals', 'goals_saved_amount_nonnegative'),
    ('goals', 'goals_saved_not_above_target'),
    ('goals', 'goals_required_text_not_blank'),
    ('goals', 'goals_target_date_format'),
    ('goals', 'goals_priority_allowed'),
    ('goal_contribution_plans', 'goal_contribution_plans_values_nonnegative'),
    ('goal_contribution_plans', 'goal_contribution_plans_goal_id_not_blank'),
    ('budget_adjustments', 'budget_adjustments_values_nonnegative'),
    ('budget_adjustments', 'budget_adjustments_month_format')
),
expected_indexes(table_name, index_name) as (
  values
    ('budgets', 'budgets_user_month_normalized_category_uidx'),
    ('goals', 'goals_one_primary_per_user_uidx')
),
expected_policies(table_name, policy_name) as (
  values
    ('transactions', 'Users can view own transactions'),
    ('transactions', 'Users can insert own transactions'),
    ('transactions', 'Users can update own transactions'),
    ('transactions', 'Users can delete own transactions'),
    ('budgets', 'Users can view own budgets'),
    ('budgets', 'Users can insert own budgets'),
    ('budgets', 'Users can update own budgets'),
    ('budgets', 'Users can delete own budgets'),
    ('budget_adjustments', 'Users can view own budget adjustments'),
    ('budget_adjustments', 'Users can insert own budget adjustments'),
    ('budget_adjustments', 'Users can update own budget adjustments'),
    ('budget_adjustments', 'Users can delete own budget adjustments'),
    ('goals', 'Users can view own goals'),
    ('goals', 'Users can insert own goals'),
    ('goals', 'Users can update own goals'),
    ('goals', 'Users can delete own goals'),
    ('goal_contribution_plans', 'Users can view own goal contribution plans'),
    ('goal_contribution_plans', 'Users can insert own goal contribution plans'),
    ('goal_contribution_plans', 'Users can update own goal contribution plans'),
    ('goal_contribution_plans', 'Users can delete own goal contribution plans')
),
checks(section, check_name, incompatible_count) as (
  select '02_data', 'transactions_invalid', count(*)
  from public.transactions
  where amount <= 0
     or btrim(id) = '' or btrim(description) = '' or btrim(category) = ''
     or btrim(category_color) = '' or btrim(payment) = ''
     or btrim(date) = '' or btrim(origin) = ''
  union all
  select '02_data', 'budgets_invalid', count(*)
  from public.budgets
  where budget <= 0 or btrim(id) = '' or btrim(category) = ''
     or btrim(subtitle) = '' or btrim(color) = ''
  union all
  select '02_data', 'goals_invalid', count(*)
  from public.goals
  where target_amount <= 0 or saved_amount < 0 or saved_amount > target_amount
     or btrim(id) = '' or btrim(name) = ''
  union all
  select '02_data', 'goal_contribution_plans_invalid', count(*)
  from public.goal_contribution_plans
  where monthly_target < 0 or baseline_required_monthly_contribution < 0
     or savings_boost < 0 or btrim(goal_id) = ''
  union all
  select '02_data', 'budget_adjustments_invalid', count(*)
  from public.budget_adjustments
  where target_remaining_spend < 0 or baseline_projected_total < 0
     or adjustment_needed < 0 or suggested_weekly_reduction < 0
  union all
  select '02_data', 'duplicate_budgets', count(*)
  from (
    select 1
    from public.budgets
    group by user_id, month, lower(btrim(category))
    having count(*) > 1
  ) duplicates
  union all
  select '02_data', 'users_with_multiple_primary_goals', count(*)
  from (
    select 1
    from public.goals
    where priority = 'primary'
    group by user_id
    having count(*) > 1
  ) duplicates
),
results(section, check_name, status, result) as (
  select
    '01_schema',
    'constraint:' || expected.table_name || '.' || expected.constraint_name,
    case when actual.oid is null then 'missing' else 'ok' end,
    jsonb_build_object('exists', actual.oid is not null, 'validated', coalesce(actual.convalidated, false))
  from expected_constraints expected
  left join pg_constraint actual
    on actual.conrelid = format('public.%I', expected.table_name)::regclass
   and actual.conname = expected.constraint_name
  union all
  select
    '01_schema',
    'index:' || expected.table_name || '.' || expected.index_name,
    case when actual.indexname is null then 'missing' else 'ok' end,
    jsonb_build_object('exists', actual.indexname is not null, 'definition', actual.indexdef)
  from expected_indexes expected
  left join pg_indexes actual
    on actual.schemaname = 'public'
   and actual.tablename = expected.table_name
   and actual.indexname = expected.index_name
  union all
  select section, check_name,
    case when incompatible_count = 0 then 'ok' else 'incompatible_data' end,
    to_jsonb(incompatible_count)
  from checks
  union all
  select
    '03_security',
    'rls:' || expected.table_name,
    case when coalesce(actual.relrowsecurity, false) then 'ok' else 'missing' end,
    jsonb_build_object('enabled', coalesce(actual.relrowsecurity, false))
  from (values ('transactions'), ('budgets'), ('budget_adjustments'), ('goals'), ('goal_contribution_plans')) expected(table_name)
  left join pg_class actual
    on actual.relnamespace = 'public'::regnamespace
   and actual.relname = expected.table_name
  union all
  select
    '03_security',
    'policy:' || expected.table_name || '.' || expected.policy_name,
    case when actual.policyname is null then 'missing' else 'ok' end,
    jsonb_build_object('exists', actual.policyname is not null)
  from expected_policies expected
  left join pg_policies actual
    on actual.schemaname = 'public'
   and actual.tablename = expected.table_name
   and actual.policyname = expected.policy_name
)
select section, check_name, status, result
from results
order by section, check_name;

rollback;
