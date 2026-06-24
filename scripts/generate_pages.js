const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', filepath);
};

write('app/snakes/page.tsx', `
'use client'
import { useState } from 'react'
import { SNAKE_DATA } from '@/lib/data'
import { getDangerBadgeClass } from '@/lib/utils'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default function SnakesPage() {
  const [filter, setFilter] = useState<'all'|'neurotoxic'|'hemotoxic'>('all')
  const [search, setSearch] = useState('')

  const filtered = SNAKE_DATA.filter(s => {
    if (filter !== 'all' && s.venom_type !== filter) return false
    if (search && !s.name_th.includes(search) && !s.scientific.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">คลังข้อมูล<span className="gradient-text">งูไทย</span></h1>
          <p className="text-white/60">ข้อมูลสายพันธุ์งูที่มีความสำคัญทางการแพทย์ 7 ชนิด อ้างอิงสถานเสาวภา</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
            <button onClick={()=>setFilter('all')} className={\`px-6 py-2 rounded-lg text-sm font-semibold transition-all \${filter==='all'?'bg-white/10 text-white':'text-white/50 hover:text-white'}\`}>ทั้งหมด</button>
            <button onClick={()=>setFilter('neurotoxic')} className={\`px-6 py-2 rounded-lg text-sm font-semibold transition-all \${filter==='neurotoxic'?'bg-emerald-500/20 text-emerald-400':'text-white/50 hover:text-white'}\`}>พิษต่อระบบประสาท</button>
            <button onClick={()=>setFilter('hemotoxic')} className={\`px-6 py-2 rounded-lg text-sm font-semibold transition-all \${filter==='hemotoxic'?'bg-red-500/20 text-red-400':'text-white/50 hover:text-white'}\`}>พิษต่อระบบเลือด</button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อไทย หรือ ชื่อวิทย์..." 
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="w-full md:w-80 bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s, i) => (
            <GlassCard key={s.id} className="p-6 flex flex-col" hover={true}>
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">{s.emoji}</div>
                <div className={\`px-2 py-1 text-[10px] font-bold rounded-full \${getDangerBadgeClass(s.danger_level)}\`}>Lv.{s.danger_level}</div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{s.name_th}</h3>
              <div className="text-sm text-white/40 italic mb-4">{s.scientific}</div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {s.tags.slice(0,3).map(t => <Badge key={t} variant="muted">{t}</Badge>)}
              </div>
              
              <div className="mt-auto">
                <Button href={\`/snakes/\${s.id}\`} variant="ghost" className="w-full text-xs py-2">ดูรายละเอียด</Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
`);

write('app/snakes/[id]/page.tsx', `
'use client'
import { useParams } from 'next/navigation'
import { SNAKE_DATA } from '@/lib/data'
import Button from '@/components/ui/Button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { getDangerBadgeClass } from '@/lib/utils'

export default function SnakeDetail() {
  const { id } = useParams()
  const snake = SNAKE_DATA.find(s => s.id.toString() === id)

  if (!snake) return <div className="p-20 text-center">ไม่พบข้อมูลงู</div>

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <Button href="/snakes" variant="ghost" size="sm" className="mb-8">
          <ArrowLeft size={16} /> กลับไปคลังงู
        </Button>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center text-[150px] shadow-[0_0_50px_rgba(255,255,255,0.02)]">
              {snake.emoji}
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between">
                <span className="text-white/40">ชื่อภาษาอังกฤษ</span>
                <span className="font-semibold text-right">{snake.name_en}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">วงศ์ (Family)</span>
                <span className="font-semibold text-right">{snake.family}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ประเภทพิษ</span>
                <span className={\`font-semibold text-right \${snake.venom_type==='neurotoxic'?'text-emerald-400':'text-red-400'}\`}>
                  {snake.venom_type === 'neurotoxic' ? 'ระบบประสาท' : 'ระบบเลือด'}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-8">
            <div>
              <div className={\`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full mb-4 \${getDangerBadgeClass(snake.danger_level)}\`}>
                ระดับความอันตราย: {snake.danger_label} (Lv.{snake.danger_level})
              </div>
              <h1 className="text-5xl font-black mb-2">{snake.name_th}</h1>
              <div className="text-2xl text-white/50 italic mb-6">{snake.scientific}</div>
              <p className="text-lg leading-relaxed text-white/80">{snake.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 border border-white/10 rounded-xl">
                 <div className="text-sm text-white/40 mb-1">ความยาวเฉลี่ย</div>
                 <div className="font-bold">{snake.length_cm} ซม.</div>
               </div>
               <div className="bg-white/5 p-4 border border-white/10 rounded-xl">
                 <div className="text-sm text-white/40 mb-1">ถิ่นที่อยู่</div>
                 <div className="font-bold">{snake.habitat}</div>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-400" /> อาการเมื่อถูกกัด
              </h3>
              <div className="flex flex-wrap gap-2">
                {snake.symptoms.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/20">{s}</span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-emerald-400">วิธีปฐมพยาบาลเบื้องต้น</h3>
              <div className="space-y-2">
                {snake.first_aid.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-black text-white/20 text-xl w-6 text-right shrink-0">{i+1}.</span>
                    <span className="text-white/80">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
              <div className="text-sm text-purple-300 mb-1 uppercase tracking-wider">เซรุ่มแก้พิษงู (Antivenom)</div>
              <div className="text-xl font-bold">{snake.antivenom}</div>
              <div className="text-sm text-white/40 mt-2">โปรดแจ้งแพทย์ทันทีหากทราบชนิดงูที่กัด</div>
            </div>
            
            <Button href="/predict" size="lg" className="w-full">
              ลองวิเคราะห์ภาพงูชนิดนี้ 🔬
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
`);

