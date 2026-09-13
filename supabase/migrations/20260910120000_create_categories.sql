create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  normalized_name text generated always as (
    lower(btrim(normalize(name, NFC)))
  ) stored not null,
  icon_key text not null,
  color_token text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_type_allowed
    check (type in ('income', 'expense')),
  constraint categories_user_id_id_key
    unique (user_id, id),
  constraint categories_user_id_id_type_key
    unique (user_id, id, type),
  constraint categories_normalized_name_not_blank
    check (normalized_name <> ''),
  constraint categories_name_length
    check (char_length(btrim(name)) between 1 and 100),
  -- Extensible token grammar, not a closed allowlist: lowercase ASCII keys,
  -- digits, hyphens and underscores, with a lowercase letter first.
  constraint categories_icon_key_format
    check (
      char_length(icon_key) between 1 and 64
      and icon_key ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint categories_color_token_format
    check (
      char_length(color_token) between 1 and 64
      and color_token ~ '^[a-z][a-z0-9_-]*$'
    )
);

-- NFC canonicalization intentionally preserves accents and NBSP. lower() is
-- locale-aware lowercasing, not full Unicode case folding.
create unique index categories_active_identity_uidx
  on public.categories (user_id, type, normalized_name)
  where archived_at is null;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

revoke all on table public.categories from public;
revoke all on table public.categories from anon;
revoke all on table public.categories from authenticated;

grant select on table public.categories to authenticated;
grant insert (
  id,
  user_id,
  name,
  type,
  icon_key,
  color_token,
  archived_at
) on table public.categories to authenticated;
grant update (
  name,
  icon_key,
  color_token,
  archived_at
) on table public.categories to authenticated;

alter table public.categories enable row level security;

create policy "Users can view own categories"
on public.categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own categories"
on public.categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own categories"
on public.categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Trigger execution privileges are checked when CREATE TRIGGER runs. Revoking
-- direct role access does not prevent existing or newly-created triggers from
-- invoking this SECURITY INVOKER trigger function.
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;
