'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Activity, ShieldAlert, Crosshair, Map, Shield,
  Droplet, Zap, AlertTriangle, CheckCircle2, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react'
import { SNAKE_DATA } from '@/lib/data'
import { Snake } from '@/lib/types'
import { getDangerColor } from '@/lib/utils'

// Accordion component for expandable sections
function Accordion({
  title,
  icon: Icon,
  iconClass,
  headerClass,
  containerClass,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  iconClass?: string
  headerClass?: string
  containerClass?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`rounded-xl border overflow-hidden ${containerClass}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:brightness-110"
      >
        <span className={`text-sm font-medium uppercase tracking-widest flex items-center gap-2 ${headerClass}`}>
          <Icon size={16} className={iconClass} />
          {title}
        </span>
        {open
          ? <ChevronUp size={16} className="text-zinc-500 shrink-0" />
          : <ChevronDown size={16} className="text-zinc-500 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}

// Image Carousel component
function ImageCarousel({ snakeId, name }: { snakeId: number; name: string }) {
  // Each snake gets 3 "angles" - reuse the 7 available mock images in a rotation
  const slides = [
    `/mock/snake_${((snakeId - 1) % 7) + 1}.png`,
    `/mock/snake_${((snakeId) % 7) + 1}.png`,
    `/mock/snake_${((snakeId + 1) % 7) + 1}.png`,
  ]
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(true)

  const prev = () => {
    setLoaded(false)
    setTimeout(() => {
      setCurrent((c) => (c - 1 + slides.length) % slides.length)
      setLoaded(true)
    }, 150)
  }
  const next = () => {
    setLoaded(false)
    setTimeout(() => {
      setCurrent((c) => (c + 1) % slides.length)
      setLoaded(true)
    }, 150)
  }

  const labels = ['Overview', 'Close-up', 'Habitat']

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Image */}
      <img
        src={slides[current]}
        alt={`${name} - ${labels[current]}`}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'}`}
        onError={(e) => {
          e.currentTarget.src = slides[0]
        }}
      />

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next image"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-5 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>

      {/* Image label badge */}
      <div className="absolute top-4 right-4 z-20">
        <span className="px-2 py-1 text-[10px] uppercase tracking-widest bg-black/50 backdrop-blur-md text-zinc-300 border border-white/10 rounded-full">
          {labels[current]}
        </span>
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-20">
        <span className="font-mono text-xs text-zinc-400">
          {current + 1} / {slides.length}
        </span>
      </div>
    </div>
  )
}

