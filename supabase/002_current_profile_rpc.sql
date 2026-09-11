-- Run this once in Supabase SQL Editor after schema.sql.
-- It is the single safe profile lookup used by the web application after sign-in.

create or replace function public.current_profile()
returns table (role public.user_role, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.role, p.status
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.current_profile() to authenticated;
