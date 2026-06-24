const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('app/globals.css', `
@import 'tailwindcss';

:root {
  --bg-primary: #09090b;
  --bg-secondary: #18181b;
  --accent: #10B981;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  background-color: var(--bg-primary);
  color: #fafafa;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }

@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-up { animation: fade-up 0.5s ease-out forwards; }

.glass-card {
  background: rgba(24, 24, 27, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
`);

write('lib/types.ts', `
export interface Snake {
  id: number
  name_th: string
  name_en: string
  scientific: string
  family: string
  venom_type: 'neurotoxic' | 'hemotoxic' | 'non-venomous'
  danger_level: number
  danger_label: string
  color: string
  length_cm: string
  habitat: string
  distribution: string
  description: string
  symptoms: string[]
  first_aid: string[]
  antivenom: string
  predictions: number
  confidence_avg: number
  tags: string[]
}

export interface MockImage {
  id: number
  filename: string
  upload_date: string
  ai_prediction: Snake
  ai_confidence: string
  status: 'pending' | 'reviewed' | 'validated' | 'majority_vote'
  expert_votes: number
  required_votes: number
  bounding_box: { x: number; y: number; w: number; h: number }
}

export interface Expert {
  id: number
  name: string
  email: string
  specialty: string
  validated: number
  accuracy: number
  status: 'active' | 'inactive'
  joined: string
}

export interface Stats {
  total_images: number
  validated_images: number
  pending_images: number
  model_accuracy: number
  total_predictions: number
  active_experts: number
  total_experts: number
  species_distribution: number[]
  daily_uploads: number[]
  weekly_accuracy: number[]
  auto_train: {
    enabled: boolean
    min_validated: number
    current_progress: number
    last_trained: string
    model_version: string
  }
}

export interface Session {
  email: string
  role: 'admin' | 'expert'
  name: string
}
`);

