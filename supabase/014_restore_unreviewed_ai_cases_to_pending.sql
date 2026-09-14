-- Run once in Supabase SQL Editor after 013.
-- An image with no AI detection is still awaiting Expert review, so it belongs
-- in Pending. "Unclear" is reserved for an unresolved Expert decision.

update public.snake_images
set status = 'pending',
    updated_at = now()
where status = 'unclear'
  and predicted_scientific is null
  and predicted_species_id is null
  and confidence is null
  and predicted_bbox is null
  and not exists (
    select 1
    from public.verification_history vh
    where vh.image_id = snake_images.id
  );
