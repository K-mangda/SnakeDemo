// Model training labels, in the order used by Thai-Snake-Dataset v4 (25 classes).
// Display names and families follow supabase/011_seed_model_species.sql.
// This is a training-class index, not a live coverage claim for every deployment.
export type ModelSpecies = {
  scientific: string
  nameEn: string
  nameTh: string | null
  family: string
}

export const MODEL_SPECIES: readonly ModelSpecies[] = [
  { scientific: 'Ahaetulla nasuta', nameEn: 'Long-nosed Tree Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Ahaetulla prasina', nameEn: 'Oriental Whipsnake', nameTh: 'งูเขียวพระอินทร์', family: 'Colubridae' },
  { scientific: 'Boiga cyanea', nameEn: 'Green Cat Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Boiga melanota', nameEn: 'White-spotted Cat Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Boiga multomaculata', nameEn: 'Many-spotted Cat Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Boiga siamensis', nameEn: 'Siamese Cat Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Bungarus fasciatus', nameEn: 'Banded Krait', nameTh: 'งูสามเหลี่ยม', family: 'Elapidae' },
  { scientific: 'Bungarus wanghaotingi', nameEn: "Wanghao's Krait", nameTh: 'งูสามเหลี่ยมวังฮ่าว', family: 'Elapidae' },
  { scientific: 'Calliophis maculiceps maculiceps', nameEn: 'Small-spotted Coral Snake', nameTh: null, family: 'Elapidae' },
  { scientific: 'Coelognathus radiatus', nameEn: 'Copperhead Racer', nameTh: null, family: 'Colubridae' },
  { scientific: 'Cylindrophis jodiae', nameEn: "Jodi's Pipe Snake", nameTh: null, family: 'Cylindrophiidae' },
  { scientific: 'Daboia siamensis', nameEn: "Siamese Russell's Viper", nameTh: 'งูแมวเซา', family: 'Viperidae' },
  { scientific: 'Dendrelaphis pictus', nameEn: 'Painted Bronzeback', nameTh: null, family: 'Colubridae' },
  { scientific: 'Enhydris enhydris', nameEn: 'Rainbow Water Snake', nameTh: null, family: 'Homalopsidae' },
  { scientific: 'Enhydris plumbea', nameEn: 'Plumbeous Water Snake', nameTh: null, family: 'Homalopsidae' },
  { scientific: 'Homalopsis buccata', nameEn: 'Puff-faced Water Snake', nameTh: null, family: 'Homalopsidae' },
  { scientific: 'Lycodon davisonii', nameEn: "Davison's Wolf Snake", nameTh: null, family: 'Colubridae' },
  { scientific: 'Lycodon laoensis', nameEn: 'Laotian Wolf Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Malayopython reticulatus', nameEn: 'Reticulated Python', nameTh: 'งูเหลือม', family: 'Pythonidae' },
  { scientific: 'Naja kaouthia', nameEn: 'Monocled Cobra', nameTh: 'งูเห่าไทย', family: 'Elapidae' },
  { scientific: 'Oligodon taeniatus', nameEn: 'Striped Kukri Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Psammodynastes pulverulentus', nameEn: 'Common Mock Viper', nameTh: null, family: 'Pseudaspididae' },
  { scientific: 'Ptyas mucosa', nameEn: 'Oriental Rat Snake', nameTh: null, family: 'Colubridae' },
  { scientific: 'Trimeresurus albolabris', nameEn: 'White-lipped Pit Viper', nameTh: 'งูเขียวหางไหม้', family: 'Viperidae' },
  { scientific: 'Trimeresurus macrops', nameEn: 'Large-eyed Pit Viper', nameTh: null, family: 'Viperidae' },
]