write('lib/data.ts', `
import { Snake, MockImage, Expert, Stats } from './types'

export const SNAKE_DATA: Snake[] = [
  {
    id: 1, name_th: 'งูเห่าไทย', name_en: 'Monocled Cobra', scientific: 'Naja kaouthia', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 4, danger_label: 'อันตรายมาก', color: '#ef4444', length_cm: '100-180',
    habitat: 'ทุ่งนา ป่า ชุมชน', distribution: 'ทั่วประเทศ', predictions: 1247, confidence_avg: 94.2,
    description: 'มีพิษต่อระบบประสาทรุนแรง แผ่แม่เบี้ยได้ มักพบตามแหล่งชุมชนและพื้นที่การเกษตร',
    symptoms: ['กล้ามเนื้ออัมพาต', 'กลืนลำบาก', 'หายใจลำบาก', 'เปลือกตาตก', 'ชาบริเวณแผล'],
    first_aid: ['ให้ผู้ป่วยนิ่งไม่ขยับ', 'ล้างแผลด้วยน้ำสะอาด', 'ใช้ดาม (Splint) ตรึงแขนขา', 'นำส่งโรงพยาบาลทันที', 'ห้ามกรีดแผลหรือดูดพิษ'],
    antivenom: 'Naja kaouthia Monovalent Antivenom',
    tags: ['พบได้บ่อย', 'ในเมือง', 'พิษประสาท']
  },
  {
    id: 2, name_th: 'งูจงอาง', name_en: 'King Cobra', scientific: 'Ophiophagus hannah', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#7c3aed', length_cm: '300-550',
    habitat: 'ป่าดิบชื้น', distribution: 'ภาคใต้ ภาคตะวันออก ภาคเหนือ', predictions: 623, confidence_avg: 97.8,
    description: 'งูพิษที่ยาวที่สุดในโลก ปริมาณพิษมากต่อการกัดหนึ่งครั้ง ทำให้อาการรุนแรงและรวดเร็ว',
    symptoms: ['อาการรุนแรงรวดเร็ว', 'กล้ามเนื้ออัมพาต', 'หัวใจล้มเหลว', 'หยุดหายใจ', 'เสียชีวิตได้ใน 30 นาที'],
    first_aid: ['โทร 1669 ทันที', 'อย่าให้ผู้ป่วยเดิน', 'ใช้ดาม (Splint) ตรึงแขนขา', 'ติดตามการหายใจ อาจต้องทำ CPR', 'รีบถึงโรงพยาบาลภายใน 30 นาที'],
    antivenom: 'King Cobra Monovalent Antivenom',
    tags: ['ใกล้สูญพันธุ์', 'ป่าเขา', 'พิษประสาท']
  },
  {
    id: 3, name_th: 'งูสามเหลี่ยม', name_en: 'Banded Krait', scientific: 'Bungarus fasciatus', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 4, danger_label: 'อันตรายมาก', color: '#f59e0b', length_cm: '90-180',
    habitat: 'ทุ่งนา ริมน้ำ บ้านเรือน', distribution: 'ทั่วประเทศ ภาคกลาง', predictions: 891, confidence_avg: 91.5,
    description: 'ลำตัวเป็นสามเหลี่ยม มีแถบสีดำสลับเหลือง หากินกลางคืน',
    symptoms: ['ง่วงซึม', 'กล้ามเนื้ออ่อนแรง', 'หายใจติดขัด', 'ปวดท้อง', 'คลื่นไส้'],
    first_aid: ['นำส่งโรงพยาบาลทันที', 'ตรึงแขนขานอนพัก', 'ล้างแผลด้วยน้ำสบู่', 'ติดตามการหายใจ', 'ห้ามดื่มแอลกอฮอล์'],
    antivenom: 'Bungarus fasciatus Monovalent Antivenom',
    tags: ['กลางคืน', 'พิษประสาท']
  },
  {
    id: 4, name_th: 'งูทับสมิงคลา', name_en: 'Malayan Krait', scientific: 'Bungarus candidus', family: 'Elapidae',
    venom_type: 'neurotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#1e40af', length_cm: '80-150',
    habitat: 'ป่า สวน บ้านเรือน', distribution: 'ทั่วประเทศ', predictions: 445, confidence_avg: 89.3,
    description: 'ลำตัวมีแถบขาวสลับดำ มักไม่รู้สึกเจ็บตอนกัด แต่อันตรายถึงชีวิต',
    symptoms: ['ไม่รู้สึกเจ็บตอนกัด', 'ง่วงนอน', 'กล้ามเนื้ออัมพาต', 'หยุดหายใจ', 'อัตราตายสูงหากรักษาช้า'],
    first_aid: ['ฉุกเฉินที่สุด โทร 1669', 'ไปห้องฉุกเฉินแม้ไม่เจ็บ', 'ตรึงแขนขา', 'อย่าให้นอนหลับ', 'เตรียมเครื่องช่วยหายใจ'],
    antivenom: 'Bungarus candidus Monovalent Antivenom',
    tags: ['กลางคืน', 'อันตราย', 'พิษประสาท', 'ไม่เจ็บตอนกัด']
  },
  {
    id: 5, name_th: 'งูกะปะ', name_en: 'Malayan Pit Viper', scientific: 'Calloselasma rhodostoma', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 3, danger_label: 'อันตราย', color: '#dc2626', length_cm: '60-100',
    habitat: 'ป่า สวนยาง ไร่กาแฟ', distribution: 'ภาคใต้ ภาคตะวันออก', predictions: 1089, confidence_avg: 92.7,
    description: 'พรางตัวเก่ง พิษทำลายระบบเลือด ทำให้เลือดออกและเนื้อตาย',
    symptoms: ['บวมมากรวดเร็ว', 'เลือดออกมาก', 'เจ็บปวดรุนแรง', 'เนื้อตาย', 'ไตวาย'],
    first_aid: ['ล้างแผลด้วยน้ำสบู่ทันที', 'ดามแขนขา (Splint)', 'ไม่ต้องรัดสายรัด', 'ติดตามอาการบวม', 'นำส่งโรงพยาบาลภายใน 2 ชั่วโมง'],
    antivenom: 'Calloselasma rhodostoma Monovalent Antivenom',
    tags: ['สวนยาง', 'พรางตัวดี', 'พิษโลหิต']
  },
  {
    id: 6, name_th: 'งูแมวเซา', name_en: 'Russell\\'s Viper', scientific: 'Daboia siamensis', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 5, danger_label: 'อันตรายถึงชีวิต', color: '#9a3412', length_cm: '100-150',
    habitat: 'ทุ่งหญ้า ไร่นา ชนบท', distribution: 'ภาคเหนือ ภาคกลาง ภาคตะวันตก', predictions: 567, confidence_avg: 95.1,
    description: 'เป็นงูที่มีอัตราการกัดคนเสียชีวิตสูงสุดชนิดหนึ่งในไทย พิษทำลายเลือดและไต',
    symptoms: ['เลือดออกทุกที่', 'ไตวายเฉียบพลัน', 'เนื้อตายกว้าง', 'ช็อค', 'อวัยวะล้มเหลว'],
    first_aid: ['โทร 1669 ทันที', 'ห้ามรัดสายรัดเด็ดขาด', 'ห้ามกรีดแผล', 'ตรึงแขนขา', 'แจ้งโรงพยาบาลว่าถูกงูแมวเซากัด'],
    antivenom: 'Daboia siamensis Monovalent Antivenom',
    tags: ['ทุ่งนา', 'พิษโลหิต', 'ไตวาย']
  },
  {
    id: 7, name_th: 'งูเขียวหางไหม้', name_en: 'White-lipped Pit Viper', scientific: 'Trimeresurus albolabris', family: 'Viperidae',
    venom_type: 'hemotoxic', danger_level: 3, danger_label: 'อันตราย', color: '#16a34a', length_cm: '60-100',
    habitat: 'ต้นไม้ พุ่มไม้ สวน', distribution: 'ทั่วประเทศ', predictions: 2134, confidence_avg: 88.9,
    description: 'งูพิษที่กัดคนบ่อยที่สุด พิษไม่แรงมากแต่ทำให้เจ็บปวดและบวมรุนแรง',
    symptoms: ['ปวดบวมบริเวณแผล', 'เลือดออกจากแผล', 'คลื่นไส้อาเจียน', 'เกล็ดเลือดลด', 'เนื้อตายเฉพาะที่'],
    first_aid: ['ล้างแผลด้วยน้ำสะอาด', 'ตรึงแขนขา', 'ถ่ายภาพงูไว้', 'นำส่งโรงพยาบาล', 'ติดตามอาการบวมเลือดออก'],
    antivenom: 'Green Pit Viper Antivenom',
    tags: ['พบได้บ่อย', 'ต้นไม้', 'สีเขียว', 'พิษโลหิต']
  }
]

export const MOCK_IMAGES: MockImage[] = Array.from({length: 24}).map((_, i) => ({
  id: i + 1,
  filename: \`IMG_\${20260600 + i}.jpg\`,
  upload_date: new Date(Date.now() - Math.random()*10000000000).toISOString(),
  ai_prediction: SNAKE_DATA[i % 7],
  ai_confidence: (85 + Math.random() * 14).toFixed(1),
  status: ['pending', 'reviewed', 'validated', 'majority_vote'][Math.floor(Math.random()*4)] as MockImage['status'],
  expert_votes: Math.floor(Math.random()*4),
  required_votes: 3,
  bounding_box: { x: Math.random()*100, y: Math.random()*100, w: 100+Math.random()*100, h: 100+Math.random()*100 }
}))

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
  pending_images: 3516,
  model_accuracy: 94.7,
  total_predictions: 45892,
  active_experts: 4,
  total_experts: 5,
  species_distribution: [1247, 623, 891, 445, 1089, 567, 2134],
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
`);