export default function SnakeDetailPage() {
  const params = useParams()
  const router = useRouter()

  const snake = SNAKE_DATA.find((s) => s.id.toString() === params.id) as Snake | undefined

  useEffect(() => {
    if (!snake) router.push('/database')
  }, [snake, router])

  if (!snake) return null

  const getVenomStyle = (venom: string) => {
    switch (venom) {
      case 'neurotoxic':
        return {
          icon: Zap,
          color: 'text-amber-400',
          bg: 'bg-amber-400/10',
          border: 'border-amber-400/20',
          label: 'พิษต่อระบบประสาท (Neurotoxic)',
        }
      case 'hemotoxic':
        return {
          icon: Droplet,
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          label: 'พิษต่อระบบโลหิต (Hemotoxic)',
        }
      default:
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10',
          border: 'border-emerald-400/20',
          label: 'ไม่มีพิษ (Non-venomous)',
        }
    }
  }

  const venomStyle = getVenomStyle(snake.venom_type)
  const VenomIcon = venomStyle.icon

  return (
    <main className="min-h-screen pt-28 px-6 pb-20 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/database"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Return to Database
        </Link>

        {/* ── Hero Header ── */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-medium text-zinc-100">{snake.name_en}</h1>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-sm border bg-zinc-900 ${getDangerColor(snake.danger_level)}`}
              >
                {snake.danger_label}
              </span>
            </div>
            <p className="text-xl text-zinc-400 italic mb-2">{snake.scientific}</p>
            <p className="text-zinc-500">
              <span className="text-zinc-300">{snake.name_th}</span>{' '}
              · Family:{' '}
              <span className="text-zinc-400">{snake.family}</span>
            </p>
          </div>

          {/* AI Accuracy meter */}
          <div className="hidden md:flex flex-col items-end text-right shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              AI Model Accuracy
            </span>
            <div className="flex items-center gap-3">
              <div className="w-36 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${snake.confidence_avg}%` }}
                />
              </div>
              <span className="text-2xl font-mono text-emerald-400">{snake.confidence_avg}%</span>
            </div>
            <span className="text-xs text-zinc-500 mt-1.5">
              Validated on {snake.predictions.toLocaleString()} samples
            </span>
          </div>
        </header>

        {/* ── Main 60 / 40 Layout ── */}
        {/* We use a custom grid: left col is ~3/5, right col is ~2/5 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ════════════════ LEFT (3/5 ≈ 60%) ════════════════ */}
          <div className="lg:col-span-3 space-y-8">

            {/* Image Carousel */}
            <ImageCarousel snakeId={snake.id} name={snake.name_en} />

            {/* Morphological Profile */}
            <section>
              <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crosshair size={16} className="text-zinc-500" /> Morphological Profile
              </h2>
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6 text-zinc-400 leading-relaxed">
                <p className="mb-6 text-sm">{snake.description}</p>

                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-800/50">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Avg. Length
                    </span>
                    <span className="text-zinc-200 font-medium">{snake.length_cm} cm</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Habitat
                    </span>
                    <span className="text-zinc-200 font-medium">{snake.habitat}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Distribution
                    </span>
                    <span className="text-zinc-200 font-medium flex items-center gap-1">
                      <Map size={12} className="text-zinc-500 shrink-0" />
                      {snake.distribution}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ════════════════ RIGHT (2/5 ≈ 40%) ════════════════ */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">

              {/* Venom Type – always visible */}
              <div
                className={`border ${venomStyle.border} ${venomStyle.bg} rounded-xl px-5 py-4 flex items-center gap-4`}
              >
                <div className={`p-2.5 rounded-lg ${venomStyle.bg} border ${venomStyle.border}`}>
                  <VenomIcon size={20} className={venomStyle.color} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">
                    Venom Classification
                  </p>
                  <p className={`text-sm font-semibold ${venomStyle.color}`}>{venomStyle.label}</p>
                </div>
              </div>

              {/* ── ACCORDION: Clinical Symptoms ── */}
              <Accordion
                title="Clinical Symptoms"
                icon={Activity}
                iconClass="text-zinc-500"
                headerClass="text-zinc-300"
                containerClass="border-zinc-800/50 bg-zinc-900/40"
                defaultOpen={true}
              >
                <ul className="space-y-3 pt-1">
                  {snake.symptoms.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-400 items-start">
                      <AlertTriangle
                        size={13}
                        className={`${venomStyle.color} mt-0.5 shrink-0 opacity-80`}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Accordion>

              {/* ── ACCORDION: First Aid Protocol ── */}
              <Accordion
                title="First Aid Protocol"
                icon={ShieldAlert}
                iconClass="text-red-400"
                headerClass="text-red-400"
                containerClass="border-red-900/30 bg-red-950/10"
                defaultOpen={true}
              >
                <ol className="space-y-3.5 pt-1">
                  {snake.first_aid.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300 items-start">
                      <span className="font-mono font-bold text-red-500/60 shrink-0 w-4 mt-0.5">
                        {i + 1}.
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </Accordion>

              {/* ── Antivenom – always visible ── */}
              <div className="border border-emerald-900/30 bg-emerald-950/10 rounded-xl px-5 py-4">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield size={15} /> Required Antivenom
                </h3>
                <p className="text-sm font-semibold text-emerald-100 mb-2">{snake.antivenom}</p>
                <p className="text-[10px] uppercase tracking-widest text-emerald-600">
                  Source: Queen Saovabha Memorial Institute (QSMI)
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
