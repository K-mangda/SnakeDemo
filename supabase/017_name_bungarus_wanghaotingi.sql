-- Run once in Supabase SQL Editor after 016.
-- Applies the project-facing Thai label to an existing database without
-- removing the model class or changing its safety-reference fields.

update public.snake_species
set
  name_th = 'งูสามเหลี่ยมวังฮ่าว',
  description = 'Project-facing Thai name selected for this model label. It is not asserted as a standardized Thai common name.',
  reference_note = 'This label is not one of the QSMI monovalent-antivenom species stated in the research report.'
where scientific_name = 'Bungarus wanghaotingi';
