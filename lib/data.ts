import { Snake, MockImage, Expert, Stats } from './types'

export const SNAKE_DATA: Snake[] = [
  {
    id: 1, name_th: 'งูเห่าไทย', name_en: 'Monocled Cobra', scientific: 'Naja kaouthia', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 4, danger_label: 'อันตรายมาก', color: '#ef4444', length_cm: '100-180',
    habitat: 'ทุ่งนา ป่า ชุมชน', distribution: 'ทั่วประเทศ', predictions: 2047, confidence_avg: 94.2,
    description: 'มีพิษต่อระบบประสาทรุนแรง แผ่แม่เบี้ยได้ มักพบตามแหล่งชุมชนและพื้นที่การเกษตร',
    symptoms: ['กล้ามเนื้ออัมพาต', 'กลืนลำบาก', 'หายใจลำบาก', 'เปลือกตาตก', 'ชาบริเวณแผล'],
    first_aid: ['ให้ผู้ป่วยนิ่งไม่ขยับ', 'ล้างแผลด้วยน้ำสะอาด', 'ใช้ดาม (Splint) ตรึงแขนขา', 'นำส่งโรงพยาบาลทันที', 'ห้ามกรีดแผลหรือดูดพิษ'],
    antivenom: 'Naja kaouthia Monovalent Antivenom',
    tags: ['พบได้บ่อย', 'ในเมือง', 'พิษประสาท']
  },
  {
    id: 2, name_th: 'งูจงอาง', name_en: 'King Cobra', scientific: 'Ophiophagus hannah', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#7c3aed', length_cm: '300-550',
    habitat: 'ป่าดิบชื้น', distribution: 'ภาคใต้ ภาคตะวันออก ภาคเหนือ', predictions: 1123, confidence_avg: 97.8,
    description: 'งูพิษที่ยาวที่สุดในโลก ปริมาณพิษมากต่อการกัดหนึ่งครั้ง ทำให้อาการรุนแรงและรวดเร็ว',
    symptoms: ['อาการรุนแรงรวดเร็ว', 'กล้ามเนื้ออัมพาต', 'หัวใจล้มเหลว', 'หยุดหายใจ', 'เสียชีวิตได้ใน 30 นาที'],
    first_aid: ['โทร 1669 ทันที', 'อย่าให้ผู้ป่วยเดิน', 'ใช้ดาม (Splint) ตรึงแขนขา', 'ติดตามการหายใจ อาจต้องทำ CPR', 'รีบถึงโรงพยาบาลภายใน 30 นาที'],
    antivenom: 'King Cobra Monovalent Antivenom',
    tags: ['ใกล้สูญพันธุ์', 'ป่าเขา', 'พิษประสาท']
  },
  {
    id: 3, name_th: 'งูสามเหลี่ยม', name_en: 'Banded Krait', scientific: 'Bungarus fasciatus', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 4, danger_label: 'อันตรายมาก', color: '#f59e0b', length_cm: '90-180',
    habitat: 'ทุ่งนา ริมน้ำ บ้านเรือน', distribution: 'ทั่วประเทศ ภาคกลาง', predictions: 1591, confidence_avg: 91.5,
    description: 'ลำตัวเป็นสามเหลี่ยม มีแถบสีดำสลับเหลือง หากินกลางคืน',
    symptoms: ['ง่วงซึม', 'กล้ามเนื้ออ่อนแรง', 'หายใจติดขัด', 'ปวดท้อง', 'คลื่นไส้'],
    first_aid: ['นำส่งโรงพยาบาลทันที', 'ตรึงแขนขานอนพัก', 'ล้างแผลด้วยน้ำสบู่', 'ติดตามการหายใจ', 'ห้ามดื่มแอลกอฮอล์'],
    antivenom: 'Bungarus fasciatus Monovalent Antivenom',
    tags: ['กลางคืน', 'พิษประสาท']
  },
  {
    id: 4, name_th: 'งูทับสมิงคลา', name_en: 'Malayan Krait', scientific: 'Bungarus candidus', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#1e40af', length_cm: '80-150',
    habitat: 'ป่า สวน บ้านเรือน', distribution: 'ทั่วประเทศ', predictions: 945, confidence_avg: 89.3,
    description: 'ลำตัวมีแถบขาวสลับดำ มักไม่รู้สึกเจ็บตอนกัด แต่อันตรายถึงชีวิต',
    symptoms: ['ไม่รู้สึกเจ็บตอนกัด', 'ง่วงนอน', 'กล้ามเนื้ออัมพาต', 'หยุดหายใจ', 'อัตราตายสูงหากรักษาช้า'],
    first_aid: ['ฉุกเฉินที่สุด โทร 1669', 'ไปห้องฉุกเฉินแม้ไม่เจ็บ', 'ตรึงแขนขา', 'อย่าให้นอนหลับ', 'เตรียมเครื่องช่วยหายใจ'],
    antivenom: 'Bungarus candidus Monovalent Antivenom',
    tags: ['กลางคืน', 'อันตราย', 'พิษประสาท', 'ไม่เจ็บตอนกัด']
  },
  {
    id: 5, name_th: 'งูกะปะ', name_en: 'Malayan Pit Viper', scientific: 'Calloselasma rhodostoma', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 3, danger_label: 'อันตราย', color: '#dc2626', length_cm: '60-100',
    habitat: 'ป่า สวนยาง ไร่กาแฟ', distribution: 'ภาคใต้ ภาคตะวันออก', predictions: 1989, confidence_avg: 92.7,
    description: 'พรางตัวเก่ง พิษทำลายระบบเลือด ทำให้เลือดออกและเนื้อตาย',
    symptoms: ['บวมมากรวดเร็ว', 'เลือดออกมาก', 'เจ็บปวดรุนแรง', 'เนื้อตาย', 'ไตวาย'],
    first_aid: ['ล้างแผลด้วยน้ำสบู่ทันที', 'ดามแขนขา (Splint)', 'ไม่ต้องรัดสายรัด', 'ติดตามอาการบวม', 'นำส่งโรงพยาบาลภายใน 2 ชั่วโมง'],
    antivenom: 'Calloselasma rhodostoma Monovalent Antivenom',
    tags: ['สวนยาง', 'พรางตัวดี', 'พิษโลหิต']
  },
  {
    id: 6, name_th: 'งูแมวเซา', name_en: 'Russell\'s Viper', scientific: 'Daboia siamensis', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#9a3412', length_cm: '100-150',
    habitat: 'ทุ่งหญ้า ไร่นา ชนบท', distribution: 'ภาคเหนือ ภาคกลาง ภาคตะวันตก', predictions: 1167, confidence_avg: 95.1,
    description: 'เป็นงูที่มีอัตราการกัดคนเสียชีวิตสูงสุดชนิดหนึ่งในไทย พิษทำลายเลือดและไต',
    symptoms: ['เลือดออกทุกที่', 'ไตวายเฉียบพลัน', 'เนื้อตายกว้าง', 'ช็อค', 'อวัยวะล้มเหลว'],
    first_aid: ['โทร 1669 ทันที', 'ห้ามรัดสายรัดเด็ดขาด', 'ห้ามกรีดแผล', 'ตรึงแขนขา', 'แจ้งโรงพยาบาลว่าถูกงูแมวเซากัด'],
    antivenom: 'Daboia siamensis Monovalent Antivenom',
    tags: ['ทุ่งนา', 'พิษโลหิต', 'ไตวาย']
  },
  {
    id: 7, name_th: 'งูเขียวหางไหม้', name_en: 'White-lipped Pit Viper', scientific: 'Trimeresurus albolabris', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 3, danger_label: 'อันตราย', color: '#16a34a', length_cm: '60-100',
    habitat: 'ต้นไม้ พุ่มไม้ สวน', distribution: 'ทั่วประเทศ', predictions: 3596, confidence_avg: 88.9,
    description: 'งูพิษที่กัดคนบ่อยที่สุด พิษไม่แรงมากแต่ทำให้เจ็บปวดและบวมรุนแรง',
    symptoms: ['ปวดบวมบริเวณแผล', 'เลือดออกจากแผล', 'คลื่นไส้อาเจียน', 'เกล็ดเลือดลด', 'เนื้อตายเฉพาะที่'],
    first_aid: ['ล้างแผลด้วยน้ำสะอาด', 'ตรึงแขนขา', 'ถ่ายภาพงูไว้', 'นำส่งโรงพยาบาล', 'ติดตามอาการบวมเลือดออก'],
    antivenom: 'Green Pit Viper Antivenom',
    tags: ['พบได้บ่อย', 'ต้นไม้', 'สีเขียว', 'พิษโลหิต']
  }
]