write('app/login/page.tsx', `
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === 'expert@snake.ai' && password === 'demo1234') {
      localStorage.setItem('snake_session', JSON.stringify({email, role:'expert', name:'ดร. สมชาย (Expert)'}))
      router.push('/expert')
    } else if (email === 'admin@snake.ai' && password === 'admin1234') {
      localStorage.setItem('snake_session', JSON.stringify({email, role:'admin', name:'System Admin'}))
      router.push('/admin')
    } else {
      setErr('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_50%)]" />
      
      <GlassCard className="p-8 w-full max-w-md relative z-10" hover={false}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🐍</div>
          <h1 className="text-2xl font-bold mb-2">เข้าสู่ระบบหลังบ้าน</h1>
          <p className="text-white/40 text-sm">สำหรับผู้เชี่ยวชาญและผู้ดูแลระบบ</p>
        </div>

        {err && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">{err}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50" />
          </div>
          <Button className="w-full" size="lg">เข้าสู่ระบบ</Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
          <div className="text-xs text-white/40 mb-2">Demo Credentials:</div>
          <div className="text-sm bg-white/5 p-2 rounded flex justify-between">
            <span className="text-cyan-400">Expert:</span> expert@snake.ai / demo1234
          </div>
          <div className="text-sm bg-white/5 p-2 rounded flex justify-between">
            <span className="text-amber-400">Admin:</span> admin@snake.ai / admin1234
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
`);

