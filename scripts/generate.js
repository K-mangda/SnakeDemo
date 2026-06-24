const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', filepath);
};

write('components/home/HeroSection.tsx', `
'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { MOCK_STATS } from '@/lib/data'
import Button from '@/components/ui/Button'
import { MousePointer2 } from 'lucide-react'

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    // Particles
    const particleCount = 3000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const r = 2.2 + (Math.random() - 0.5) * 0.4

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const t = (positions[i * 3 + 1] + 2.5) / 5
      colors[i * 3] = 0.06 + t * 0.02
      colors[i * 3 + 1] = 0.73 - t * 0.14
      colors[i * 3 + 2] = 0.51 + t * 0.32
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(geo, mat)
    scene.add(particles)

    let mouseX = 0, mouseY = 0
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouseMove)

    let frame = 0
    const animate = () => {
      requestAnimationFrame(animate)
      frame += 0.005
      particles.rotation.y += 0.0015
      particles.rotation.x = mouseY * 0.15
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.03
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.03
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(16,185,129,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          DEEP LEARNING · HUMAN-IN-THE-LOOP · EXPERT VALIDATION
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 animate-fade-up" style={{animationDelay:'0.1s'}}>
          ระบบ AI จำแนกงูไทย<br />
          <span className="gradient-text">ที่ผู้เชี่ยวชาญเชื่อถือได้</span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{animationDelay:'0.2s'}}>
          เว็บแอปพลิเคชันสนับสนุนการเรียนรู้เชิงลึก อัปโหลดภาพถ่ายงู
          รับผลการจำแนกพร้อมข้อมูลพิษและวิธีปฐมพยาบาลทันที
          ด้วยโมเดล YOLO Object Detection ที่ผ่านการยืนยันโดยผู้เชี่ยวชาญ
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-fade-up" style={{animationDelay:'0.3s'}}>
          <Button href="/predict" size="lg" className="w-full sm:w-auto">
            <span className="text-xl">🔬</span> เริ่มจำแนกภาพ →
          </Button>
          <Button href="/snakes" variant="ghost" size="lg" className="w-full sm:w-auto">
            <span className="text-xl">📚</span> คลังงู 7 ชนิด
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16 animate-fade-up" style={{animationDelay:'0.4s'}}>
          {[
            { num: MOCK_STATS.total_predictions.toLocaleString(), label: 'ภาพที่จำแนกแล้ว' },
            { num: MOCK_STATS.model_accuracy + '%', label: 'ความแม่นยำ' },
            { num: '7 ชนิด', label: 'งูพิษที่รองรับ' },
            { num: MOCK_STATS.total_experts + ' คน', label: 'ผู้เชี่ยวชาญ' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.num}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs animate-fade-up" style={{animationDelay:'1s'}}>
        <div className="w-6 h-9 rounded-full border-2 border-white/20 flex justify-center p-1">
          <div className="w-1 h-2 bg-emerald-500 rounded-full animate-float" />
        </div>
        เลื่อนลง
      </div>
    </section>
  )
}
`);

