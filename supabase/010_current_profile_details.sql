-- Run once in Supabase SQL Editor after 009_activate_invited_expert.sql.
-- Provides the signed-in user with the profile fields shown in the Workspace header.

create or replace function public.current_profile_details()
returns table (full_name text, role public.user_role, specialty text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, p.role, p.specialty, p.status
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.current_profile_details() to authenticated;