write('app/expert/page.tsx', `
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_IMAGES } from '@/lib/data'
import { getStatusBadge, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'

export default function ExpertDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'all'|'pending'|'validated'>('pending')
  
  useEffect(() => {
    const s = localStorage.getItem('snake_session')
    if (!s) router.push('/login')
    else {
      const {role} = JSON.parse(s)
      if (role !== 'expert') router.push('/')
    }
  }, [])

  const images = MOCK_IMAGES.filter(img => {
    if (tab === 'pending') return img.status === 'pending' || img.status === 'reviewed'
    if (tab === 'validated') return img.status === 'validated' || img.status === 'majority_vote'
    return true
  })

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#050B18]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Expert Dashboard</h1>
            <p className="text-white/50">ระบบตรวจสอบและยืนยันข้อมูลภาพงู (Human-in-the-Loop)</p>
          </div>
          <Button onClick={() => { localStorage.removeItem('snake_session'); router.push('/') }} variant="ghost" size="sm">
            ออกจากระบบ
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={()=>setTab('pending')} className={\`px-4 py-2 rounded-lg text-sm font-bold \${tab==='pending'?'bg-amber-500/20 text-amber-400':'bg-white/5 text-white/50'}\`}>รอตรวจสอบ ({MOCK_IMAGES.filter(i=>i.status==='pending'||i.status==='reviewed').length})</button>
          <button onClick={()=>setTab('validated')} className={\`px-4 py-2 rounded-lg text-sm font-bold \${tab==='validated'?'bg-emerald-500/20 text-emerald-400':'bg-white/5 text-white/50'}\`}>ยืนยันแล้ว ({MOCK_IMAGES.filter(i=>i.status==='validated'||i.status==='majority_vote').length})</button>
          <button onClick={()=>setTab('all')} className={\`px-4 py-2 rounded-lg text-sm font-bold \${tab==='all'?'bg-white/20 text-white':'bg-white/5 text-white/50'}\`}>ทั้งหมด</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => {
            const badge = getStatusBadge(img.status)
            return (
              <GlassCard key={img.id} className="p-4 flex flex-col" hover={false}>
                <div className="aspect-square bg-gradient-to-br from-black/40 to-black/80 rounded-lg mb-3 flex items-center justify-center text-4xl relative">
                  {img.ai_prediction.emoji}
                  <div className={\`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold \${badge.className}\`}>
                    {badge.label}
                  </div>
                </div>
                <div className="text-xs text-white/40 truncate mb-1">{img.filename}</div>
                <div className="text-sm font-bold truncate">{img.ai_prediction.name_th}</div>
                <div className="text-xs text-white/50 mb-3">AI: {img.ai_confidence}% | โหวต: {img.expert_votes}/{img.required_votes}</div>
                
                <Button href={\`/expert/annotate/\${img.id}\`} variant={img.status==='pending'?'primary':'ghost'} size="sm" className="w-full mt-auto">
                  {img.status === 'pending' || img.status === 'reviewed' ? 'ตรวจสอบภาพ' : 'ดูผลลัพธ์'}
                </Button>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
`);

write('app/expert/annotate/[id]/page.tsx', `
'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MOCK_IMAGES, SNAKE_DATA } from '@/lib/data'
import Button from '@/components/ui/Button'
import GlassCard from '@/components/ui/GlassCard'
import { getStatusBadge } from '@/lib/utils'

export default function AnnotatePage() {
  const { id } = useParams()
  const router = useRouter()
  const img = MOCK_IMAGES.find(i => i.id.toString() === id)
  
  const [selected, setSelected] = useState(img?.ai_prediction.id || 1)
  const [saved, setSaved] = useState(false)

  if (!img) return null

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      router.push('/expert')
    }, 1500)
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#050B18]">
      <div className="max-w-6xl mx-auto px-6">
        <Button href="/expert" variant="ghost" size="sm" className="mb-6">← กลับ</Button>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GlassCard className="p-4" hover={false}>
              <div className="aspect-video bg-black rounded-lg relative overflow-hidden flex items-center justify-center">
                {/* Mock image canvas area */}
                <div className="text-9xl">{img.ai_prediction.emoji}</div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,black_100%)]" />
                
                {/* AI Box */}
                <div className="absolute border-2 border-dashed border-cyan-500/50 rounded pointer-events-none flex items-start p-1" style={{left: '20%', top:'15%', width:'60%', height:'70%'}}>
                  <span className="bg-cyan-500/50 text-white text-[10px] px-1 rounded">AI</span>
                </div>
                
                {/* Expert Box */}
                <div className="absolute border-2 border-emerald-500 rounded flex items-start p-1 cursor-move" style={{left: '22%', top:'18%', width:'55%', height:'65%'}}>
                  <span className="bg-emerald-500 text-white text-[10px] px-1 rounded">Expert</span>
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-emerald-500 rounded-full cursor-nwse-resize" />
                </div>
              </div>
              <div className="mt-4 text-xs text-white/50 text-center">คลิกและลากเพื่อปรับแก้ Bounding Box ของงู</div>
            </GlassCard>
          </div>
          
          <div className="space-y-4">
            <GlassCard className="p-5" hover={false}>
              <div className="text-xs text-cyan-400 mb-1 font-bold">AI PREDICTION</div>
              <div className="text-lg font-bold mb-1">{img.ai_prediction.name_th}</div>
              <div className="text-sm text-white/60 mb-4">ความมั่นใจ: {img.ai_confidence}%</div>
              
              <hr className="border-white/10 mb-4" />
              
              <div className="text-xs text-emerald-400 mb-2 font-bold">EXPERT ANNOTATION</div>
              <select 
                value={selected} 
                onChange={e=>setSelected(parseInt(e.target.value))}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 mb-6"
              >
                {SNAKE_DATA.map(s => <option key={s.id} value={s.id}>{s.name_th} ({s.scientific})</option>)}
              </select>

              <div className="text-xs text-white/40 mb-2">มติผู้เชี่ยวชาญคนอื่น (Majority Vote)</div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                  <span className="text-white/60">ดร. สมชาย</span>
                  <span className="text-emerald-400">✅ {img.ai_prediction.name_th}</span>
                </div>
                {img.expert_votes > 1 && (
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                    <span className="text-white/60">น.สพ. วิชัย</span>
                    <span className="text-emerald-400">✅ {img.ai_prediction.name_th}</span>
                  </div>
                )}
              </div>

              {saved ? (
                <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg text-center text-sm font-bold">
                  ✅ บันทึกและยืนยันข้อมูลแล้ว
                </div>
              ) : (
                <Button className="w-full" onClick={handleSave}>บันทึก Annotation</Button>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
`);

