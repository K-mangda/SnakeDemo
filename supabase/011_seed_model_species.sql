-- Run once in Supabase SQL Editor after schema.sql.
-- Safe to run again: each model class is upserted by scientific_name.
--
-- Sources used for this reference seed:
-- 1. The Reptile Database (accessed 2026-09-12): accepted taxonomy,
--    family and English common name. https://reptile-database.reptarium.cz/
-- 2. Thailand Biodiversity Information Facility (TH-BIF), Office of Natural
--    Resources and Environmental Policy and Planning (ONEP): Thai common
--    names and Thailand occurrence records. https://thbif.onep.go.th/
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

-- The research design defines danger_level as a descriptive field.  Replace
-- the previous UI-only 0–5 score with a traceable safety status in Thai.
alter table public.snake_species
  drop constraint if exists snake_species_danger_level_check;

alter table public.snake_species
  alter column danger_level type text using danger_level::text;

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
    'neurotoxic', 'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย', 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
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
    'hemotoxic', 'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย', 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
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
    'neurotoxic', 'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย', 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
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
    'hemotoxic', 'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย', 'Medical reference record for a QSMI antivenom species.', '[]'::jsonb, '[]'::jsonb,
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

-- Complete the display and safety-reference fields without deleting or
-- recreating rows.  This preserves IDs that may already be referenced by
-- predictions or expert-verification history.
--
-- Only QSMI and TH-BIF/ONEP statements are used for clinical wording.  The
-- remaining status is an explicit safety instruction, not an invented score.
with thbif_reference (
  scientific_name, name_th, name_en, description, reference_note
) as (
  values
    ('Ahaetulla nasuta', 'งูเขียวปากแหนบ', 'Long-nosed Tree Snake',
      'Thai common-name record from TH-BIF/ONEP. The trained-model label is retained for matching historical predictions.',
      'The current taxonomic treatment restricts Ahaetulla nasuta to Sri Lanka and Bhutan. The model label is retained for compatibility; Thai records require expert review before a final species is confirmed.'),
    ('Ahaetulla prasina', 'งูเขียวหัวจิ้งจกป่า', 'Oriental Whipsnake',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy and Thai name are sourced from The Reptile Database and TH-BIF/ONEP.'),
    ('Boiga cyanea', 'งูเขียวบอน', 'Green Cat Snake',
      'TH-BIF/ONEP records this colubrid in Thailand; the source also lists the alternative Thai name งูเขียวดง.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Boiga melanota', 'งูปล้องทอง', 'White-spotted Cat Snake',
      'TH-BIF/ONEP provides the Thai common-name record used for this model class.',
      'The model label is kept as emitted by the trained model; taxonomy requires expert confirmation where sources use alternative treatments.'),
    ('Boiga multomaculata', 'งูแม่ตะงามรังนก', 'Many-spotted Cat Snake',
      'TH-BIF/ONEP records this species in Thailand and also lists งูแม่ตะงาวรังนก as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Boiga siamensis', 'งูแส้หางม้าเทา', 'Siamese Cat Snake',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Bungarus fasciatus', 'งูสามเหลี่ยม', 'Banded Krait',
      'TH-BIF/ONEP and the research scope identify this Thai species; QSMI coverage is recorded separately.',
      'QSMI clinical category is included only as stated in research report section 2.2.3; it is not a diagnosis.'),
    ('Bungarus wanghaotingi', 'ไม่มีชื่อไทยมาตรฐานในแหล่งอ้างอิงที่ใช้', 'Wanghao''s Krait',
      'Taxonomic model class checked against The Reptile Database. A Thai common name is not asserted where TH-BIF/ONEP does not provide one for this exact label.',
      'This label is not one of the QSMI monovalent-antivenom species stated in the research report.'),
    ('Calliophis maculiceps maculiceps', 'งูปล้องหวายหัวดำ', 'Small-spotted Coral Snake',
      'TH-BIF/ONEP records Calliophis maculiceps in Thailand and lists this Thai common name.',
      'The model retains a subspecies-form label; the accepted reference is stored at species level.'),
    ('Coelognathus radiatus', 'งูทางมะพร้าวลายขีด', 'Copperhead Racer',
      'TH-BIF/ONEP records this species throughout Thailand and lists alternative Thai names for the same species.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Cylindrophis jodiae', 'งูก้นขบ', 'Jodi''s Pipe Snake',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Daboia siamensis', 'งูแมวเซา', 'Siamese Russell''s Viper',
      'Thai common-name and taxonomy record for this QSMI-covered model class.',
      'QSMI clinical category is included only as stated in research report section 2.2.3; it is not a diagnosis.'),
    ('Dendrelaphis pictus', 'งูสายม่านพระอินทร์', 'Painted Bronzeback',
      'TH-BIF/ONEP records this species in Thailand and lists this Thai common name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Enhydris enhydris', 'งูสายรุ้ง', 'Rainbow Water Snake',
      'TH-BIF/ONEP records this species in Thailand and lists งูสายรุ้งลายขีด as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Enhydris plumbea', 'งูปลิง', 'Plumbeous Water Snake',
      'TH-BIF/ONEP records the Thai common name used here for the accepted treatment Hypsiscopus plumbeus.',
      'The model label Enhydris plumbea is retained for compatibility. The accepted name in the reference source is Hypsiscopus plumbeus.'),
    ('Homalopsis buccata', 'งูหัวกะโหลก', 'Puff-faced Water Snake',
      'TH-BIF/ONEP records this species in Thailand and also lists งูเหลือมอ้อ as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Lycodon davisonii', 'ไม่มีชื่อไทยมาตรฐานในแหล่งอ้างอิงที่ใช้', 'Davison''s Wolf Snake',
      'Taxonomic model class checked against The Reptile Database. A Thai common name is not asserted where the consulted TH-BIF/ONEP record is not unambiguous.',
      'Thai common name requires expert confirmation before publication.'),
    ('Lycodon laoensis', 'งูปล้องฉนวนลาว', 'Laotian Wolf Snake',
      'TH-BIF/ONEP records this species in Thailand and lists งูปล้องฉนวนลายเหลือง as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Malayopython reticulatus', 'งูเหลือม', 'Reticulated Python',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Naja kaouthia', 'งูเห่าหม้อ', 'Monocled Cobra',
      'TH-BIF/ONEP records this Thai species under the common names งูเห่า and งูเห่าหม้อ; QSMI coverage is recorded separately.',
      'QSMI clinical category is included only as stated in research report section 2.2.3; it is not a diagnosis.'),
    ('Oligodon taeniatus', 'งูงอดไทย', 'Striped Kukri Snake',
      'TH-BIF/ONEP records this species in Thailand and lists งูงอดหลังลาย as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Psammodynastes pulverulentus', 'งูหมอก', 'Common Mock Viper',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Ptyas mucosa', 'งูสิงหางลาย', 'Oriental Rat Snake',
      'TH-BIF/ONEP records this species in Thailand and lists งูสิงคาน as an alternative Thai name.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.'),
    ('Trimeresurus albolabris', 'งูเขียวหางไหม้', 'White-lipped Pit Viper',
      'Thai common-name and taxonomy record for this QSMI-covered model class.',
      'QSMI clinical category is included only as stated in research report section 2.2.3; it is not a diagnosis.'),
    ('Trimeresurus macrops', 'งูเขียวหางไหม้ตาโต', 'Large-eyed Pit Viper',
      'TH-BIF/ONEP records this species in Thailand and lists the Thai common name used here.',
      'Taxonomy is checked against The Reptile Database; Thai name is from TH-BIF/ONEP.')
)
update public.snake_species as s
set
  name_th = r.name_th,
  name_en = r.name_en,
  description = r.description,
  reference_note = r.reference_note,
  venom_type = case
    when s.scientific_name in ('Naja kaouthia', 'Bungarus fasciatus', 'Daboia siamensis', 'Trimeresurus albolabris')
      then s.venom_type
    when s.scientific_name in ('Ahaetulla prasina', 'Homalopsis buccata')
      then 'พิษอ่อน'
    else 'ไม่มีการระบุประเภทพิษเฉพาะชนิดในแหล่งอ้างอิงที่ใช้'
  end,
  danger_level = case
    when s.scientific_name in ('Naja kaouthia', 'Bungarus fasciatus', 'Daboia siamensis', 'Trimeresurus albolabris')
      then 'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย'
    when s.scientific_name in ('Ahaetulla prasina', 'Homalopsis buccata')
      then 'ความเสี่ยงต่ำต่อคน — พิษอ่อนตาม TH-BIF/ONEP'
    else 'ต้องระวัง — หลีกเลี่ยงการสัมผัสและรอผู้เชี่ยวชาญยืนยัน'
  end,
  symptoms = case
    when s.scientific_name in ('Naja kaouthia', 'Bungarus fasciatus', 'Daboia siamensis', 'Trimeresurus albolabris')
      then jsonb_build_array('Species-specific clinical assessment must be performed by qualified medical personnel.')
    when s.scientific_name in ('Ahaetulla prasina', 'Homalopsis buccata')
      then jsonb_build_array('TH-BIF/ONEP describes mild venom with effects primarily on prey; seek medical assessment after any bite.')
    else jsonb_build_array('Seek medical assessment after any bite; no species-specific symptom list is presented without a cited clinical source.')
  end,
  first_aid = jsonb_build_array(
    'If bitten, keep the person still and immobilise the affected limb.',
    'Seek emergency medical care immediately.',
    'Do not cut or suck the wound, apply ice, or use a tourniquet.'
  ),
  medical_source = case
    when s.scientific_name in ('Naja kaouthia', 'Bungarus fasciatus', 'Daboia siamensis', 'Trimeresurus albolabris')
      then s.medical_source
    when s.scientific_name in ('Ahaetulla prasina', 'Homalopsis buccata')
      then 'TH-BIF / ONEP species record'
    else 'WHO SEARO general snakebite first-aid guidance; species-specific antivenom is outside the research scope'
  end
from thbif_reference as r
where s.scientific_name = r.scientific_name;

-- Sanity check: should return exactly 25 rows after a successful seed.
select scientific_name, accepted_scientific_name, name_th, name_en, family,
       venom_type, danger_level, medical_source
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
