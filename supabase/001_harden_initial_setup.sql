-- Run this once after schema.sql and before creating the first account.

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('active', 'inactive', 'pending'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  is_first_account boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_account;

  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when is_first_account then 'admin'::public.user_role else 'expert'::public.user_role end,
    case when is_first_account then 'active' else 'pending' end
  );
  return new;
end;
$$;

create or replace function public.initial_admin_exists()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where role = 'admin');
$$;

grant execute on function public.initial_admin_exists() to anon, authenticated;
