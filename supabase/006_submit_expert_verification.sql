-- Run once in Supabase SQL Editor after 005_restrict_workspace_to_experts.sql.
-- An expert may submit one verification per image and update only their own result.

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

  if p_status in ('unclear', 'waiting_for_new_class') then
    update public.snake_images
    set status = p_status,
        final_species_id = null,
        final_bbox = p_bbox,
        updated_at = now()
    where id = p_image_id;
  end if;
end;
$$;

grant execute on function public.submit_expert_verification(uuid, bigint, jsonb, public.image_status) to authenticated;
