-- Snake Classifier database schema
-- Run this file once in Supabase: SQL Editor > New query > paste > Run.

create type public.user_role as enum ('admin', 'expert');
create type public.image_status as enum ('pending', 'verified', 'unclear', 'waiting_for_new_class');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'expert',
  specialty text,
  status text not null default 'pending' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now()
);

create table public.snake_species (
  id bigint generated always as identity primary key,
  scientific_name text not null unique,
  name_th text,
  name_en text,
  family text,
  venom_type text,
  danger_level text,
  description text,
  symptoms jsonb not null default '[]'::jsonb,
  first_aid jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.snake_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  original_filename text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  predicted_species_id bigint references public.snake_species(id) on delete set null,
  final_species_id bigint references public.snake_species(id) on delete set null,
  confidence numeric(5, 4) check (confidence between 0 and 1),
  predicted_bbox jsonb,
  final_bbox jsonb,
  status public.image_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_history (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.snake_images(id) on delete cascade,
  expert_id uuid not null references public.profiles(id) on delete cascade,
  voted_species_id bigint references public.snake_species(id) on delete set null,
  bbox jsonb,
  created_at timestamptz not null default now(),
  unique (image_id, expert_id)
);

create table public.model_versions (
  id bigint generated always as identity primary key,
  version_name text not null unique,
  model_path text,
  map50 numeric(5, 4),
  precision_score numeric(5, 4),
  recall_score numeric(5, 4),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index snake_images_status_created_at_idx on public.snake_images (status, created_at desc);
create index verification_history_image_id_idx on public.verification_history (image_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when not exists (select 1 from public.profiles) then 'admin'::public.user_role else 'expert'::public.user_role end,
    case when not exists (select 1 from public.profiles) then 'active' else 'pending' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.initial_admin_exists()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where role = 'admin');
$$;

grant execute on function public.initial_admin_exists() to anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create function public.is_active_expert()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'expert') and status = 'active'
  );
$$;

create function public.refresh_image_verification()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  winning_species bigint;
  verified_votes integer;
  fused_bbox jsonb;
begin
  select voted_species_id, count(*)::integer
    into winning_species, verified_votes
  from public.verification_history
  where image_id = new.image_id and voted_species_id is not null
  group by voted_species_id
  order by count(*) desc, max(created_at) desc
  limit 1;

  select jsonb_build_object(
    'x', avg((bbox ->> 'x')::numeric),
    'y', avg((bbox ->> 'y')::numeric),
    'width', avg((bbox ->> 'width')::numeric),
    'height', avg((bbox ->> 'height')::numeric)
  ) into fused_bbox
  from public.verification_history
  where image_id = new.image_id and voted_species_id = winning_species;

  update public.snake_images
  set final_species_id = winning_species,
      final_bbox = fused_bbox,
      status = case when verified_votes >= 3 then 'verified' else 'pending' end,
      updated_at = now()
  where id = new.image_id;
  return new;
end;
$$;

create trigger after_verification_saved
  after insert or update on public.verification_history
  for each row execute procedure public.refresh_image_verification();

alter table public.profiles enable row level security;
alter table public.snake_species enable row level security;
alter table public.snake_images enable row level security;
alter table public.verification_history enable row level security;
alter table public.model_versions enable row level security;

create policy "profiles visible to account owner or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage profiles"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users read species"
  on public.snake_species for select to authenticated using (true);
create policy "admins manage species"
  on public.snake_species for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "active experts read images"
  on public.snake_images for select to authenticated
  using (public.is_active_expert());
create policy "admins manage images"
  on public.snake_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "experts read verification history"
  on public.verification_history for select to authenticated
  using (public.is_active_expert());
create policy "experts submit one verification per image"
  on public.verification_history for insert to authenticated
  with check (expert_id = auth.uid() and public.is_active_expert());
create policy "experts amend their own verification"
  on public.verification_history for update to authenticated
  using (expert_id = auth.uid()) with check (expert_id = auth.uid());

create policy "authenticated users read active models"
  on public.model_versions for select to authenticated using (true);
create policy "admins manage model versions"
  on public.model_versions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.snake_species (scientific_name, name_th, name_en, family, venom_type, danger_level)
values
  ('Naja kaouthia', 'งูเห่าไทย', 'Monocled Cobra', 'Elapidae', 'neurotoxic', 4),
  ('Bungarus fasciatus', 'งูสามเหลี่ยม', 'Banded Krait', 'Elapidae', 'neurotoxic', 4),
  ('Daboia siamensis', 'งูแมวเซา', 'Russell''s Viper', 'Viperidae', 'hemotoxic', 5),
  ('Trimeresurus albolabris', 'งูเขียวหางไหม้', 'White-lipped Pit Viper', 'Viperidae', 'hemotoxic', 3)
on conflict (scientific_name) do nothing;

insert into public.model_versions (version_name, model_path, map50, precision_score, recall_score, is_active)
values ('snake-v4-yolov8m', 'runs/snake_v4_yolov8m/weights/best.pt', 0.57607, 0.63052, 0.51668, true)
on conflict (version_name) do nothing;
