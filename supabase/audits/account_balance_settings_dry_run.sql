BEGIN;

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

WITH checks AS (
  SELECT 'schema'::text AS section, 'table_exists'::text AS check_name,
    CASE WHEN to_regclass('public.account_balance_settings') IS NOT NULL THEN 'ok' ELSE 'error' END AS status,
    jsonb_build_object('exists', to_regclass('public.account_balance_settings') IS NOT NULL) AS result
  UNION ALL
  SELECT 'schema', 'columns',
    CASE WHEN count(*) = 5 THEN 'ok' ELSE 'error' END,
    jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type, 'nullable', is_nullable, 'default', column_default) ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings'
  UNION ALL
  SELECT 'security', 'rls_enabled', CASE WHEN c.relrowsecurity THEN 'ok' ELSE 'error' END,
    jsonb_build_object('enabled', c.relrowsecurity)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'account_balance_settings'
  UNION ALL
  SELECT 'security', 'policies', CASE WHEN count(*) = 4 THEN 'ok' ELSE 'error' END,
    jsonb_agg(jsonb_build_object('name', policyname, 'command', cmd) ORDER BY policyname)
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'account_balance_settings'
  UNION ALL
  SELECT 'security', 'authenticated_grants',
    CASE WHEN count(*) = 4 THEN 'ok' ELSE 'error' END,
    to_jsonb(array_agg(privilege_type ORDER BY privilege_type))
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings' AND grantee = 'authenticated'
    AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  UNION ALL
  SELECT 'security', 'anon_grants', CASE WHEN count(*) = 0 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings' AND grantee = 'anon'
  UNION ALL
  SELECT 'schema', 'updated_at_trigger', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.triggers
  WHERE event_object_schema = 'public' AND event_object_table = 'account_balance_settings'
    AND trigger_name = 'account_balance_settings_set_updated_at'
  UNION ALL
  SELECT 'data', 'rows_created_automatically', CASE WHEN count(*) = 0 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM public.account_balance_settings
)
SELECT section, check_name, status, result
FROM checks
ORDER BY section, check_name;

ROLLBACK;
