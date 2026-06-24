const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('app/snakes/[id]/page.tsx', `
'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, ShieldAlert, Crosshair, Map, Shield } from 'lucide-react'
import { SNAKE_DATA } from '@/lib/data'
import { Snake } from '@/lib/types'
import { getDangerColor } from '@/lib/utils'

export default function SnakeDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  const snake = SNAKE_DATA.find((s) => s.id.toString() === params.id) as Snake | undefined

  useEffect(() => {
    if (!snake) router.push('/snakes')
  }, [snake, router])

  if (!snake) return null

  return (
    <main className="min-h-screen pt-28 px-6 pb-20 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <Link href="/snakes" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8">
          <ArrowLeft size={16} /> Return to Database
        </Link>

        <header className="mb-12 border-b border-zinc-900 pb-8 flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-medium text-zinc-100">{snake.name_en}</h1>
              <span className={\`px-2.5 py-1 text-xs font-medium rounded-sm border border-zinc-800 bg-zinc-900 \${getDangerColor(snake.danger_level)}\`}>
                {snake.danger_label}
              </span>
            </div>
            <p className="text-lg text-zinc-400 italic mb-1">{snake.scientific}</p>
            <p className="text-sm text-zinc-500">Local Name: {snake.name_th} · Family: {snake.family}</p>
          </div>
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Model Accuracy</span>
            <span className="text-2xl font-mono text-emerald-400">{snake.confidence_avg}%</span>
            <span className="text-xs text-zinc-500 mt-1">based on {snake.predictions.toLocaleString()} samples</span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crosshair size={16} className="text-zinc-500" /> Morphological Profile
              </h2>
              <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-6 text-sm text-zinc-400 leading-relaxed">
                {snake.description}
                <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/50">
                  <div>
                    <span className="block text-xs text-zinc-500 mb-1">Length</span>
                    <span className="text-zinc-300 font-medium">{snake.length_cm} cm</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500 mb-1">Habitat</span>
                    <span className="text-zinc-300 font-medium">{snake.habitat}</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={16} className="text-zinc-500" /> Clinical Symptoms
              </h2>
              <ul className="space-y-3">
                {snake.symptoms.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-400 items-start">
                    <span className="text-amber-500/50 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <div className="border border-red-900/30 bg-red-950/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={16} /> First Aid Protocol
              </h3>
              <ol className="space-y-4">
                {snake.first_aid.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-300">
                    <span className="font-mono text-red-500/50">{i + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border border-emerald-900/30 bg-emerald-950/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={16} /> Antivenom
              </h3>
              <p className="text-sm text-zinc-300 mb-4">{snake.antivenom}</p>
              <p className="text-xs text-zinc-500">Provided by Queen Saovabha Memorial Institute (QSMI)</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
`);

write('app/expert/page.tsx', `
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { MOCK_IMAGES, MOCK_STATS } from '@/lib/data'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function ExpertPage() {
  const pending = MOCK_IMAGES.filter(img => img.status === 'pending')

  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-900 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">Expert Workspace</h1>
            <p className="text-zinc-500 font-light">Human-in-the-loop verification pipeline.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Pending Verification</p>
            <p className="text-2xl font-mono text-zinc-100">{MOCK_STATS.pending_images.toLocaleString()}</p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.slice(0, 6).map((img) => (
            <div key={img.id} className="border border-zinc-800 rounded-xl bg-zinc-900/20 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs text-zinc-500">{img.filename}</span>
                <Badge variant="warning"><Clock size={12} className="mr-1"/> Pending</Badge>
              </div>
              <div className="aspect-video bg-zinc-900 border border-zinc-800/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-zinc-700 text-xs">Image Data Encrypted</span>
                {/* Simulated Bounding Box */}
                <div className="absolute border border-emerald-500 bg-emerald-500/10" style={{ left: '20%', top: '20%', width: '50%', height: '40%' }} />
              </div>
              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-1">AI Prediction ({img.ai_confidence}%)</p>
                <p className="text-sm font-medium text-zinc-300">{img.ai_prediction.scientific}</p>
              </div>
              <Button href={\`/expert/annotate/\${img.id}\`} variant="secondary" className="mt-auto w-full">
                Verify Classification
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
`);
