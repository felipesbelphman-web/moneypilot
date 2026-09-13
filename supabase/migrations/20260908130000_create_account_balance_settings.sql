create table public.account_balance_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opening_balance numeric(18,4) not null,
  opening_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_balance_settings_opening_balance_finite
    check (opening_balance::text not in ('NaN', 'Infinity', '-Infinity'))
);

create trigger account_balance_settings_set_updated_at
before update on public.account_balance_settings
for each row execute function public.set_updated_at();

revoke all on table public.account_balance_settings from anon;
revoke all on table public.account_balance_settings from authenticated;
grant select, insert, update, delete on table public.account_balance_settings to authenticated;

alter table public.account_balance_settings enable row level security;

create policy "Users can view own account balance settings"
on public.account_balance_settings for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own account balance settings"
on public.account_balance_settings for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own account balance settings"
on public.account_balance_settings for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own account balance settings"
on public.account_balance_settings for delete to authenticated
using ((select auth.uid()) = user_id);
