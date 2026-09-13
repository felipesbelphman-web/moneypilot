BEGIN TRANSACTION READ ONLY;

-- Single-result, read-only MoneyPilot remote audit.
WITH caps AS (
  SELECT
    to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS migrations,
    to_regclass('storage.buckets') IS NOT NULL AS buckets,
    to_regclass('public.transactions') IS NOT NULL AS transactions,
    to_regclass('public.budgets') IS NOT NULL AS budgets,
    to_regclass('public.goals') IS NOT NULL AS goals,
    to_regclass('public.investments') IS NOT NULL AS investments,
    to_regclass('public.budget_adjustments') IS NOT NULL AS adjustments,
    to_regclass('public.goal_contribution_plans') IS NOT NULL AS plans
), dynamic_results AS (
  SELECT
    CASE WHEN migrations THEN query_to_xml('select version::text as migration_version from supabase_migrations.schema_migrations order by version', false, false, '') END migrations_xml,
    CASE WHEN buckets AND (SELECT count(*) = 5 FROM information_schema.columns WHERE table_schema='storage' AND table_name='buckets' AND column_name IN ('id','name','public','file_size_limit','allowed_mime_types')) THEN query_to_xml('select id, name, public, file_size_limit, allowed_mime_types from storage.buckets where id=''avatars''', false, false, '') END bucket_xml,
    CASE WHEN transactions AND (SELECT count(*)=1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='amount') THEN query_to_xml('select count(*) n from public.transactions where amount<=0',false,false,'') END tx_amount,
    CASE WHEN budgets AND (SELECT count(*)=1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name='budget') THEN query_to_xml('select count(*) n from public.budgets where budget<0',false,false,'') END budget_negative,
    CASE WHEN goals AND (SELECT count(*)=2 FROM information_schema.columns WHERE table_schema='public' AND table_name='goals' AND column_name IN ('target_amount','saved_amount')) THEN query_to_xml('select count(*) n from public.goals where target_amount<0 or saved_amount<0',false,false,'') END goal_negative,
    CASE WHEN goals AND (SELECT count(*)=2 FROM information_schema.columns WHERE table_schema='public' AND table_name='goals' AND column_name IN ('target_amount','saved_amount')) THEN query_to_xml('select count(*) n from public.goals where saved_amount>target_amount',false,false,'') END goal_above,
    CASE WHEN transactions AND (SELECT count(*)=8 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('id','description','category','category_color','payment','date','origin','type')) THEN query_to_xml('select count(*) n from public.transactions where btrim(id)='''' or btrim(description)='''' or btrim(category)='''' or btrim(category_color)='''' or btrim(payment)='''' or btrim(date)='''' or btrim(origin)='''' or btrim(type)=''''',false,false,'') END tx_blank,
    CASE WHEN budgets AND (SELECT count(*)=5 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name IN ('id','category','subtitle','month','color')) THEN query_to_xml('select count(*) n from public.budgets where btrim(id)='''' or btrim(category)='''' or btrim(subtitle)='''' or btrim(month)='''' or btrim(color)=''''',false,false,'') END budget_blank,
    CASE WHEN goals AND (SELECT count(*)=4 FROM information_schema.columns WHERE table_schema='public' AND table_name='goals' AND column_name IN ('id','name','target_date','priority')) THEN query_to_xml('select count(*) n from public.goals where btrim(id)='''' or btrim(name)='''' or btrim(target_date)='''' or btrim(priority)=''''',false,false,'') END goal_blank,
    CASE WHEN investments AND (SELECT count(*)=5 FROM information_schema.columns WHERE table_schema='public' AND table_name='investments' AND column_name IN ('id','name','asset_type','price_mode','native_currency')) THEN query_to_xml('select count(*) n from public.investments where btrim(id)='''' or btrim(name)='''' or btrim(asset_type)='''' or btrim(price_mode)='''' or btrim(native_currency)=''''',false,false,'') END investment_blank,
    CASE WHEN adjustments AND (SELECT count(*)=1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_adjustments' AND column_name='month') THEN query_to_xml('select count(*) n from public.budget_adjustments where btrim(month)=''''',false,false,'') END adjustment_blank,
    CASE WHEN plans AND (SELECT count(*)=1 FROM information_schema.columns WHERE table_schema='public' AND table_name='goal_contribution_plans' AND column_name='goal_id') THEN query_to_xml('select count(*) n from public.goal_contribution_plans where btrim(goal_id)=''''',false,false,'') END plan_blank,
    CASE WHEN budgets AND (SELECT count(*)=3 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name IN ('user_id','month','category')) THEN query_to_xml('select count(*) n from (select 1 from public.budgets group by user_id,month,lower(btrim(category)) having count(*)>1) d',false,false,'') END budget_duplicates,
    CASE WHEN goals AND (SELECT count(*)=2 FROM information_schema.columns WHERE table_schema='public' AND table_name='goals' AND column_name IN ('user_id','priority')) THEN query_to_xml('select count(*) n from (select 1 from public.goals where priority=''primary'' group by user_id having count(*)>1) d',false,false,'') END primary_duplicates,
    CASE WHEN transactions AND (SELECT count(*)=2 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('date','date_iso')) THEN query_to_xml($q$
      select count(*) n from public.transactions
      cross join lateral (select regexp_match(btrim(date),'^([0-9]{1,2})[[:space:]]+(.+)[[:space:]]+([0-9]{4})$') p) r
      cross join lateral (select case lower(r.p[2])
        when 'january' then 1 when 'janeiro' then 1 when 'enero' then 1 when 'januar' then 1 when 'janvier' then 1 when 'januari' then 1 when 'gennaio' then 1
        when 'february' then 2 when 'fevereiro' then 2 when 'febrero' then 2 when 'februar' then 2 when 'février' then 2 when 'februari' then 2 when 'febbraio' then 2
        when 'march' then 3 when 'março' then 3 when 'marzo' then 3 when 'märz' then 3 when 'mars' then 3 when 'maart' then 3
        when 'april' then 4 when 'abril' then 4 when 'avril' then 4 when 'aprile' then 4
        when 'may' then 5 when 'maio' then 5 when 'mayo' then 5 when 'mai' then 5 when 'mei' then 5 when 'maggio' then 5
        when 'june' then 6 when 'junho' then 6 when 'junio' then 6 when 'juni' then 6 when 'juin' then 6 when 'giugno' then 6
        when 'july' then 7 when 'julho' then 7 when 'julio' then 7 when 'juli' then 7 when 'juillet' then 7 when 'luglio' then 7
        when 'august' then 8 when 'agosto' then 8 when 'augustus' then 8 when 'août' then 8
        when 'september' then 9 when 'setembro' then 9 when 'septiembre' then 9 when 'septembre' then 9 when 'settembre' then 9
        when 'october' then 10 when 'outubro' then 10 when 'octubre' then 10 when 'oktober' then 10 when 'octobre' then 10 when 'ottobre' then 10
        when 'november' then 11 when 'novembro' then 11 when 'noviembre' then 11 when 'novembre' then 11
        when 'december' then 12 when 'dezembro' then 12 when 'diciembre' then 12 when 'dezember' then 12 when 'décembre' then 12 when 'decembre' then 12 when 'dicembre' then 12 end m) lm
      where r.p is null or lm.m is null or r.p[1]::int<>extract(day from date_iso)::int or lm.m<>extract(month from date_iso)::int or r.p[3]::int<>extract(year from date_iso)::int
    $q$,false,false,'') END date_mismatch
  FROM caps
), rows(section,check_name,status,result) AS (
  SELECT '01_migrations','registered_versions',CASE WHEN migrations_xml IS NULL THEN 'unavailable' ELSE 'available' END,CASE WHEN migrations_xml IS NULL THEN NULL ELSE to_jsonb((xpath('/table/row/migration_version/text()',migrations_xml))::text[]) END FROM dynamic_results
  UNION ALL SELECT '02_schema','tables_and_rls','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name),'[]') FROM (SELECT c.relname table_name,c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p')) x
  UNION ALL SELECT '02_schema','columns','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name,ordinal_position),'[]') FROM (SELECT table_name,ordinal_position,column_name,data_type,udt_schema,udt_name,character_maximum_length,numeric_precision,numeric_scale,datetime_precision,column_default,is_nullable,is_identity,identity_generation,is_generated,generation_expression FROM information_schema.columns WHERE table_schema='public') x
  UNION ALL SELECT '02_schema','primary_and_foreign_keys','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name,constraint_name),'[]') FROM (SELECT r.relname table_name,c.conname constraint_name,c.contype::text constraint_type,pg_get_constraintdef(c.oid,true) definition FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public' AND c.contype IN ('p','f')) x
  UNION ALL SELECT '02_schema','constraints','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name,constraint_name),'[]') FROM (SELECT r.relname table_name,c.conname constraint_name,c.contype::text constraint_type,c.convalidated is_validated,pg_get_constraintdef(c.oid,true) definition FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public') x
  UNION ALL SELECT '02_schema','indexes','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name,index_name),'[]') FROM (SELECT tablename table_name,indexname index_name,indexdef definition FROM pg_indexes WHERE schemaname='public') x
  UNION ALL SELECT '02_schema','triggers','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_name,trigger_name),'[]') FROM (SELECT r.relname table_name,t.tgname trigger_name,t.tgenabled enabled_state,pg_get_triggerdef(t.oid,true) definition FROM pg_trigger t JOIN pg_class r ON r.oid=t.tgrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal) x
  UNION ALL SELECT '03_security','policies','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY schemaname,tablename,policyname),'[]') FROM (SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' OR (schemaname='storage' AND tablename='objects' AND (coalesce(qual,'') ILIKE '%avatars%' OR coalesce(with_check,'') ILIKE '%avatars%'))) x
  UNION ALL SELECT '03_security','grants','available',coalesce(jsonb_agg(to_jsonb(x) ORDER BY table_schema,table_name,grantee,privilege_type),'[]') FROM (SELECT table_schema,table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema IN ('public','storage') AND grantee IN ('anon','authenticated')) x
  UNION ALL SELECT '03_security','avatars_bucket',CASE WHEN bucket_xml IS NULL THEN 'unavailable' ELSE 'available' END,CASE WHEN bucket_xml IS NULL THEN NULL ELSE jsonb_build_object('id',(xpath('/table/row/id/text()',bucket_xml))[1]::text,'name',(xpath('/table/row/name/text()',bucket_xml))[1]::text,'public',(xpath('/table/row/public/text()',bucket_xml))[1]::text,'file_size_limit',(xpath('/table/row/file_size_limit/text()',bucket_xml))[1]::text,'allowed_mime_types',(xpath('/table/row/allowed_mime_types/text()',bucket_xml))[1]::text) END FROM dynamic_results
  UNION ALL SELECT '04_data_quality',v.check_name,CASE WHEN v.x IS NULL THEN 'unavailable' ELSE 'available' END,CASE WHEN v.x IS NULL THEN NULL ELSE to_jsonb(((xpath('/table/row/n/text()',v.x))[1]::text)::bigint) END FROM dynamic_results d CROSS JOIN LATERAL (VALUES
    ('transactions_amount_not_positive',d.tx_amount),('budgets_negative_value',d.budget_negative),('goals_negative_values',d.goal_negative),('goals_saved_above_target',d.goal_above),('transactions_required_strings_blank',d.tx_blank),('budgets_required_strings_blank',d.budget_blank),('goals_required_strings_blank',d.goal_blank),('investments_required_strings_blank',d.investment_blank),('budget_adjustments_required_strings_blank',d.adjustment_blank),('goal_contribution_plans_required_strings_blank',d.plan_blank),('duplicate_budget_groups_by_user_month_category',d.budget_duplicates),('users_with_multiple_primary_goals',d.primary_duplicates),('transactions_date_text_diverges_from_date_iso',d.date_mismatch)
  ) v(check_name,x)
)
SELECT section,check_name,status,result FROM rows ORDER BY section,check_name;

ROLLBACK;
