create table public.investments (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  symbol text,
  asset_type text not null,
  quantity numeric(30,12) not null,
  average_purchase_price numeric(30,12) not null,
  price_mode text not null,
  manual_current_price numeric(30,12),
  market_asset_key uuid,
  native_currency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint investments_name_not_blank check (btrim(name) <> ''),
  constraint investments_asset_type_allowed check (asset_type in ('stock', 'etf', 'crypto', 'other')),
  constraint investments_quantity_positive check (quantity > 0),
  constraint investments_average_purchase_price_positive check (average_purchase_price > 0),
  constraint investments_price_mode_allowed check (price_mode in ('automatic', 'manual')),
  constraint investments_price_mode_fields check (
    (price_mode = 'manual' and manual_current_price is not null and manual_current_price > 0)
    or
    (price_mode = 'automatic' and manual_current_price is null and market_asset_key is not null)
  ),
  constraint investments_other_manual_only check (asset_type <> 'other' or price_mode = 'manual'),
  constraint investments_native_currency_format check (native_currency ~ '^[A-Z]{3}$')
);

create trigger investments_set_updated_at before update on public.investments
for each row execute function public.set_updated_at();

revoke all on table public.investments from anon;
revoke all on table public.investments from authenticated;
grant select, insert, update, delete on table public.investments to authenticated;

alter table public.investments enable row level security;

create policy "Users can view own investments" on public.investments for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own investments" on public.investments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own investments" on public.investments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own investments" on public.investments for delete to authenticated using ((select auth.uid()) = user_id);