export const MOCK_IMAGES: MockImage[] = Array.from({length: 24}).map((_, i) => {
  const statuses = ['pending', 'verified', 'unclear', 'waiting_for_new_class'] as const;
  const mockDate = new Date(1718000000000 - i * 86400000).toISOString();
  
  const snakeImages = [
    '/mock/snake_1.png',
    '/mock/snake_2.png',
    '/mock/snake_3.png',
    '/mock/snake_4.png',
    '/mock/snake_5.png',
    '/mock/snake_6.png',
    '/mock/snake_7.png'
  ];

  return {
    id: i + 1,
    filename: snakeImages[i % 7],
    upload_date: mockDate,
    ai_prediction: SNAKE_DATA[i % 7],
    ai_confidence: (85 + (i % 14)).toFixed(1),
    status: statuses[i % 4],
    expert_votes: i % 4,
    required_votes: 3,
    bounding_box: { x: 20 + (i % 10), y: 20 + (i % 10), w: 50, h: 40 }
  }
})

export const MOCK_EXPERTS: Expert[] = [
  { id: 1, name: 'ดร. สมชาย วิทยา', email: 'somchai@snake.ai', specialty: 'Herpetology', validated: 1240, accuracy: 99.2, status: 'active', joined: '2025-01-15T00:00:00Z' },
  { id: 2, name: 'น.สพ. วิชัย สุขดี', email: 'wichai@snake.ai', specialty: 'Toxicology', validated: 890, accuracy: 98.5, status: 'active', joined: '2025-03-22T00:00:00Z' },
  { id: 3, name: 'ดร. อรทัย ใจหาญ', email: 'orathai@snake.ai', specialty: 'Biology', validated: 1560, accuracy: 99.7, status: 'active', joined: '2025-01-10T00:00:00Z' },
  { id: 4, name: 'ศ. พิเชษฐ์ วงศ์สว่าง', email: 'pichet@snake.ai', specialty: 'Clinical Toxinology', validated: 430, accuracy: 97.1, status: 'inactive', joined: '2025-06-05T00:00:00Z' },
  { id: 5, name: 'น.สพ. หญิง พิมพ์ใจ', email: 'pimjai@snake.ai', specialty: 'Veterinary', validated: 110, accuracy: 96.4, status: 'active', joined: '2026-02-18T00:00:00Z' }
]

