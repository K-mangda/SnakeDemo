-- Run once in Supabase SQL Editor after schema.sql.
-- Safe to run again: each model class is upserted by scientific_name.
--
-- Sources used for this reference seed:
-- 1. The Reptile Database (accessed 2026-09-12): accepted taxonomy,
--    family and English common name. https://reptile-database.reptarium.cz/
-- 2. Queen Saovabha Memorial Institute (QSMI), Thai Red Cross Society:
--    medical-antivenom categories only for the four model classes explicitly
--    covered by the research scope. See research report section 2.2.3.
--
-- Important: scientific_name remains the exact label emitted by the trained
-- model. accepted_scientific_name records an updated name where needed, so
-- old predictions and expert-verification links remain valid.

alter table public.snake_species
  add column if not exists accepted_scientific_name text,
  add column if not exists taxonomy_source text,
  add column if not exists medical_source text,
  add column if not exists reference_note text;

insert into public.snake_species (
  scientific_name, accepted_scientific_name, name_th, name_en, family,
  venom_type, danger_level, description, symptoms, first_aid,
  taxonomy_source, medical_source, reference_note
)
values
  (
    'Ahaetulla nasuta', 'Ahaetulla nasuta', null, 'Long-nosed Tree Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Ahaetulla/nasuta', null,
    'The current taxonomic treatment restricts Ahaetulla nasuta to Sri Lanka and Bhutan. The model label is retained for compatibility; Thai records require expert review before a final species is confirmed.'
  ),
  (
    'Ahaetulla prasina', 'Ahaetulla prasina', 'งูเขียวพระอินทร์', 'Oriental Whipsnake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Ahaetulla/prasina', null, null
  ),
  (
    'Boiga cyanea', 'Boiga cyanea', null, 'Green Cat Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Boiga/cyanea', null, null
  ),
  (
    'Boiga melanota', 'Boiga melanota', null, 'White-spotted Cat Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Boiga/melanota', null, null
  ),
  (
    'Boiga multomaculata', 'Boiga multomaculata', null, 'Many-spotted Cat Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Boiga/multomaculata', null, null
  ),
  (
    'Boiga siamensis', 'Boiga siamensis', null, 'Siamese Cat Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Boiga/siamensis', null, null
  ),
  (
    'Bungarus fasciatus', 'Bungarus fasciatus', 'งูสามเหลี่ยม', 'Banded Krait', 'Elapidae',
    'neurotoxic', 4, 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Bungarus/fasciatus',
    'QSMI / Thai Red Cross Society, research report section 2.2.3',
    'Medical details must be reviewed by a qualified clinician; this application is not a diagnostic tool.'
  ),
  (
    'Bungarus wanghaotingi', 'Bungarus wanghaotingi', null, 'Wanghao''s Krait', 'Elapidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Bungarus/wanghaotingi', null,
    'This label is not one of the QSMI monovalent-antivenom species stated in the research report.'
  ),
  (
    'Calliophis maculiceps maculiceps', 'Calliophis maculiceps', null, 'Small-spotted Coral Snake', 'Elapidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Calliophis/maculiceps', null,
    'The model retains a subspecies-form label; the accepted reference is stored at species level.'
  ),
  (
    'Coelognathus radiatus', 'Coelognathus radiatus', null, 'Copperhead Racer', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Coelognathus/radiatus', null, null
  ),
  (
    'Cylindrophis jodiae', 'Cylindrophis jodiae', null, 'Jodi''s Pipe Snake', 'Cylindrophiidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Cylindrophis/jodiae', null, null
  ),
  (
    'Daboia siamensis', 'Daboia siamensis', 'งูแมวเซา', 'Siamese Russell''s Viper', 'Viperidae',
    'hemotoxic', 5, 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Daboia/siamensis',
    'QSMI / Thai Red Cross Society, research report section 2.2.3',
    'Medical details must be reviewed by a qualified clinician; this application is not a diagnostic tool.'
  ),
  (
    'Dendrelaphis pictus', 'Dendrelaphis pictus', null, 'Painted Bronzeback', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Dendrelaphis/pictus', null, null
  ),
  (
    'Enhydris enhydris', 'Enhydris enhydris', null, 'Rainbow Water Snake', 'Homalopsidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Enhydris/enhydris', null, null
  ),
  (
    'Enhydris plumbea', 'Hypsiscopus plumbeus', null, 'Plumbeous Water Snake', 'Homalopsidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Hypsiscopus/plumbeus', null,
    'The model label Enhydris plumbea is retained for compatibility. The accepted name in the reference source is Hypsiscopus plumbeus.'
  ),
  (
    'Homalopsis buccata', 'Homalopsis buccata', null, 'Puff-faced Water Snake', 'Homalopsidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Homalopsis/buccata', null, null
  ),
  (
    'Lycodon davisonii', 'Lycodon davisonii', null, 'Davison''s Wolf Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Lycodon/davisonii', null, null
  ),
  (
    'Lycodon laoensis', 'Lycodon laoensis', null, 'Laotian Wolf Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Lycodon/laoensis', null, null
  ),
  (
    'Malayopython reticulatus', 'Malayopython reticulatus', 'งูเหลือม', 'Reticulated Python', 'Pythonidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Malayopython/reticulatus', null, null
  ),
  (
    'Naja kaouthia', 'Naja kaouthia', 'งูเห่าไทย', 'Monocled Cobra', 'Elapidae',
    'neurotoxic', 4, 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Naja/kaouthia',
    'QSMI / Thai Red Cross Society, research report section 2.2.3',
    'Medical details must be reviewed by a qualified clinician; this application is not a diagnostic tool.'
  ),
  (
    'Oligodon taeniatus', 'Oligodon taeniatus', null, 'Striped Kukri Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Oligodon/taeniatus', null, null
  ),
  (
    'Psammodynastes pulverulentus', 'Psammodynastes pulverulentus', null, 'Common Mock Viper', 'Pseudaspididae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Psammodynastes/pulverulentus', null, null
  ),
  (
    'Ptyas mucosa', 'Ptyas mucosa', null, 'Oriental Rat Snake', 'Colubridae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Ptyas/mucosa', null, null
  ),
  (
    'Trimeresurus albolabris', 'Trimeresurus albolabris', 'งูเขียวหางไหม้', 'White-lipped Pit Viper', 'Viperidae',
    'hemotoxic', 3, 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Trimeresurus/albolabris',
    'QSMI / Thai Red Cross Society, research report section 2.2.3',
    'Medical details must be reviewed by a qualified clinician; this application is not a diagnostic tool.'
  ),
  (
    'Trimeresurus macrops', 'Trimeresurus macrops', null, 'Large-eyed Pit Viper', 'Viperidae',
    null, null, 'Taxonomic reference for the model label.', '[]'::jsonb, '[]'::jsonb,
    'https://reptile-database.reptarium.cz/Trimeresurus/macrops', null, null
  )