write('components/home/FeaturesSection.tsx', `
'use client'
import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import { Scan, Users, RefreshCw, AlertTriangle, BarChart3, Globe } from 'lucide-react'

const features = [
  {
    icon: <Scan size={28} className="text-emerald-400" />,
    bg: 'bg-emerald-500/10',
    title: 'AI Object Detection',
    desc: 'โมเดล YOLO ตรวจจับและจำแนกชนิดงูพร้อม Bounding Box แสดงตำแหน่งงูในภาพถ่ายอย่างแม่นยำ',
    badges: [{ l: 'YOLO Detection', v: 'success' as const }, { l: '94.7% Accuracy', v: 'info' as const }]
  },
  {
    icon: <Users size={28} className="text-cyan-400" />,
    bg: 'bg-cyan-500/10',
    title: 'Human-in-the-Loop',
    desc: 'ผู้เชี่ยวชาญตรวจสอบและแก้ไข Bounding Box ผ่าน Annotation Tool ระบบรวมผลด้วย Majority Vote',
    badges: [{ l: 'HITL Process', v: 'info' as const }, { l: 'Majority Vote', v: 'purple' as const }]
  },
  {
    icon: <RefreshCw size={28} className="text-purple-400" />,
    bg: 'bg-purple-500/10',
    title: 'Auto-Retraining',
    desc: 'เมื่อได้รับ Clean Dataset ครบตามเกณฑ์ ระบบจะ Retrain โมเดลโดยอัตโนมัติเพื่อเพิ่มความแม่นยำ',
    badges: [{ l: 'Auto Pipeline', v: 'purple' as const }, { l: 'Dataset v2.4.1', v: 'warning' as const }]
  },
  {
    icon: <AlertTriangle size={28} className="text-red-400" />,
    bg: 'bg-red-500/10',
    title: 'ข้อมูลพิษวิทยา',
    desc: 'แสดงระดับความอันตราย ถิ่นที่อยู่อาศัย และวิธีปฐมพยาบาล อ้างอิงจากสถานเสาวภา สภากาชาดไทย',
    badges: [{ l: 'QSMI Reference', v: 'danger' as const }]
  },
  {
    icon: <BarChart3 size={28} className="text-amber-400" />,
    bg: 'bg-amber-500/10',
    title: 'Admin Dashboard',
    desc: 'ดูสถิติภาพรวม จัดการบัญชีผู้เชี่ยวชาญ ตั้งค่าเงื่อนไข Auto-training และดาวน์โหลดโมเดล',
    badges: [{ l: 'Statistics', v: 'warning' as const }, { l: 'Model Management', v: 'success' as const }]
  },
  {
    icon: <Globe size={28} className="text-emerald-400" />,
    bg: 'bg-emerald-500/10',
    title: 'ใช้งานได้ทันที',
    desc: 'ไม่ต้องสมัครสมาชิกสำหรับผู้ใช้ทั่วไป เปิดเว็บและอัปโหลดภาพงูได้เลย รองรับทุกอุปกรณ์',
    badges: [{ l: 'No Registration', v: 'success' as const }, { l: 'Responsive', v: 'info' as const }]
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-[#0A1628]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
            ฟีเจอร์หลัก
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">ระบบที่ครบครัน <span className="gradient-text">ทั้ง 3 มิติ</span></h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">ออกแบบสำหรับ 3 กลุ่มผู้ใช้งาน ครอบคลุมทุกขั้นตอน ตั้งแต่การทำนายไปจนถึงการสร้าง Clean Dataset</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="h-full p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-bl-[100px]" />
                <div className={\`w-14 h-14 rounded-2xl \${f.bg} flex items-center justify-center mb-6\`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-white/60 mb-6 flex-grow leading-relaxed">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.badges.map((b, j) => (
                    <Badge key={j} variant={b.v}>{b.l}</Badge>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
`);

write('components/home/StatsSection.tsx', `
'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MOCK_STATS } from '@/lib/data'
import GlassCard from '@/components/ui/GlassCard'

const stats = [
  { label: 'ภาพงูในระบบ', val: MOCK_STATS.total_images },
  { label: 'ภาพที่ยืนยันแล้ว', val: MOCK_STATS.validated_images },
  { label: 'ความแม่นยำโมเดล', val: MOCK_STATS.model_accuracy, suffix: '%' },
  { label: 'การจำแนกทั้งหมด', val: MOCK_STATS.total_predictions }
]

function Counter({ to, suffix = '' }: { to: number, suffix?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const startTime = performance.now()
    
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - p, 3)
      setCount(to * easeOut)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to])

  const isFloat = to % 1 !== 0
  const display = isFloat ? count.toFixed(1) : Math.floor(count).toLocaleString()

  return <span ref={ref}>{display}{suffix}</span>
}

export default function StatsSection() {
  return (
    <section className="py-20 bg-[#050B18]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-8 text-center" hover={false}>
                <div className="text-4xl md:text-5xl font-black gradient-text mb-2">
                  <Counter to={s.val} suffix={s.suffix} />
                </div>
                <div className="text-sm font-medium text-white/50">{s.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
`);

write('components/home/SpeciesStrip.tsx', `
'use client'
import { SNAKE_DATA } from '@/lib/data'
import { useRouter } from 'next/navigation'
import { getDangerBadgeClass } from '@/lib/utils'

export default function SpeciesStrip() {
  const router = useRouter()

  return (
    <section className="py-12 bg-gradient-to-b from-[#050B18] to-[#0A1628]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider mb-6">
          🐍 งูพิษสำคัญ 7 ชนิด (อ้างอิงสถานเสาวภา)
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {SNAKE_DATA.map(snake => (
            <div
              key={snake.id}
              onClick={() => router.push('/snakes/' + snake.id)}
              className="flex-none flex items-center gap-4 p-4 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all snap-start"
            >
              <span className="text-3xl">{snake.emoji}</span>
              <div>
                <div className="font-bold whitespace-nowrap">{snake.name_th}</div>
                <div className="text-xs text-white/40 italic whitespace-nowrap">{snake.scientific}</div>
              </div>
              <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 \${getDangerBadgeClass(snake.danger_level)}\`}>
                Lv.{snake.danger_level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
`);

