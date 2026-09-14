-- Run this file separately, only after 014 has completed successfully.
-- Restore no-AI-detection submissions that were previously grouped with
-- unresolved Expert review items because the old schema had one shared status.

update public.snake_images
set status = 'no_detection',
    updated_at = now()
where status in ('pending', 'unclear')
  and predicted_scientific is null
  and predicted_species_id is null
  and confidence is null
  and predicted_bbox is null
  and not exists (
    select 1 from public.verification_history vh where vh.image_id = snake_images.id
  );
