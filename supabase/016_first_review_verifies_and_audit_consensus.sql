-- Run once in Supabase SQL Editor after 015.
-- The first expert review is usable immediately. Later independent reviews
-- can replace it only through a strict majority with matching boxes.

create or replace function public.bbox_iou(p_left jsonb, p_right jsonb)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  left_x1 numeric;
  left_y1 numeric;
  left_x2 numeric;
  left_y2 numeric;
  right_x1 numeric;
  right_y1 numeric;
  right_x2 numeric;
  right_y2 numeric;
  intersection_width numeric;
  intersection_height numeric;
  intersection_area numeric;
  union_area numeric;
begin
  if p_left is null or p_right is null then return null; end if;

  left_x1 := (p_left ->> 'x')::numeric;
  left_y1 := (p_left ->> 'y')::numeric;
  left_x2 := left_x1 + (p_left ->> 'width')::numeric;
  left_y2 := left_y1 + (p_left ->> 'height')::numeric;
  right_x1 := (p_right ->> 'x')::numeric;
  right_y1 := (p_right ->> 'y')::numeric;
  right_x2 := right_x1 + (p_right ->> 'width')::numeric;
  right_y2 := right_y1 + (p_right ->> 'height')::numeric;

  intersection_width := greatest(0, least(left_x2, right_x2) - greatest(left_x1, right_x1));
  intersection_height := greatest(0, least(left_y2, right_y2) - greatest(left_y1, right_y1));
  intersection_area := intersection_width * intersection_height;
  union_area := ((left_x2 - left_x1) * (left_y2 - left_y1))
    + ((right_x2 - right_x1) * (right_y2 - right_y1))
    - intersection_area;

  if union_area <= 0 then return null; end if;
  return intersection_area / union_area;
end;
$$;

create or replace function public.recalculate_image_consensus(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_count integer;
  winning_species_id bigint;
  winning_vote_count integer;
  anchor_bbox jsonb;
  matching_box_count integer;
  fused_bbox jsonb;
begin
  select count(*)::integer
    into review_count
  from public.verification_history
  where image_id = p_image_id;

  if review_count = 0 then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'pending',
        updated_at = now()
    where id = p_image_id;
    return;
  end if;

  select voted_species_id, count(*)::integer
    into winning_species_id, winning_vote_count
  from public.verification_history
  where image_id = p_image_id and voted_species_id is not null
  group by voted_species_id
  order by count(*) desc, max(created_at) desc
  limit 1;

  -- Every review is Unclear: retain that simple outcome.
  if winning_species_id is null then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'unclear',
        updated_at = now()
    where id = p_image_id;
    return;
  end if;

  -- A winner must have a strict majority of all reviews, including Unclear.
  if winning_vote_count <= review_count / 2 then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'pending',
        updated_at = now()
    where id = p_image_id;
    return;
  end if;

  -- Find a box supported by a majority of the winning species votes.
  -- IoU 0.50 prevents boxes over different subjects from being averaged.
  select candidate.bbox, count(matching.id)::integer
    into anchor_bbox, matching_box_count
  from public.verification_history candidate
  join public.verification_history matching
    on matching.image_id = candidate.image_id
   and matching.voted_species_id = winning_species_id
   and matching.bbox is not null
   and public.bbox_iou(candidate.bbox, matching.bbox) >= 0.50
  where candidate.image_id = p_image_id
    and candidate.voted_species_id = winning_species_id
    and candidate.bbox is not null
  group by candidate.id, candidate.bbox, candidate.created_at
  order by count(matching.id) desc, candidate.created_at desc
  limit 1;

  if anchor_bbox is null or matching_box_count <= winning_vote_count / 2 then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'pending',
        updated_at = now()
    where id = p_image_id;
    return;
  end if;

  select jsonb_build_object(
    'x', avg((bbox ->> 'x')::numeric),
    'y', avg((bbox ->> 'y')::numeric),
    'width', avg((bbox ->> 'width')::numeric),
    'height', avg((bbox ->> 'height')::numeric)
  )
    into fused_bbox
  from public.verification_history
  where image_id = p_image_id
    and voted_species_id = winning_species_id
    and bbox is not null
    and public.bbox_iou(anchor_bbox, bbox) >= 0.50;

  update public.snake_images
  set final_species_id = winning_species_id,
      final_bbox = fused_bbox,
      status = 'verified',
      updated_at = now()
  where id = p_image_id;
end;
$$;

-- Expert-pool size no longer changes an already reviewed image's outcome.
drop trigger if exists refresh_open_consensus_on_expert_pool_change on public.profiles;
drop function if exists public.refresh_open_consensus_on_expert_pool_change();

-- Recalculate all existing ordinary reviews under the new policy.
do $$
declare
  image_row record;
begin
  for image_row in
    select id from public.snake_images where status <> 'waiting_for_new_class'
  loop
    perform public.recalculate_image_consensus(image_row.id);
  end loop;
end;
$$;