write('app/admin/page.tsx', `
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_STATS, MOCK_EXPERTS } from '@/lib/data'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Database, Brain, Activity, Download } from 'lucide-react'

const chartData = [
  { name: 'งูเห่า', count: 1247 },
  { name: 'งูจงอาง', count: 623 },
  { name: 'งูสามเหลี่ยม', count: 891 },
  { name: 'ทับสมิงคลา', count: 445 },
  { name: 'งูกะปะ', count: 1089 },
  { name: 'งูแมวเซา', count: 567 },
  { name: 'เขียวหางไหม้', count: 2134 },
]

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    const s = localStorage.getItem('snake_session')
    if (!s) router.push('/login')
    else {
      const {role} = JSON.parse(s)
      if (role !== 'admin') router.push('/')
    }
  }, [])

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#050B18]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-white/50">ระบบจัดการโมเดลและผู้เชี่ยวชาญ</p>
          </div>
          <Button onClick={() => { localStorage.removeItem('snake_session'); router.push('/') }} variant="ghost" size="sm">
            ออกจากระบบ
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4" hover={false}>
            <div className="flex gap-3 items-center mb-2">
              <Database className="text-cyan-400" size={20}/>
              <div className="text-sm text-white/50">ภาพทั้งหมด</div>
            </div>
            <div className="text-3xl font-bold">{MOCK_STATS.total_images.toLocaleString()}</div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex gap-3 items-center mb-2">
              <ShieldCheckIcon className="text-emerald-400" size={20}/>
              <div className="text-sm text-white/50">ภาพที่ยืนยันแล้ว</div>
            </div>
            <div className="text-3xl font-bold">{MOCK_STATS.validated_images.toLocaleString()}</div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex gap-3 items-center mb-2">
              <Brain className="text-purple-400" size={20}/>
              <div className="text-sm text-white/50">ความแม่นยำโมเดล</div>
            </div>
            <div className="text-3xl font-bold">{MOCK_STATS.model_accuracy}%</div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex gap-3 items-center mb-2">
              <Activity className="text-amber-400" size={20}/>
              <div className="text-sm text-white/50">Predictions</div>
            </div>
            <div className="text-3xl font-bold">{MOCK_STATS.total_predictions.toLocaleString()}</div>
          </GlassCard>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
             <GlassCard className="p-6 h-[400px]" hover={false}>
               <h3 className="text-lg font-bold mb-6">การกระจายตัวของชนิดงู (Dataset Distribution)</h3>
               <ResponsiveContainer width="100%" height="80%">
                 <BarChart data={chartData}>
                   <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0A1628', border: '1px solid rgba(255,255,255,0.1)'}} />
                   <Bar dataKey="count" fill="#10B981" radius={[4,4,0,0]} />
                 </BarChart>
               </ResponsiveContainer>
             </GlassCard>
          </div>
          <div>
            <GlassCard className="p-6 h-[400px] flex flex-col" hover={false}>
              <h3 className="text-lg font-bold mb-4">Auto-Training Pipeline</h3>
              <div className="p-4 bg-white/5 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">สถานะ</span>
                  <Badge variant={MOCK_STATS.auto_train.enabled?'success':'muted'}>{MOCK_STATS.auto_train.enabled ? 'เปิดใช้งาน' : 'ปิด'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Model Version</span>
                  <span className="text-sm font-mono text-cyan-400">{MOCK_STATS.auto_train.model_version}</span>
                </div>
              </div>
              
              <div className="mb-2 flex justify-between text-xs text-white/50">
                <span>ความคืบหน้า Dataset</span>
                <span>{MOCK_STATS.auto_train.current_progress} / {MOCK_STATS.auto_train.min_validated}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full mb-6">
                <div className="h-full bg-emerald-500 rounded-full" style={{width: \`\${(MOCK_STATS.auto_train.current_progress/MOCK_STATS.auto_train.min_validated)*100}%\`}} />
              </div>

              <div className="text-xs text-white/40 mb-auto">อัปเดตล่าสุด: {formatDate(MOCK_STATS.auto_train.last_trained)}</div>

              <Button className="w-full mt-4"><Download size={16}/> ดาวน์โหลดโมเดล (v2.4.1)</Button>
            </GlassCard>
          </div>
        </div>

        <GlassCard className="p-6 overflow-hidden" hover={false}>
          <h3 className="text-lg font-bold mb-6">รายชื่อผู้เชี่ยวชาญ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/40 border-b border-white/10">
                <tr>
                  <th className="pb-3">ชื่อ-นามสกุล</th>
                  <th className="pb-3">อีเมล</th>
                  <th className="pb-3">ความชำนาญ</th>
                  <th className="pb-3 text-right">จำนวนยืนยัน</th>
                  <th className="pb-3 text-right">ความแม่นยำ</th>
                  <th className="pb-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_EXPERTS.map(exp => (
                  <tr key={exp.id} className="border-b border-white/5">
                    <td className="py-4 font-bold">{exp.name}</td>
                    <td className="py-4 text-white/60">{exp.email}</td>
                    <td className="py-4"><Badge variant="info">{exp.specialty}</Badge></td>
                    <td className="py-4 text-right">{exp.validated.toLocaleString()}</td>
                    <td className="py-4 text-right text-emerald-400">{exp.accuracy}%</td>
                    <td className="py-4 text-center">
                      <Badge variant={exp.status==='active'?'success':'muted'}>{exp.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function ShieldCheckIcon({className, size}:{className?:string, size?:number}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size||24} height={size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
}
`);

