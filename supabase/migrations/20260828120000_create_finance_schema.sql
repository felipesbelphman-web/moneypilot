create table public.transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  description text not null,
  category text not null,
  category_color text not null,
  payment text not null,
  date text not null,
  date_iso date not null,
  origin text not null,
  type text not null,
  amount numeric(18,4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint transactions_type_allowed check (type in ('income', 'expense'))
);

create table public.budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  category text not null,
  subtitle text not null,
  budget numeric(18,4) not null,
  month text not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint budgets_month_format check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

-- The composite key preserves one accepted adjustment per user and month.
create table public.budget_adjustments (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  target_remaining_spend numeric(18,4) not null,
  baseline_projected_total numeric(18,4) not null,
  adjustment_needed numeric(18,4) not null,
  suggested_weekly_reduction numeric(18,4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month),
  constraint budget_adjustments_month_format check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

create table public.goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  target_amount numeric(18,4) not null,
  saved_amount numeric(18,4) not null,
  target_date text not null,
  priority text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint goals_target_date_format check (target_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint goals_priority_allowed check (priority in ('primary', 'secondary'))
);

-- The composite key and foreign key enforce one plan for an owned goal.
create table public.goal_contribution_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id text not null,
  monthly_target numeric(18,4) not null,
  baseline_required_monthly_contribution numeric(18,4) not null,
  savings_boost numeric(18,4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, goal_id),
  constraint goal_contribution_plans_goal_fk
    foreign key (user_id, goal_id)
    references public.goals(user_id, id)
    on delete cascade
);

create index transactions_user_date_iso_idx on public.transactions (user_id, date_iso);
create index budgets_user_month_idx on public.budgets (user_id, month);
create index goals_user_target_date_idx on public.goals (user_id, target_date);

create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();
create trigger budgets_set_updated_at before update on public.budgets
for each row execute function public.set_updated_at();
create trigger budget_adjustments_set_updated_at before update on public.budget_adjustments
for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
for each row execute function public.set_updated_at();
create trigger goal_contribution_plans_set_updated_at before update on public.goal_contribution_plans
for each row execute function public.set_updated_at();

revoke all on table public.transactions, public.budgets, public.budget_adjustments, public.goals, public.goal_contribution_plans from anon;
revoke all on table public.transactions, public.budgets, public.budget_adjustments, public.goals, public.goal_contribution_plans from authenticated;
grant select, insert, update, delete on table public.transactions, public.budgets, public.budget_adjustments, public.goals, public.goal_contribution_plans to authenticated;

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_adjustments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contribution_plans enable row level security;

create policy "Users can view own transactions" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own transactions" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own transactions" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own transactions" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own budgets" on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own budgets" on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own budgets" on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own budgets" on public.budgets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own budget adjustments" on public.budget_adjustments for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own budget adjustments" on public.budget_adjustments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own budget adjustments" on public.budget_adjustments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own budget adjustments" on public.budget_adjustments for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own goals" on public.goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own goals" on public.goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own goals" on public.goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own goals" on public.goals for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own goal contribution plans" on public.goal_contribution_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own goal contribution plans" on public.goal_contribution_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own goal contribution plans" on public.goal_contribution_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own goal contribution plans" on public.goal_contribution_plans for delete to authenticated using ((select auth.uid()) = user_id);
