-- Run this AFTER 011_seed_model_species.sql in the Supabase SQL Editor.
--
-- Purpose: replace the previous display-only fallback wording with auditable,
-- source-scoped classifications. This script never deletes rows or changes a
-- model label, so existing predictions and verification history remain linked.
--
-- Evidence rules used here:
--   * TH-BIF / ONEP: Thai names and Thailand occurrence.
--   * The Reptile Database: accepted taxonomy and published taxonomic notes.
--   * Chanhome et al. (QSMI, Thai Red Cross), 1998, PMID 9597848: medically
--     important snakes in Thailand and Thai antivenom coverage.
--   * WHO SEARO, 2016: first aid after any suspected snakebite.
--   * Species-specific peer-reviewed studies are linked on the affected rows.
--
-- IMPORTANT: "not medically important in the QSMI review" is deliberately not
-- written as "harmless". A prediction can be wrong, and every bite still needs
-- medical assessment.

with verified_reference (
  scientific_name, venom_type, danger_level, medical_source, symptoms, first_aid, reference_note
) as (
  values
    (
      'Ahaetulla nasuta',
      'พิษอ่อน (งูเขี้ยวหลังในสกุล Ahaetulla)',
      'เฝ้าระวัง — ฉลากโมเดลมีประเด็นอนุกรมวิธานสำหรับประเทศไทย',
      'TH-BIF/ONEP; The Reptile Database',
      jsonb_build_array('ต้องประเมินอาการโดยบุคลากรทางการแพทย์หลังถูกกัด'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Reptile Database restricts Ahaetulla nasuta to Sri Lanka and Bhutan; the Thai model label must be reviewed by a herpetology expert before publishing a final species identification. https://reptile-database.reptarium.cz/Ahaetulla/nasuta'
    ),
    (
      'Ahaetulla prasina',
      'พิษอ่อน',
      'ความเสี่ยงต่ำต่อคนตาม TH-BIF/ONEP',
      'TH-BIF / ONEP species record: https://thbif.onep.go.th/taxons/detail/1204',
      jsonb_build_array('TH-BIF/ONEP ระบุว่าพิษอ่อนและมีผลหลักต่อเหยื่อ'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name and safety wording are taken directly from TH-BIF/ONEP.'
    ),
    (
      'Boiga cyanea',
      'พิษอ่อน (งูเขี้ยวหลัง)',
      'เฝ้าระวัง — อาจเกิดอาการเฉพาะที่หลังถูกกัด',
      'Peer-reviewed natural-history record: https://journals.ku.edu/reptilesandamphibians/article/download/15537/14089/36583; TH-BIF/ONEP taxonomy record',
      jsonb_build_array('ควรให้แพทย์ประเมินอาการเฉพาะที่หลังถูกกัด'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The cited peer-reviewed Thailand record describes Boiga cyanea as rear-fanged and mildly venomous.'
    ),
    (
      'Boiga melanota',
      'พิษอ่อน',
      'ควรระวัง — อาจปวดบวมตาม TH-BIF/ONEP',
      'TH-BIF / ONEP species record: https://thbif.onep.go.th/taxons/detail/5445',
      jsonb_build_array('TH-BIF/ONEP ระบุว่าอาจปวดและบวม'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The model label is retained; The Reptile Database accepts Boiga melanota: https://reptile-database.reptarium.cz/Boiga/melanota'
    ),
    (
      'Boiga multomaculata',
      'พิษอ่อน (งูเขี้ยวหลังในสกุล Boiga)',
      'เฝ้าระวัง — ต้องประเมินโดยแพทย์หลังถูกกัด',
      'TH-BIF / ONEP taxonomy record: https://thbif.onep.go.th/taxons/taxon_detail/Boiga%20multomaculata; Chanhome et al., PMID 9597848',
      jsonb_build_array('ไม่มีการบันทึกอาการทางคลินิกรายชนิดในแหล่งอ้างอิงนี้'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'This is not one of the medically important snake groups listed in the Thai Red Cross review; that does not replace clinical assessment.'
    ),
    (
      'Boiga siamensis',
      'พิษอ่อน (งูเขี้ยวหลังในสกุล Boiga)',
      'เฝ้าระวัง — ต้องประเมินโดยแพทย์หลังถูกกัด',
      'TH-BIF / ONEP species record: https://thbif.onep.go.th/taxons/detail/5450; Chanhome et al., PMID 9597848',
      jsonb_build_array('ไม่มีการบันทึกอาการทางคลินิกรายชนิดในแหล่งอ้างอิงนี้'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'This is not one of the medically important snake groups listed in the Thai Red Cross review; that does not replace clinical assessment.'
    ),
    (
      'Bungarus fasciatus',
      'พิษต่อระบบประสาท',
      'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย',
      'Queen Saovabha Memorial Institute / Thai Red Cross; Chanhome et al., PMID 9597848',
      jsonb_build_array('พิษต่อระบบประสาทต้องได้รับการประเมินฉุกเฉิน'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Thai Red Cross review lists B. fasciatus among medically important Thai snakes and states that locally produced antivenom is available.'
    ),
    (
      'Bungarus wanghaotingi',
      'พิษต่อระบบประสาท (งูพิษสกุล Bungarus)',
      'ความเสี่ยงสูง — งูพิษกลุ่ม krait ต้องประเมินฉุกเฉิน',
      'Taxonomic verification: https://pubmed.ncbi.nlm.nih.gov/33814945/; Thai medical context: Chanhome et al., PMID 9597848',
      jsonb_build_array('พิษต่อระบบประสาทต้องได้รับการประเมินฉุกเฉิน'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The cited taxonomic study verifies B. wanghaotingi and includes a Thailand specimen. It is not a QSMI monovalent-antivenom label in the research scope.'
    ),
    (
      'Calliophis maculiceps maculiceps',
      'พิษต่อระบบประสาท (งูปะการัง)',
      'งูพิษ — มีข้อมูลผู้ถูกกัดในประเทศไทย',
      'Ramathibodi Poison Center cohort: https://pubmed.ncbi.nlm.nih.gov/42043041/; Chanhome et al., PMID 9597848',
      jsonb_build_array('การศึกษาผู้ถูกกัดในไทยรายงานอาการส่วนใหญ่เป็นเฉพาะที่', 'ยังต้องสังเกตอาการทางระบบประสาทในสถานพยาบาล'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The model keeps its subspecies-form label; the Thai clinical evidence is reported at the Asian coral snake/species level.'
    ),
    (
      'Coelognathus radiatus',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/; taxonomy: https://reptile-database.reptarium.cz/Coelognathus/radiatus',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Not listed in the QSMI review as a medically important Thai venomous snake; this is not a claim that a photographed snake is safe to handle.'
    ),
    (
      'Cylindrophis jodiae',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'TH-BIF/ONEP: https://thbif.onep.go.th/taxons/detail/12002; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'TH-BIF/ONEP confirms this exact Thai species record.'
    ),
    (
      'Daboia siamensis',
      'พิษต่อระบบเลือดและไต',
      'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย',
      'Thai Red Cross / QSMI; Thai clinical study: https://pubmed.ncbi.nlm.nih.gov/42081715/',
      jsonb_build_array('ความผิดปกติของการแข็งตัวของเลือด', 'ไตวายเฉียบพลัน', 'เกล็ดเลือดต่ำ'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Thailand cohort documents systemic hematotoxicity and acute kidney injury; treatment decisions belong to clinicians.'
    ),
    (
      'Dendrelaphis pictus',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'TH-BIF/ONEP; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name is supplied by TH-BIF/ONEP.'
    ),
    (
      'Enhydris enhydris',
      'พิษอ่อน (งูน้ำวงศ์ Homalopsidae)',
      'เฝ้าระวัง — ต้องประเมินโดยแพทย์หลังถูกกัด',
      'TH-BIF/ONEP taxonomy record; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('ต้องประเมินอาการโดยบุคลากรทางการแพทย์หลังถูกกัด'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'This species is not listed as a medically important Thai venomous snake in the QSMI review.'
    ),
    (
      'Enhydris plumbea',
      'พิษอ่อน (งูน้ำวงศ์ Homalopsidae)',
      'เฝ้าระวัง — ต้องประเมินโดยแพทย์หลังถูกกัด',
      'TH-BIF/ONEP; The Reptile Database: https://reptile-database.reptarium.cz/Hypsiscopus/plumbeus',
      jsonb_build_array('ต้องประเมินอาการโดยบุคลากรทางการแพทย์หลังถูกกัด'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The trained-model label is retained; Hypsiscopus plumbeus is the accepted name in The Reptile Database.'
    ),
    (
      'Homalopsis buccata',
      'พิษอ่อน',
      'ความเสี่ยงต่ำต่อคนตาม TH-BIF/ONEP',
      'TH-BIF / ONEP species record: https://thbif.onep.go.th/taxons/taxon_detail/Homalopsis%20buccata',
      jsonb_build_array('TH-BIF/ONEP ระบุว่าพิษอ่อนและมีผลหลักต่อเหยื่อ'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name and safety wording are taken directly from TH-BIF/ONEP.'
    ),
    (
      'Lycodon davisonii',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'The Reptile Database; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'No unambiguous standardized Thai common name for this exact current label was found in the cited official record; no name has been invented.'
    ),
    (
      'Lycodon laoensis',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'TH-BIF/ONEP; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name is supplied by TH-BIF/ONEP.'
    ),
    (
      'Malayopython reticulatus',
      'ไม่มีพิษ',
      'เฝ้าระวังการกัดและการรัดจากงูขนาดใหญ่',
      'TH-BIF/ONEP; The Reptile Database: https://reptile-database.reptarium.cz/Malayopython/reticulatus',
      jsonb_build_array('การกัดหรือการรัดอาจทำให้บาดเจ็บรุนแรง'),
      jsonb_build_array('อย่าจับหรือพยายามคลายการรัดด้วยตนเอง', 'โทร 1669 หากมีผู้บาดเจ็บ', 'ไปพบแพทย์สำหรับบาดแผลจากการกัด'),
      'Risk statement concerns physical injury from a large constrictor, not venom.'
    ),
    (
      'Naja kaouthia',
      'พิษต่อระบบประสาท',
      'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย',
      'Queen Saovabha Memorial Institute / Thai Red Cross; Chanhome et al., PMID 9597848',
      jsonb_build_array('พิษต่อระบบประสาทต้องได้รับการประเมินฉุกเฉิน'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Thai Red Cross review lists N. kaouthia among medically important Thai snakes and states that locally produced antivenom is available.'
    ),
    (
      'Oligodon taeniatus',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'TH-BIF/ONEP; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name is supplied by TH-BIF/ONEP.'
    ),
    (
      'Psammodynastes pulverulentus',
      'พิษอ่อน',
      'ไม่ถือว่าอันตรายต่อคนตาม The Reptile Database',
      'The Reptile Database: https://reptile-database.reptarium.cz/Psammodynastes/pulverulentus',
      jsonb_build_array('พิษออกฤทธิ์รวดเร็วต่อเหยื่อขนาดเล็กตามเอกสารอ้างอิง', 'ต้องประเมินอาการโดยบุคลากรทางการแพทย์หลังถูกกัด'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'ไปโรงพยาบาลทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Reptile Database states that the species is venomous but not regarded as dangerous to humans, citing Taylor (1965).'
    ),
    (
      'Ptyas mucosa',
      'ไม่อยู่ในกลุ่มงูพิษสำคัญทางการแพทย์ในบททบทวน QSMI',
      'เฝ้าระวังการบาดเจ็บจากการกัด — ต้องประเมินชนิดโดยผู้เชี่ยวชาญ',
      'TH-BIF/ONEP; Thai medical review: https://pubmed.ncbi.nlm.nih.gov/9597848/',
      jsonb_build_array('อาจเกิดบาดแผลหรือการอักเสบจากการกัด'),
      jsonb_build_array('ล้างบาดแผลอย่างอ่อนโยน', 'ไปพบแพทย์หากถูกกัด', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai name is supplied by TH-BIF/ONEP.'
    ),
    (
      'Trimeresurus albolabris',
      'พิษต่อระบบเลือด',
      'ความเสี่ยงสูง — มีเซรุ่มเฉพาะในประเทศไทย',
      'Queen Saovabha Memorial Institute / Thai Red Cross; Chanhome et al., PMID 9597848',
      jsonb_build_array('ต้องประเมินความผิดปกติของการแข็งตัวของเลือดในโรงพยาบาล'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'The Thai Red Cross review lists green pit vipers among medically important Thai snakes and states that locally produced antivenom is available.'
    ),
    (
      'Trimeresurus macrops',
      'พิษต่อระบบเลือด',
      'ความเสี่ยงสูง — มีรายงานการถูกกัดในไทย',
      'Peer-reviewed Thai clinical studies: https://pubmed.ncbi.nlm.nih.gov/16466758/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC7398752/',
      jsonb_build_array('ปวดและบวมเฉพาะที่', 'ต้องประเมินความผิดปกติของการแข็งตัวของเลือดในโรงพยาบาล'),
      jsonb_build_array('ตรึงอวัยวะที่ถูกกัดให้อยู่นิ่ง', 'โทร 1669 หรือไปห้องฉุกเฉินทันที', 'ห้ามกรีด ดูดพิษ ประคบน้ำแข็ง หรือขันชะเนาะ'),
      'Thai studies document local swelling and hematologic assessment needs after green pit viper bites.'
    )
)
update public.snake_species as species
set
  venom_type = reference.venom_type,
  danger_level = reference.danger_level,
  medical_source = reference.medical_source,
  symptoms = reference.symptoms,
  first_aid = reference.first_aid,
  reference_note = reference.reference_note
from verified_reference as reference
where species.scientific_name = reference.scientific_name;

-- A later TH-BIF record resolves the Thai name for this exact model label.
-- Keep the model's Latin label unchanged; only correct the displayed name.
update public.snake_species
set
  name_th = 'งูปล้องฉนวนตับจาก, งูปล้องฉนวนอินเดีย',
  name_en = 'Blanford''s Bridal Snake',
  taxonomy_source = 'https://thbif.onep.go.th/taxons/detail/24407',
  reference_note = 'TH-BIF/ONEP accepts Lycodon davisonii and records the Thai common names used here.'
where scientific_name = 'Lycodon davisonii';

-- Keep the two UI-facing safety fields short and consistent.  The detailed
-- clinical wording and every source URL remain in symptoms, first_aid,
-- medical_source and reference_note above.  These are display categories,
-- not a substitute for medical triage.
with display_categories (scientific_name, venom_type, danger_level) as (
  values
    ('Ahaetulla nasuta', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Ahaetulla prasina', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Boiga cyanea', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Boiga melanota', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Boiga multomaculata', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Boiga siamensis', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Bungarus fasciatus', 'พิษต่อระบบประสาท', 'อันตรายสูง'),
    ('Bungarus wanghaotingi', 'พิษต่อระบบประสาท', 'อันตรายสูง'),
    ('Calliophis maculiceps maculiceps', 'พิษต่อระบบประสาท', 'อันตรายสูง'),
    ('Coelognathus radiatus', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Cylindrophis jodiae', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Daboia siamensis', 'พิษต่อระบบเลือด', 'อันตรายสูง'),
    ('Dendrelaphis pictus', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Enhydris enhydris', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Enhydris plumbea', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Homalopsis buccata', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Lycodon davisonii', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Lycodon laoensis', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Malayopython reticulatus', 'ไม่มีพิษ', 'ระวังการกัดและรัด'),
    ('Naja kaouthia', 'พิษต่อระบบประสาท', 'อันตรายสูง'),
    ('Oligodon taeniatus', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Psammodynastes pulverulentus', 'พิษอ่อน', 'อันตรายน้อย'),
    ('Ptyas mucosa', 'พิษไม่อันตรายต่อคน', 'อันตรายน้อย'),
    ('Trimeresurus albolabris', 'พิษต่อระบบเลือด', 'อันตรายสูง'),
    ('Trimeresurus macrops', 'พิษต่อระบบเลือด', 'อันตรายสูง')
)
update public.snake_species as species
set
  venom_type = category.venom_type,
  danger_level = category.danger_level
from display_categories as category
where species.scientific_name = category.scientific_name;

-- Audit: must return 25 records and 0 rows with a null/empty safety field.
select scientific_name, name_th, name_en, family, venom_type, danger_level, medical_source
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

select scientific_name
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
and (
  venom_type is null or btrim(venom_type) = '' or
  danger_level is null or btrim(danger_level) = '' or
  medical_source is null or btrim(medical_source) = '' or
  jsonb_array_length(symptoms) = 0 or jsonb_array_length(first_aid) = 0
);
