create or replace function public.validate_transaction_category_assignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_name text;
  category_color text;
begin
  -- Canonical unlinking clears only snapshots that belonged to an existing
  -- category link. Rows that were already unlinked keep legacy snapshots.
  if tg_op = 'UPDATE'
    and old.category_id is not null
    and new.category_id is null
  then
    new.category_name_snapshot := null;
    new.category_color_snapshot := null;
    return new;
  end if;

  -- Legacy inserts and unrelated updates to already-unlinked rows preserve
  -- any snapshots supplied by the transitional legacy flow.
  if new.category_id is null then
    return new;
  end if;

  -- Existing historical links remain valid after archival. Revalidate only a
  -- new association or a real ownership/type/category change.
  if tg_op = 'UPDATE'
    and new.user_id is not distinct from old.user_id
    and new.category_id is not distinct from old.category_id
    and new.type is not distinct from old.type
  then
    return new;
  end if;

  select category_row.name, category_row.color_token
  into category_name, category_color
  from public.categories as category_row
  where category_row.user_id = new.user_id
    and category_row.id = new.category_id
    and category_row.type = new.type
    and category_row.archived_at is null
  for share;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'transaction category must be active and owned by the transaction user';
  end if;

  new.category_name_snapshot := category_name;
  new.category_color_snapshot := category_color;

  return new;
end
$$;

-- Keep the trigger function internal while preserving execution through the
-- trigger that was installed by the preceding migration.
revoke execute on function public.validate_transaction_category_assignment() from public;
revoke execute on function public.validate_transaction_category_assignment() from anon;
revoke execute on function public.validate_transaction_category_assignment() from authenticated;

-- RLS policies remain unchanged and continue to enforce row ownership.
revoke all on table public.categories from anon;
revoke delete, truncate, references, trigger on table public.categories from authenticated;
grant select, insert, update on table public.categories to authenticated;
