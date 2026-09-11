-- Run once in Supabase SQL Editor after schema.sql.
-- The research scope reserves image review and verification for expert accounts only.

create or replace function public.is_active_expert()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'expert' and status = 'active'
  );
$$;
