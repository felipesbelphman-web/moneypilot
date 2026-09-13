BEGIN TRANSACTION READ ONLY;

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
  SELECT 'schema', 'primary_key', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings' AND constraint_type = 'PRIMARY KEY'
  UNION ALL
  SELECT 'schema', 'foreign_key', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings' AND constraint_type = 'FOREIGN KEY'
  UNION ALL
  SELECT 'schema', 'finite_balance_constraint', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'account_balance_settings'
    AND constraint_name = 'account_balance_settings_opening_balance_finite' AND constraint_type = 'CHECK'
  UNION ALL
  SELECT 'schema', 'updated_at_trigger', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM information_schema.triggers
  WHERE event_object_schema = 'public' AND event_object_table = 'account_balance_settings'
    AND trigger_name = 'account_balance_settings_set_updated_at'
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
  SELECT 'security', 'authenticated_grants', CASE WHEN count(*) = 4 THEN 'ok' ELSE 'error' END,
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
  SELECT 'data', 'row_count', 'info', jsonb_build_object('count', count(*))
  FROM public.account_balance_settings
  UNION ALL
  SELECT 'data', 'non_finite_opening_balances', CASE WHEN count(*) = 0 THEN 'ok' ELSE 'error' END,
    jsonb_build_object('count', count(*))
  FROM public.account_balance_settings
  WHERE opening_balance::text IN ('NaN', 'Infinity', '-Infinity')
)
SELECT section, check_name, status, result
FROM checks
ORDER BY section, check_name;

ROLLBACK;
