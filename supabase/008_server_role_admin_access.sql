-- Run once in Supabase SQL Editor.
-- These grants are used only by protected server routes after the caller's role is checked.

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.snake_species to service_role;
grant select, insert, update, delete on table public.verification_history to service_role;
