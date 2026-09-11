-- Run once in Supabase SQL Editor after schema.sql.
-- Images are private: only the server-side service key can upload them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prediction-images', 'prediction-images', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png'];
