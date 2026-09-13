WITH
expected_migrations(version) AS (
  VALUES
    ('20260910120000'),
    ('20260911120000'),
    ('20260912120000'),
    ('20260913120000')
),
capabilities AS (
  SELECT
    to_regclass('public.categories') IS NOT NULL AS has_categories,
    to_regclass('public.transactions') IS NOT NULL AS has_transactions,
    auth.uid() AS authenticated_user_id
),
migration_history AS (
  SELECT version::text AS version
  FROM supabase_migrations.schema_migrations
),
columns_catalog AS (
  SELECT
    cls.relname AS table_name,
    att.attnum AS ordinal_position,
    att.attname AS column_name,
    pg_catalog.format_type(att.atttypid, att.atttypmod) AS data_type,
    NOT att.attnotnull AS is_nullable,
    pg_get_expr(def.adbin, def.adrelid) AS column_default,
    att.attgenerated AS generated_kind,
    CASE WHEN att.attgenerated <> '' THEN pg_get_expr(def.adbin, def.adrelid) END AS generation_expression
  FROM pg_attribute att
  JOIN pg_class cls ON cls.oid = att.attrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  LEFT JOIN pg_attrdef def ON def.adrelid = att.attrelid AND def.adnum = att.attnum
  WHERE ns.nspname = 'public'
    AND cls.relname IN ('categories', 'transactions')
    AND att.attnum > 0
    AND NOT att.attisdropped
),
constraints_catalog AS (
  SELECT
    cls.relname AS table_name,
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    con.convalidated AS is_validated,
    pg_get_constraintdef(con.oid, true) AS definition
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  WHERE ns.nspname = 'public' AND cls.relname IN ('categories', 'transactions')
),
indexes_catalog AS (
  SELECT tablename AS table_name, indexname AS index_name, indexdef AS definition
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('categories', 'transactions')
),
triggers_catalog AS (
  SELECT
    cls.relname AS table_name,
    trg.tgname AS trigger_name,
    trg.tgenabled AS enabled_state,
    pg_get_triggerdef(trg.oid, true) AS definition,
    proc.proname AS function_name
  FROM pg_trigger trg
  JOIN pg_class cls ON cls.oid = trg.tgrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN pg_proc proc ON proc.oid = trg.tgfoid
  WHERE ns.nspname = 'public'
    AND cls.relname IN ('categories', 'transactions')
    AND NOT trg.tgisinternal
),
functions_catalog AS (
  SELECT
    proc.proname AS function_name,
    proc.prosecdef AS security_definer,
    proc.proconfig AS configuration,
    pg_get_functiondef(proc.oid) AS definition,
    has_function_privilege('anon', proc.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', proc.oid, 'EXECUTE') AS authenticated_can_execute,
    has_function_privilege('service_role', proc.oid, 'EXECUTE') AS service_role_can_execute
  FROM pg_proc proc
  JOIN pg_namespace ns ON ns.oid = proc.pronamespace
  WHERE ns.nspname = 'public'
    AND proc.proname IN ('set_updated_at', 'validate_transaction_category_assignment')
),
rls_catalog AS (
  SELECT cls.relname AS table_name, cls.relrowsecurity AS rls_enabled, cls.relforcerowsecurity AS rls_forced
  FROM pg_class cls
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  WHERE ns.nspname = 'public' AND cls.relname IN ('categories', 'transactions')
),
policies_catalog AS (
  SELECT tablename AS table_name, policyname AS policy_name, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('categories', 'transactions')
),
table_grants_catalog AS (
  SELECT grantor, grantee, table_name, privilege_type, is_grantable
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('categories', 'transactions')
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
column_grants_catalog AS (
  SELECT grantor, grantee, table_name, column_name, privilege_type, is_grantable
  FROM information_schema.role_column_grants
  WHERE table_schema = 'public'
    AND table_name IN ('categories', 'transactions')
    AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
data_audit AS (
  SELECT
    c.authenticated_user_id,
    count(*) FILTER (WHERE category.archived_at IS NULL AND category.name = 'Alimentação') AS alimentacao,
    count(*) FILTER (WHERE category.archived_at IS NULL AND category.name = 'Transporte') AS transporte,
    count(*) FILTER (WHERE category.name IN ('__MONEYPILOT_CATEGORY_E2E_20260911__', '__MONEYPILOT_TOAST_TEST_20260912__', '__MONEYPILOT_TOAST_FINAL_TEST__')) AS category_fixtures,
    (
      SELECT count(*)
      FROM public.transactions transaction_row
      WHERE transaction_row.user_id = c.authenticated_user_id
        AND (
          transaction_row.description IN ('__MONEYPILOT_CATEGORY_E2E_20260911__', '__MONEYPILOT_TOAST_TEST_20260912__', '__MONEYPILOT_TOAST_FINAL_TEST__')
          OR transaction_row.category IN ('__MONEYPILOT_CATEGORY_E2E_20260911__', '__MONEYPILOT_TOAST_TEST_20260912__', '__MONEYPILOT_TOAST_FINAL_TEST__')
          OR transaction_row.category_name_snapshot IN ('__MONEYPILOT_CATEGORY_E2E_20260911__', '__MONEYPILOT_TOAST_TEST_20260912__', '__MONEYPILOT_TOAST_FINAL_TEST__')
        )
    ) AS transaction_fixtures
  FROM capabilities c
  LEFT JOIN public.categories category ON category.user_id = c.authenticated_user_id
  GROUP BY c.authenticated_user_id
),
checks(section, check_name, status, evidence) AS (
  SELECT
    '01_migrations',
    'history_available',
    'PASS',
    jsonb_build_object('relation', 'supabase_migrations.schema_migrations', 'available', true)

  UNION ALL
  SELECT
    '01_migrations',
    'migration_' || expected.version,
    CASE WHEN history.version IS NOT NULL THEN 'PASS' ELSE 'MISSING' END,
    jsonb_build_object('expected_version', expected.version)
  FROM expected_migrations expected
  LEFT JOIN migration_history history ON history.version = expected.version

  UNION ALL
  SELECT
    '02_schema',
    'categories_table',
    CASE WHEN c.has_categories THEN 'PASS' ELSE 'MISSING' END,
    jsonb_build_object('exists', c.has_categories)
  FROM capabilities c

  UNION ALL
  SELECT
    '02_schema',
    'categories_columns',
    CASE WHEN
      count(*) = 10
      AND bool_and((ordinal_position, column_name, data_type, is_nullable) IN (
        (1, 'id', 'uuid', false),
        (2, 'user_id', 'uuid', false),
        (3, 'name', 'text', false),
        (4, 'type', 'text', false),
        (5, 'normalized_name', 'text', false),
        (6, 'icon_key', 'text', false),
        (7, 'color_token', 'text', false),
        (8, 'archived_at', 'timestamp with time zone', true),
        (9, 'created_at', 'timestamp with time zone', false),
        (10, 'updated_at', 'timestamp with time zone', false)
      ))
      AND bool_and(CASE
        WHEN column_name = 'id' THEN column_default ILIKE '%gen_random_uuid%'
        WHEN column_name IN ('created_at', 'updated_at') THEN column_default ILIKE '%now()%'
        WHEN column_name = 'normalized_name' THEN generated_kind = 's' AND generation_expression ILIKE '%normalize%' AND generation_expression ILIKE '%btrim%'
        ELSE column_default IS NULL
      END)
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(cols) ORDER BY ordinal_position), '[]'::jsonb)
  FROM columns_catalog cols WHERE table_name = 'categories'

  UNION ALL
  SELECT
    '02_schema',
    'transactions_integration_columns',
    CASE WHEN
      count(*) = 4
      AND bool_and((ordinal_position, column_name, data_type, is_nullable) IN (
        (14, 'category_id', 'uuid', true),
        (15, 'category_name_snapshot', 'text', true),
        (16, 'category_color_snapshot', 'text', true),
        (17, 'normalized_category_snapshot', 'text', true)
      ))
      AND bool_and(CASE WHEN column_name = 'normalized_category_snapshot' THEN generated_kind = 's' AND generation_expression ILIKE '%normalize%' ELSE column_default IS NULL END)
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(cols) ORDER BY ordinal_position), '[]'::jsonb)
  FROM columns_catalog cols
  WHERE table_name = 'transactions' AND column_name IN ('category_id', 'category_name_snapshot', 'category_color_snapshot', 'normalized_category_snapshot')

  UNION ALL
  SELECT
    '02_schema',
    'categories_constraints',
    CASE WHEN count(*) FILTER (WHERE constraint_name IN (
      'categories_pkey', 'categories_user_id_fkey', 'categories_user_id_id_key',
      'categories_user_id_id_type_key', 'categories_type_allowed',
      'categories_normalized_name_not_blank', 'categories_name_length',
      'categories_icon_key_format', 'categories_color_token_format'
    )) = 9 AND bool_and(is_validated) THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(cons) ORDER BY constraint_name), '[]'::jsonb)
  FROM constraints_catalog cons WHERE table_name = 'categories'

  UNION ALL
  SELECT
    '02_schema',
    'categories_indexes',
    CASE WHEN
      count(*) FILTER (WHERE index_name IN ('categories_pkey', 'categories_user_id_id_key', 'categories_user_id_id_type_key', 'categories_active_identity_uidx')) = 4
      AND count(*) FILTER (WHERE index_name = 'categories_active_identity_uidx' AND definition ILIKE '%unique%' AND definition ILIKE '%archived_at is null%') = 1
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(idx) ORDER BY index_name), '[]'::jsonb)
  FROM indexes_catalog idx WHERE table_name = 'categories'

  UNION ALL
  SELECT
    '02_schema',
    'transactions_categories_composite_fk',
    CASE WHEN count(*) FILTER (
      WHERE constraint_name = 'transactions_category_owner_type_fk'
        AND constraint_type = 'f'
        AND definition ILIKE '%foreign key (user_id, category_id, type)%'
        AND definition ILIKE '%references categories(user_id, id, type)%'
        AND definition ILIKE '%on delete set null (category_id)%'
    ) = 1 THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(cons) ORDER BY constraint_name), '[]'::jsonb)
  FROM constraints_catalog cons
  WHERE table_name = 'transactions' AND constraint_name = 'transactions_category_owner_type_fk'

  UNION ALL
  SELECT
    '02_schema',
    'transactions_snapshot_constraints_and_index',
    CASE WHEN
      (SELECT count(*) FROM constraints_catalog WHERE table_name = 'transactions' AND constraint_name IN ('transactions_category_snapshot_name_not_blank', 'transactions_category_snapshot_color_not_blank', 'transactions_category_snapshot_color_requires_name', 'transactions_linked_category_requires_snapshot')) = 4
      AND (SELECT count(*) FROM indexes_catalog WHERE table_name = 'transactions' AND index_name = 'transactions_user_category_type_idx' AND definition ILIKE '%category_id is not null%') = 1
    THEN 'PASS' ELSE 'DIFFERENT' END,
    jsonb_build_object(
      'constraints', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY constraint_name), '[]'::jsonb) FROM constraints_catalog x WHERE table_name = 'transactions' AND constraint_name LIKE 'transactions_%category%'),
      'indexes', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY index_name), '[]'::jsonb) FROM indexes_catalog x WHERE table_name = 'transactions' AND index_name = 'transactions_user_category_type_idx')
    )

  UNION ALL
  SELECT
    '03_functions_triggers',
    'association_function',
    CASE WHEN
      count(*) = 1
      AND bool_and(NOT security_definer)
      AND bool_and(configuration @> ARRAY['search_path='])
      AND bool_and(NOT anon_can_execute AND NOT authenticated_can_execute)
      AND bool_and(definition ILIKE '%category_row.user_id = new.user_id%')
      AND bool_and(definition ILIKE '%category_row.type = new.type%')
      AND bool_and(definition ILIKE '%category_row.archived_at is null%')
      AND bool_and(definition ILIKE '%new.category_name_snapshot := category_name%')
      AND bool_and(definition ILIKE '%old.category_id is not null%')
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(fn) ORDER BY function_name), '[]'::jsonb)
  FROM functions_catalog fn WHERE function_name = 'validate_transaction_category_assignment'

  UNION ALL
  SELECT
    '03_functions_triggers',
    'updated_at_and_association_triggers',
    CASE WHEN
      count(*) FILTER (WHERE table_name = 'categories' AND trigger_name = 'categories_set_updated_at' AND function_name = 'set_updated_at' AND definition ILIKE '%before update%') = 1
      AND count(*) FILTER (WHERE table_name = 'transactions' AND trigger_name = 'transactions_validate_category_assignment' AND function_name = 'validate_transaction_category_assignment' AND definition ILIKE '%before insert or update%') = 1
    THEN 'PASS' ELSE 'DIFFERENT' END,
    COALESCE(jsonb_agg(to_jsonb(trg) ORDER BY table_name, trigger_name), '[]'::jsonb)
  FROM triggers_catalog trg

  UNION ALL
  SELECT
    '04_rls_policies',
    table_name || '_rls',
    CASE WHEN rls_enabled AND NOT rls_forced THEN 'PASS' ELSE 'DIFFERENT' END,
    to_jsonb(rls)
  FROM rls_catalog rls

  UNION ALL
  SELECT
    '04_rls_policies',
    'categories_policies',
    CASE WHEN
      count(*) = 3
      AND count(*) FILTER (WHERE policy_name = 'Users can view own categories' AND cmd = 'SELECT' AND roles = ARRAY['authenticated'] AND qual ILIKE '%auth.uid()%user_id%' AND with_check IS NULL) = 1
      AND count(*) FILTER (WHERE policy_name = 'Users can insert own categories' AND cmd = 'INSERT' AND roles = ARRAY['authenticated'] AND qual IS NULL AND with_check ILIKE '%auth.uid()%user_id%') = 1
      AND count(*) FILTER (WHERE policy_name = 'Users can update own categories' AND cmd = 'UPDATE' AND roles = ARRAY['authenticated'] AND qual ILIKE '%auth.uid()%user_id%' AND with_check ILIKE '%auth.uid()%user_id%') = 1
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(pol) ORDER BY policy_name), '[]'::jsonb)
  FROM policies_catalog pol WHERE table_name = 'categories'

  UNION ALL
  SELECT
    '04_rls_policies',
    'transactions_ownership_policies',
    CASE WHEN
      count(*) = 4
      AND count(*) FILTER (WHERE cmd = 'SELECT' AND roles = ARRAY['authenticated'] AND qual ILIKE '%auth.uid()%user_id%') = 1
      AND count(*) FILTER (WHERE cmd = 'INSERT' AND roles = ARRAY['authenticated'] AND with_check ILIKE '%auth.uid()%user_id%') = 1
      AND count(*) FILTER (WHERE cmd = 'UPDATE' AND roles = ARRAY['authenticated'] AND qual ILIKE '%auth.uid()%user_id%' AND with_check ILIKE '%auth.uid()%user_id%') = 1
      AND count(*) FILTER (WHERE cmd = 'DELETE' AND roles = ARRAY['authenticated'] AND qual ILIKE '%auth.uid()%user_id%') = 1
    THEN 'PASS' ELSE CASE WHEN count(*) = 0 THEN 'MISSING' ELSE 'DIFFERENT' END END,
    COALESCE(jsonb_agg(to_jsonb(pol) ORDER BY policy_name), '[]'::jsonb)
  FROM policies_catalog pol WHERE table_name = 'transactions'

  UNION ALL
  SELECT
    '05_grants',
    'categories_authenticated_grants',
    CASE WHEN
      has_table_privilege('authenticated', 'public.categories', 'SELECT')
      AND NOT has_table_privilege('authenticated', 'public.categories', 'DELETE')
      AND NOT has_table_privilege('authenticated', 'public.categories', 'TRUNCATE')
      AND NOT has_table_privilege('authenticated', 'public.categories', 'REFERENCES')
      AND NOT has_table_privilege('authenticated', 'public.categories', 'TRIGGER')
      AND has_column_privilege('authenticated', 'public.categories', 'archived_at', 'UPDATE')
    THEN 'PASS' ELSE 'DIFFERENT' END,
    jsonb_build_object(
      'table', (SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY privilege_type), '[]'::jsonb) FROM table_grants_catalog g WHERE table_name = 'categories' AND grantee = 'authenticated'),
      'columns', (SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY privilege_type, column_name), '[]'::jsonb) FROM column_grants_catalog g WHERE table_name = 'categories' AND grantee = 'authenticated')
    )
  FROM capabilities c WHERE c.has_categories

  UNION ALL
  SELECT
    '05_grants',
    'categories_role_grants_inventory',
    CASE WHEN
      NOT has_table_privilege('anon', 'public.categories', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      AND NOT EXISTS (SELECT 1 FROM table_grants_catalog g WHERE g.table_name = 'categories' AND g.grantee = 'PUBLIC')
      AND NOT EXISTS (SELECT 1 FROM column_grants_catalog g WHERE g.table_name = 'categories' AND g.grantee = 'PUBLIC')
    THEN 'PASS' ELSE 'DIFFERENT' END,
    jsonb_build_object(
      'table_grants', (SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY grantee, privilege_type), '[]'::jsonb) FROM table_grants_catalog g WHERE table_name = 'categories'),
      'column_grants', (SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY grantee, privilege_type, column_name), '[]'::jsonb) FROM column_grants_catalog g WHERE table_name = 'categories')
    )
  FROM capabilities c WHERE c.has_categories

  UNION ALL
  SELECT
    '06_assignment_protection',
    'owner_type_and_archived_category_protection',
    CASE WHEN
      (SELECT count(*) FROM constraints_catalog WHERE constraint_name = 'transactions_category_owner_type_fk') = 1
      AND (SELECT count(*) FROM functions_catalog WHERE function_name = 'validate_transaction_category_assignment' AND definition ILIKE '%category_row.user_id = new.user_id%' AND definition ILIKE '%category_row.type = new.type%' AND definition ILIKE '%category_row.archived_at is null%') = 1
    THEN 'PASS' ELSE 'DIFFERENT' END,
    jsonb_build_object('cross_user_and_type', 'composite foreign key plus trigger', 'archived', 'trigger rejects new or changed links')

  UNION ALL
  SELECT
    '07_authenticated_data',
    'permanent_categories',
    CASE
      WHEN authenticated_user_id IS NULL THEN 'NOT VERIFIED'
      WHEN alimentacao >= 1 AND transporte >= 1 THEN 'PASS'
      ELSE 'MISSING'
    END,
    CASE WHEN authenticated_user_id IS NULL THEN jsonb_build_object('reason', 'authenticated user context required') ELSE jsonb_build_object(
      'Alimentação', alimentacao,
      'Transporte', transporte
    ) END
  FROM data_audit

  UNION ALL
  SELECT
    '07_authenticated_data',
    'temporary_fixtures_absent',
    CASE
      WHEN authenticated_user_id IS NULL THEN 'NOT VERIFIED'
      WHEN category_fixtures = 0 AND transaction_fixtures = 0 THEN 'PASS'
      ELSE 'DIFFERENT'
    END,
    CASE WHEN authenticated_user_id IS NULL THEN jsonb_build_object('reason', 'authenticated user context required') ELSE jsonb_build_object(
      'category_rows', category_fixtures,
      'transaction_rows', transaction_fixtures
    ) END
  FROM data_audit
)
SELECT section, check_name, status, evidence
FROM checks
ORDER BY section, check_name;
