-- The categories migration revoked privileges inherited by service_role.
-- Restore only the table privileges required by trusted server-side auditing
-- and exact fixture cleanup. RLS access for anon/authenticated is unchanged.
grant select, delete on table public.categories to service_role;
grant select, delete on table public.transactions to service_role;