on conflict (scientific_name) do update set
  accepted_scientific_name = excluded.accepted_scientific_name,
  name_th = excluded.name_th,
  name_en = excluded.name_en,
  family = excluded.family,
  venom_type = excluded.venom_type,
  danger_level = excluded.danger_level,
  description = excluded.description,
  symptoms = excluded.symptoms,
  first_aid = excluded.first_aid,
  taxonomy_source = excluded.taxonomy_source,
  medical_source = excluded.medical_source,
  reference_note = excluded.reference_note;

-- Sanity check: should return exactly 25 rows after a successful seed.
select scientific_name, accepted_scientific_name, name_en, family, medical_source
from public.snake_species
where scientific_name in (
  'Ahaetulla nasuta', 'Ahaetulla prasina', 'Boiga cyanea', 'Boiga melanota',
  'Boiga multomaculata', 'Boiga siamensis', 'Bungarus fasciatus', 'Bungarus wanghaotingi',
  'Calliophis maculiceps maculiceps', 'Coelognathus radiatus', 'Cylindrophis jodiae',
  'Daboia siamensis', 'Dendrelaphis pictus', 'Enhydris enhydris', 'Enhydris plumbea',
  'Homalopsis buccata', 'Lycodon davisonii', 'Lycodon laoensis', 'Malayopython reticulatus',
  'Naja kaouthia', 'Oligodon taeniatus', 'Psammodynastes pulverulentus', 'Ptyas mucosa',
  'Trimeresurus albolabris', 'Trimeresurus macrops'
)
order by scientific_name;
