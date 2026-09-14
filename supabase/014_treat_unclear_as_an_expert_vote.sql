-- Run once in Supabase SQL Editor after 013.
-- An Expert choosing "Unclear" is one review with no species selected; it
-- must not immediately override the consensus status for the entire image.

create or replace function public.submit_expert_verification(
  p_image_id uuid,
  p_voted_species_id bigint,
  p_bbox jsonb,
  p_status public.image_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_expert() then
    raise exception 'Only active experts can submit a verification';
  end if;

  insert into public.verification_history (image_id, expert_id, voted_species_id, bbox)
  values (p_image_id, auth.uid(), p_voted_species_id, p_bbox)
  on conflict (image_id, expert_id) do update
  set voted_species_id = excluded.voted_species_id,
      bbox = excluded.bbox,
      created_at = now();

  -- The trigger installed by 013 now recalculates the majority result.
  -- Only an explicit request for a new class escalates the image directly.
  if p_status = 'waiting_for_new_class' then
    update public.snake_images
    set status = 'waiting_for_new_class',
        final_species_id = null,
        final_bbox = p_bbox,
        updated_at = now()
    where id = p_image_id;
  end if;
end;
$$;

grant execute on function public.submit_expert_verification(uuid, bigint, jsonb, public.image_status) to authenticated;
