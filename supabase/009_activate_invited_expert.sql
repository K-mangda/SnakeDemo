-- Run once in Supabase SQL Editor after 008_server_role_admin_access.sql.
-- An expert who proves control of the invited email by setting a password
-- receives Workspace access automatically. Administrators can still suspend access.

drop policy if exists "users update their own profile" on public.profiles;

create or replace function public.activate_invited_expert()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set status = 'active'
  where id = auth.uid()
    and role = 'expert'
    and status = 'pending';
end;
$$;

grant execute on function public.activate_invited_expert() to authenticated;
