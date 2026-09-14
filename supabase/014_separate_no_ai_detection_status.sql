-- Run this file by itself in Supabase SQL Editor after 013, then run 015.
-- PostgreSQL requires a new enum value to be committed before it can be used.

alter type public.image_status add value if not exists 'no_detection';
