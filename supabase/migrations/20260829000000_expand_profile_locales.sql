alter table public.profiles
drop constraint if exists profiles_locale_allowed;

alter table public.profiles
add constraint profiles_locale_allowed
check (locale in ('en', 'pt', 'es', 'de', 'fr', 'nl', 'it'));