write('SKILL.md', `
---
name: thai-snake-classifier-demo
description: Demo web application for Thai Snake Image Classification with Expert Data Validation (HITL). Frontend Next.js demo with mock data. Based on thesis by Korawit Thipmonthian, NRRU CS 2569.
---

# 🐍 Thai Snake AI Classifier — SKILL Reference

## Project
- Researcher: กรวิชญ์ ทิพมนเทียน (Korawit Thipmonthian)
- University: มหาวิทยาลัยราชภัฏนครศรีธรรมราช (NRRU)
- Stack: Next.js + TypeScript + Tailwind CSS + Framer Motion + Three.js + Recharts
- Deploy: Vercel

## File Structure
\`\`\`
app/                    # Next.js App Router pages
  layout.tsx            # Root layout
  page.tsx              # Landing
  predict/page.tsx      # AI classification
  snakes/page.tsx       # Snake gallery
  snakes/[id]/page.tsx  # Snake detail
  expert/page.tsx       # Expert dashboard
  expert/annotate/[id]  # Annotation tool
  admin/page.tsx        # Admin dashboard
  login/page.tsx        # Mock login
components/
  layout/               # Navbar, Footer
  ui/                   # GlassCard, Badge, DangerBar, Button
  home/                 # HeroSection, Features, Stats, SpeciesStrip, CTA
lib/
  types.ts              # TypeScript interfaces
  data.ts               # Mock data (7 snakes, images, experts, stats)
  utils.ts              # Helpers
\`\`\`

## Mock Credentials
- Expert: expert@snake.ai / demo1234
- Admin: admin@snake.ai / admin1234

## Snake Species (QSMI Reference)
7 medically important venomous snakes of Thailand.
Neurotoxic: งูเห่าไทย, งูจงอาง, งูสามเหลี่ยม, งูทับสมิงคลา
Hemotoxic: งูกะปะ, งูแมวเซา, งูเขียวหางไหม้

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Framework: Next.js (auto-detected)
4. No env vars needed (all mock data)
`);
