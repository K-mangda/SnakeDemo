-- Run once in Supabase SQL Editor after 013.
-- Keeps an AI no-detection case separate from an Expert consensus conflict.

alter type public.image_status add value if not exists 'no_detection';

-- Restore previously saved no-detection submissions that 013 correctly treated
-- as unresolved reviews because the old schema had only one "unclear" status.
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
