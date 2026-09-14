-- Run once in Supabase SQL Editor after 012.
-- Resolves each image against the currently active Expert pool.
-- A verified image is never reopened merely because a new Expert account is activated.

create or replace function public.recalculate_image_consensus(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_expert_count integer;
  required_votes integer;
  review_count integer;
  winning_species_id bigint;
  winning_vote_count integer;
  fused_bbox jsonb;
begin
  select count(*)::integer
    into active_expert_count
  from public.profiles
  where role = 'expert' and status = 'active';

  select count(*)::integer
    into review_count
  from public.verification_history
  where image_id = p_image_id;

  select voted_species_id, count(*)::integer
    into winning_species_id, winning_vote_count
  from public.verification_history
  where image_id = p_image_id and voted_species_id is not null
  group by voted_species_id
  order by count(*) desc, max(created_at) desc
  limit 1;

  required_votes := greatest(1, (active_expert_count / 2) + 1);

  if active_expert_count = 0 then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'pending',
        updated_at = now()
    where id = p_image_id;
  elsif winning_species_id is not null and winning_vote_count >= required_votes then
    select jsonb_build_object(
      'x', avg((bbox ->> 'x')::numeric),
      'y', avg((bbox ->> 'y')::numeric),
      'width', avg((bbox ->> 'width')::numeric),
      'height', avg((bbox ->> 'height')::numeric)
    )
      into fused_bbox
    from public.verification_history
    where image_id = p_image_id and voted_species_id = winning_species_id;

    update public.snake_images
    set final_species_id = winning_species_id,
        final_bbox = fused_bbox,
        status = 'verified',
        updated_at = now()
    where id = p_image_id;
  elsif review_count >= active_expert_count then
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'unclear',
        updated_at = now()
    where id = p_image_id;
  else
    update public.snake_images
    set final_species_id = null,
        final_bbox = null,
        status = 'pending',
        updated_at = now()
    where id = p_image_id;
  end if;
end;
$$;

create or replace function public.refresh_image_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalculate_image_consensus(new.image_id);
  return new;
end;
$$;

create or replace function public.refresh_open_consensus_on_expert_pool_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pool_changed boolean := false;
  image_row record;
begin
  if tg_op = 'INSERT' then
    pool_changed := new.role = 'expert' and new.status = 'active';
  elsif tg_op = 'DELETE' then
    pool_changed := old.role = 'expert' and old.status = 'active';
  else
    pool_changed := (old.role = 'expert' and old.status = 'active')
      is distinct from (new.role = 'expert' and new.status = 'active');
  end if;

  if pool_changed then
    for image_row in
      select id from public.snake_images where status in ('pending', 'unclear')
    loop
      perform public.recalculate_image_consensus(image_row.id);
    end loop;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists refresh_open_consensus_on_expert_pool_change on public.profiles;
create trigger refresh_open_consensus_on_expert_pool_change
  after insert or update or delete on public.profiles
  for each row execute procedure public.refresh_open_consensus_on_expert_pool_change();

-- Apply the current active Expert count to every image that is still unresolved.
do $$
declare
  image_row record;
begin
  for image_row in
    select id from public.snake_images where status in ('pending', 'unclear')
  loop
    perform public.recalculate_image_consensus(image_row.id);
  end loop;
end;
$$;
