do $$
begin
  if current_setting('server_version_num')::integer < 170000 then
    raise exception
      'transaction/category ownership requires PostgreSQL 17 or newer';
  end if;
end
$$;

alter table public.transactions
  add column category_id uuid,
  add column category_name_snapshot text,
  add column category_color_snapshot text,
  add column normalized_category_snapshot text generated always as (
    lower(btrim(normalize(category_name_snapshot, NFC)))
  ) stored;

-- Preserve the legacy display values exactly. Linking is deliberately stricter:
-- only one active category owned by the same user, with the same transaction
-- type and normalized name, is safe to associate automatically.
update public.transactions
set
  category_name_snapshot = category,
  category_color_snapshot = category_color;

update public.transactions as transaction_row
set category_id = (
  select category_row.id
  from public.categories as category_row
  where category_row.user_id = transaction_row.user_id
    and category_row.type = transaction_row.type
    and category_row.normalized_name = transaction_row.normalized_category_snapshot
    and category_row.archived_at is null
  order by category_row.id
  limit 1
)
where (
  select count(*)
  from public.categories as category_row
  where category_row.user_id = transaction_row.user_id
    and category_row.type = transaction_row.type
    and category_row.normalized_name = transaction_row.normalized_category_snapshot
    and category_row.archived_at is null
) = 1;

alter table public.transactions
  add constraint transactions_category_snapshot_name_not_blank
    check (
      category_name_snapshot is null
      or btrim(category_name_snapshot) <> ''
    ),
  add constraint transactions_category_snapshot_color_not_blank
    check (
      category_color_snapshot is null
      or btrim(category_color_snapshot) <> ''
    ),
  add constraint transactions_category_snapshot_color_requires_name
    check (
      category_name_snapshot is not null
      or category_color_snapshot is null
    ),
  add constraint transactions_linked_category_requires_snapshot
    check (
      category_id is null
      or (
        category_name_snapshot is not null
        and category_color_snapshot is not null
      )
    ),
  add constraint transactions_category_owner_type_fk
    foreign key (user_id, category_id, type)
    references public.categories (user_id, id, type)
    on delete set null (category_id);

create index transactions_user_category_type_idx
  on public.transactions (user_id, category_id, type)
  where category_id is not null;

create function public.validate_transaction_category_assignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_name text;
  category_color text;
begin
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

  -- Snapshots are database-derived at association time and remain unchanged by
  -- later category renames or archival.
  new.category_name_snapshot := category_name;
  new.category_color_snapshot := category_color;

  return new;
end
$$;

create trigger transactions_validate_category_assignment
before insert or update on public.transactions
for each row execute function public.validate_transaction_category_assignment();

-- The function is an internal trigger contract, not a callable client API.
revoke execute on function public.validate_transaction_category_assignment() from public;
revoke execute on function public.validate_transaction_category_assignment() from anon;
revoke execute on function public.validate_transaction_category_assignment() from authenticated;
