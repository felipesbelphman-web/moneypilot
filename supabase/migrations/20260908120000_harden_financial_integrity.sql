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
