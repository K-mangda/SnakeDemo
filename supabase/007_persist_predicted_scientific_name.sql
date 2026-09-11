-- Run once in Supabase SQL Editor.
-- Retains the model label even when that label has not yet been added to Snake_Species.

alter table public.snake_images
  add column if not exists predicted_scientific text;
