-- Run once in Supabase SQL Editor after 014.
-- A reviewer who cannot identify a snake should be able to submit an Unclear
-- review without inventing a bounding box.

alter table public.verification_history
  alter column bbox drop not null;
