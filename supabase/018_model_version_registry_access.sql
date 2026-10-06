-- Run once in the Supabase SQL Editor after deploying the model registry UI.
-- The app checks the signed-in user is an active administrator before calling
-- this table; RLS policies in schema.sql remain the authorization boundary.

grant select, update on table public.model_versions to authenticated;
grant select, insert, update, delete on table public.model_versions to service_role;
