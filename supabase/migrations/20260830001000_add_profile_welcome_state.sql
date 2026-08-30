alter table public.profiles
add column has_seen_welcome boolean;

-- Existing users are not new users.
update public.profiles
set has_seen_welcome = true
where has_seen_welcome is null;

-- New profiles start with the first-login welcome pending.
alter table public.profiles
alter column has_seen_welcome set default false;

alter table public.profiles
alter column has_seen_welcome set not null;