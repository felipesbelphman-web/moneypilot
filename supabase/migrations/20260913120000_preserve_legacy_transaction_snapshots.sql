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
  -- New legacy writes become distinguishable from canonical unlinks by always
  -- carrying historical snapshots, without inventing a category association.
  if tg_op = 'INSERT' and new.category_id is null then
    if new.category_name_snapshot is null then
      new.category_name_snapshot := new.category;
    end if;
    if new.category_color_snapshot is null then
      new.category_color_snapshot := new.category_color;
    end if;
    return new;
  end if;

  -- An explicit unlink is the only transition that clears snapshots.
  if tg_op = 'UPDATE'
    and old.category_id is not null
    and new.category_id is null
  then
    new.category_name_snapshot := null;
    new.category_color_snapshot := null;
    return new;
  end if;

  -- Once unlinked, preserve the existing classification exactly. Legacy rows
  -- remain legacy and canonical uncategorized rows remain uncategorized.
  if tg_op = 'UPDATE'
    and old.category_id is null
    and new.category_id is null
  then
    new.category_name_snapshot := old.category_name_snapshot;
    new.category_color_snapshot := old.category_color_snapshot;
    return new;
  end if;

  -- Existing links are not revalidated for unrelated updates, so later
  -- category archival does not prevent editing other transaction fields.
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

revoke execute on function public.validate_transaction_category_assignment() from public;
revoke execute on function public.validate_transaction_category_assignment() from anon;
revoke execute on function public.validate_transaction_category_assignment() from authenticated;