write('components/ui/Badge.tsx', `
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'muted'
  className?: string
}

const variantMap = {
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  info:    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  purple:  'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  muted:   'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50',
}

export default function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span className={cn(\`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium \${variantMap[variant]}\`, className)}>
      {children}
    </span>
  )
}
`);

write('components/ui/GlassCard.tsx', `
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export default function GlassCard({ children, className, onClick, hover = false }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-xl',
        hover && 'transition-colors duration-200 hover:bg-zinc-800/50 hover:border-zinc-700',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
`);

write('components/ui/Button.tsx', `
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
}

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 border border-transparent',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  ghost:   'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent',
  danger:  'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ children, variant='primary', size='md', onClick, href, className='', disabled }: ButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200',
    variants[variant],
    sizes[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}
`);

write('components/ui/DangerBar.tsx', `
interface DangerBarProps { level: number }

export default function DangerBar({ level }: DangerBarProps) {
  const getColor = (pip: number) => {
    if (pip > level) return 'bg-zinc-800'
    if (level >= 5) return 'bg-red-500'
    if (level >= 4) return 'bg-orange-500'
    if (level >= 3) return 'bg-amber-500'
    return 'bg-emerald-500'
  }
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(pip => (
        <div key={pip} className={\`h-1.5 w-8 rounded-sm \${getColor(pip)}\`} />
      ))}
    </div>
  )
}
`);

write('components/layout/Navbar.tsx', `
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Hexagon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileMenu(false) }, [pathname])

  const links = [
    { href: '/predict', label: 'Analysis' },
    { href: '/snakes', label: 'Database' },
    { href: '/expert', label: 'Workspace' },
    { href: '/admin', label: 'System' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      scrolled ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800/80 py-3' : 'bg-transparent border-transparent py-5'
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Hexagon className="text-emerald-500 fill-emerald-500/20" size={24} />
          <span className="font-bold tracking-tight text-zinc-100">NRRU<span className="text-zinc-500 font-normal">Vision</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium">
            {links.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn('transition-colors', pathname.startsWith(link.href) ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-100')}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Button href="/predict" size="sm">New Scan</Button>
        </div>

        <button className="md:hidden text-zinc-400" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenu && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-800 p-4 flex flex-col gap-4">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-400 px-4 py-2 hover:bg-zinc-900 rounded-lg">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
`);

write('components/layout/Footer.tsx', `
import { Hexagon } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-50">
          <Hexagon size={20} />
          <span className="font-semibold tracking-tight">NRRUVision</span>
        </div>
        <div className="text-center md:text-right text-xs text-zinc-500 space-y-1">
          <p>Computer Science Research · Nakhon Si Thammarat Rajabhat University (NRRU) 2026</p>
          <p>Toxicological Data Reference: Queen Saovabha Memorial Institute (QSMI)</p>
        </div>
      </div>
    </footer>
  )
}
`);
