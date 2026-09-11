-- Run once in Supabase SQL Editor after 003_prediction_storage.sql.
-- The Vercel server uses the Supabase secret key to save public scan submissions.

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.snake_images to service_role;