export const MOCK_STATS: Stats = {
  total_images: 12458,
  validated_images: 8942,
  pending_images: 2516,
  unclear_images: 850,
  waiting_for_new_class_images: 150,
  model_accuracy: 94.7,
  total_predictions: 45892,
  active_experts: 4,
  total_experts: 5,
  species_distribution: [2047, 1123, 1591, 945, 1989, 1167, 3596],
  daily_uploads: [120, 145, 130, 180, 210, 190, 230, 245, 215, 198, 260, 280, 310, 290],
  weekly_accuracy: [91.2, 91.8, 92.5, 93.1, 93.6, 94.2, 94.7],
  auto_train: {
    enabled: true,
    min_validated: 10000,
    current_progress: 8942,
    last_trained: '2026-05-15T12:00:00Z',
    model_version: 'v2.4.1'
  }
}

export const ARCHIVED_MODELS = [
  { version: 'v2.4.0', date: '2026-05-20', accuracy: 93.5, classes: 7, trainImages: 7800 },
  { version: 'v2.3.5', date: '2026-04-10', accuracy: 91.2, classes: 6, trainImages: 6500 },
  { version: 'v2.2.1', date: '2026-03-01', accuracy: 89.8, classes: 6, trainImages: 5200 },
  { version: 'v2.1.0', date: '2026-01-15', accuracy: 85.4, classes: 5, trainImages: 4000 },
  { version: 'v2.0.0', date: '2025-11-20', accuracy: 82.1, classes: 5, trainImages: 3500 },
  { version: 'v1.5.2', date: '2025-09-05', accuracy: 78.5, classes: 4, trainImages: 2500 },
  { version: 'v1.0.0', date: '2025-06-01', accuracy: 65.0, classes: 3, trainImages: 1000 },
]

export const ACTIVE_MODEL = { 
  version: MOCK_STATS.auto_train.model_version, 
  date: '2026-06-15', 
  accuracy: MOCK_STATS.model_accuracy, 
  classes: 7, 
  trainImages: MOCK_STATS.validated_images 
}