write('components/home/CTASection.tsx', `
'use client'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#0A1628] to-cyan-500/10"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
              🚀 เริ่มต้นใช้งานฟรี
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">พบงูใน? <span className="gradient-text">ถ่ายภาพส่งทันที</span></h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
              ระบบ AI วิเคราะห์ภาพและแจ้งระดับความอันตรายพร้อมวิธีปฐมพยาบาลในไม่กี่วินาที
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/predict" size="lg">🔬 จำแนกภาพงูเดี๋ยวนี้</Button>
              <Button href="/login" variant="ghost" size="lg">👨‍🔬 สำหรับผู้เชี่ยวชาญ</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
`);

write('app/page.tsx', `
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import SpeciesStrip from '@/components/home/SpeciesStrip'
import StatsSection from '@/components/home/StatsSection'
import CTASection from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SpeciesStrip />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </>
  )
}
`);

write('app/predict/page.tsx', `
'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Scan, AlertTriangle, ShieldCheck } from 'lucide-react'
import { SNAKE_DATA } from '@/lib/data'
import type { Snake } from '@/lib/types'
import { getDangerBadgeClass } from '@/lib/utils'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import DangerBar from '@/components/ui/DangerBar'

export default function PredictPage() {
  const [imgUrl, setImgUrl] = useState<string|null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Snake|null>(null)
  const [confidence, setConfidence] = useState(0)
  const [tab, setTab] = useState<'firstaid'|'info'|'antivenom'>('firstaid')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImgUrl(URL.createObjectURL(file))
  }

  const handleSample = (s: Snake) => {
    // Generate placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 480
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,640,480)
    ctx.font = '120px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText(s.emoji, 320, 240)
    setImgUrl(canvas.toDataURL())
    setResult(null)
  }

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          finish()
          return 100
        }
        return p + Math.random() * 15
      })
    }, 200)
  }

  const finish = () => {
    setIsAnalyzing(false)
    const snake = SNAKE_DATA[Math.floor(Math.random() * SNAKE_DATA.length)]
    setResult(snake)
    setConfidence(parseFloat(snake.confidence_avg.toString()) + (Math.random()*4-2))
  }

  useEffect(() => {
    if (result && imgRef.current && canvasRef.current) {
      const c = canvasRef.current
      const ctx = c.getContext('2d')!
      c.width = imgRef.current.width
      c.height = imgRef.current.height
      
      const x = c.width * 0.2, y = c.height * 0.15, w = c.width * 0.6, h = c.height * 0.7
      
      ctx.strokeStyle = '#10B981'
      ctx.lineWidth = 3
      ctx.strokeRect(x,y,w,h)
      
      ctx.fillStyle = '#10B981'
      ctx.fillRect(x, Math.max(0, y-30), 200, 30)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Inter'
      ctx.fillText(result.name_th + ' ' + confidence.toFixed(1) + '%', x+10, Math.max(20, y-10))
    }
  }, [result, confidence])

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
            🔬 AI Snake Detection
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">จำแนกชนิดงู<span className="gradient-text">ด้วย AI</span></h1>
          <p className="text-white/60">อัปโหลดภาพถ่ายงู ระบบจะวิเคราะห์และระบุชนิด พร้อมแสดง Bounding Box และข้อมูลปฐมพยาบาล</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT: Upload */}
          <div className="space-y-6">
            {!imgUrl ? (
              <GlassCard className="p-10 text-center border-dashed hover:border-emerald-500/50 cursor-pointer" hover={false}>
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">ลากวางหรือคลิกเพื่ออัปโหลด</h3>
                  <p className="text-white/40 text-sm">รองรับ JPG, PNG, WebP — ขนาดสูงสุด 10MB</p>
                </label>
              </GlassCard>
            ) : (
              <GlassCard className="p-4 overflow-hidden relative">
                <div className="relative rounded-lg overflow-hidden bg-black/50 flex justify-center">
                  <img ref={imgRef} src={imgUrl} alt="Preview" className="max-h-[400px] object-contain" />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                  
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin mb-4" />
                      <div className="text-emerald-400 font-bold mb-4">กำลังวิเคราะห์ภาพ...</div>
                      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-200" style={{width: \`\${progress}%\`}} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-4">
                  <Button onClick={startAnalysis} disabled={isAnalyzing || !!result} className="flex-1">
                    <Scan size={18} /> {result ? 'วิเคราะห์เสร็จสิ้น' : 'วิเคราะห์ภาพ'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setImgUrl(null); setResult(null); }} disabled={isAnalyzing}>ล้าง</Button>
                </div>
              </GlassCard>
            )}

            {!imgUrl && (
              <GlassCard className="p-6">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4">ทดลองด้วยภาพตัวอย่าง</div>
                <div className="grid grid-cols-4 gap-2">
                  {SNAKE_DATA.map(s => (
                    <button key={s.id} onClick={() => handleSample(s)} className="aspect-square flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all">
                      <span className="text-3xl mb-1">{s.emoji}</span>
                      <span className="text-[10px] text-white/60 truncate w-full text-center px-1">{s.name_th}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* RIGHT: Result */}
          <div>
            {!result ? (
              <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center text-white/20 p-8 text-center" hover={false}>
                <Scan size={64} className="mb-4" />
                <p>อัปโหลดภาพงูเพื่อเริ่มการวิเคราะห์</p>
              </GlassCard>
            ) : (
              <div className="space-y-6 animate-fade-up">
                <GlassCard className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-xs text-white/40 uppercase tracking-widest">ผลการวิเคราะห์</div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1"><ShieldCheck size={14}/> สำเร็จ</span>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
                      {result.emoji}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black mb-1">{result.name_th}</h2>
                      <div className="text-white/40 italic text-sm">{result.scientific}</div>
                      <div className="text-white/60 text-sm mt-1">{result.family}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">ความเชื่อมั่น (Confidence)</span>
                      <span className="text-emerald-400 font-bold">{confidence.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{width: \`\${confidence}%\`}} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">ระดับความอันตราย</span>
                    <span className={\`px-3 py-1 rounded-full text-xs font-bold \${getDangerBadgeClass(result.danger_level)}\`}>
                      {result.danger_label}
                    </span>
                  </div>
                  <DangerBar level={result.danger_level} />
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-6">
                    {(['firstaid','info','antivenom'] as const).map(t => (
                      <button key={t} onClick={()=>setTab(t)} className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${tab===t?'bg-emerald-500 text-white':'text-white/50 hover:bg-white/5 hover:text-white'}\`}>
                        {t === 'firstaid' ? '🚨 ปฐมพยาบาล' : t === 'info' ? '📋 ข้อมูลงู' : '💉 เซรุ่ม'}
                      </button>
                    ))}
                  </div>

                  {tab === 'firstaid' && (
                    <div className="space-y-3 animate-fade-up">
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-300 text-sm mb-4">
                        <AlertTriangle size={20} className="shrink-0" />
                        <div>กรณีฉุกเฉิน โทร 1669 หรือ 1554 ทันที</div>
                      </div>
                      {result.first_aid.map((step, i) => (
                        <div key={i} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-lg items-start">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                          <div className="text-sm text-white/80">{step}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tab === 'info' && (
                    <div className="space-y-4 animate-fade-up">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-white/40 mb-1">ความยาว</div>
                          <div className="font-semibold">{result.length_cm} ซม.</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-white/40 mb-1">ถิ่นที่อยู่</div>
                          <div className="font-semibold text-sm">{result.habitat}</div>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-xs text-white/40 mb-1">อาการเมื่อถูกกัด</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {result.symptoms.map((s,i) => <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-full border border-amber-500/20">{s}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'antivenom' && (
                    <div className="animate-fade-up">
                      <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
                        <div className="text-xs text-purple-300 mb-2 uppercase tracking-widest">เซรุ่มแก้พิษงูที่ต้องใช้</div>
                        <div className="text-lg font-bold">{result.antivenom}</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-xs text-white/40 mb-1">แหล่งข้อมูลอ้างอิง</div>
                        <div className="text-emerald-400 font-semibold text-sm">สถานเสาวภา สภากาชาดไทย (QSMI)</div>
                      </div>
                    </div>
                  )}
                </GlassCard>
                
                <Button href={\`/snakes/\${result.id}\`} variant="ghost" className="w-full">ดูข้อมูลอย่างละเอียด 📖</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
`);
