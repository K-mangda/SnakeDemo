const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('components/home/StatsSection.tsx', `
'use client'
import { MOCK_STATS } from '@/lib/data'

export default function StatsSection() {
  const stats = [
    { label: 'Total Scans', value: MOCK_STATS.total_predictions.toLocaleString() },
    { label: 'Model Accuracy', value: \`\${MOCK_STATS.model_accuracy}%\` },
    { label: 'Verified Samples', value: MOCK_STATS.validated_images.toLocaleString() },
    { label: 'Active Experts', value: MOCK_STATS.active_experts }
  ]

  return (
    <section className="py-16 border-t border-zinc-900 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col border-l border-zinc-800 pl-6">
            <span className="text-3xl font-light text-zinc-100 mb-1">{s.value}</span>
            <span className="text-xs uppercase tracking-widest text-zinc-500">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
`);

write('app/expert/annotate/[id]/page.tsx', `
'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Maximize } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AnnotatePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-end border-b border-zinc-900 pb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2 text-zinc-500">
              <ArrowLeft size={16} /> Back to Workspace
            </Button>
            <h1 className="text-2xl font-medium text-zinc-100">Verification Task #492</h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">Image: IMG_20260600.jpg</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden relative min-h-[500px]">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button className="bg-zinc-800/80 p-2 rounded text-zinc-300 hover:bg-zinc-700 transition"><Maximize size={16} /></button>
            </div>
            {/* Simulated Bounding Box Edit Area */}
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-zinc-600 font-mono text-sm">Image Canvas (Interactive)</span>
               <div className="absolute border-2 border-emerald-500 bg-emerald-500/10 cursor-move" style={{ left: '20%', top: '20%', width: '40%', height: '40%' }}>
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-500" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-emerald-500" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-500" />
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-widest">Model Inference</h3>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md mb-4">
                <span className="text-xs text-zinc-500">Predicted Class</span>
                <p className="text-zinc-200 font-medium mt-1">Naja kaouthia (94.2%)</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full justify-between" variant="secondary">
                  Confirm AI Prediction <Check size={16} className="text-emerald-400" />
                </Button>
                <Button className="w-full justify-between" variant="secondary">
                  Override Prediction <X size={16} className="text-red-400" />
                </Button>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-widest">Bounding Box</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400 font-mono">
                <div>X: 120px</div>
                <div>Y: 85px</div>
                <div>W: 450px</div>
                <div>H: 320px</div>
              </div>
              <Button className="w-full mt-6" variant="ghost">Reset Coordinates</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
`);

write('app/admin/page.tsx', `
'use client'
import { MOCK_STATS, MOCK_EXPERTS } from '@/lib/data'
import Badge from '@/components/ui/Badge'
import { Server, ShieldCheck, Activity } from 'lucide-react'

export default function AdminPage() {
  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">System Telemetry</h1>
            <p className="text-zinc-500 font-light">Administrative monitoring and infrastructure control.</p>
          </div>
          <div className="flex gap-4">
            <Badge variant="success"><Server size={12} className="mr-1"/> API Online</Badge>
            <Badge variant="info"><Activity size={12} className="mr-1"/> Model v{MOCK_STATS.auto_train.model_version}</Badge>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-xl">
            <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Model Accuracy</h3>
            <p className="text-3xl font-mono text-emerald-400">{MOCK_STATS.model_accuracy}%</p>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-xl">
            <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Total Predictions</h3>
            <p className="text-3xl font-mono text-zinc-100">{MOCK_STATS.total_predictions.toLocaleString()}</p>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-xl">
            <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pending Validation</h3>
            <p className="text-3xl font-mono text-amber-400">{MOCK_STATS.pending_images.toLocaleString()}</p>
          </div>
        </div>

        <h2 className="text-xl font-medium text-zinc-100 mb-6 flex items-center gap-2">
          <ShieldCheck size={20} className="text-zinc-500" /> Authorized Personnel
        </h2>
        
        <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-900/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                <th className="p-4 font-medium">Expert Name</th>
                <th className="p-4 font-medium">Specialty</th>
                <th className="p-4 font-medium">Validated</th>
                <th className="p-4 font-medium">Accuracy</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {MOCK_EXPERTS.map(exp => (
                <tr key={exp.id} className="hover:bg-zinc-800/30">
                  <td className="p-4">
                    <p className="font-medium text-zinc-200">{exp.name}</p>
                    <p className="text-xs text-zinc-500">{exp.email}</p>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{exp.specialty}</td>
                  <td className="p-4 font-mono text-sm text-zinc-300">{exp.validated.toLocaleString()}</td>
                  <td className="p-4 font-mono text-sm text-zinc-300">{exp.accuracy}%</td>
                  <td className="p-4">
                    <Badge variant={exp.status === 'active' ? 'success' : 'muted'}>{exp.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
`);

write('app/login/page.tsx', `
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Hexagon, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.includes('admin')) router.push('/admin')
    else router.push('/expert')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
            <Hexagon size={24} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-medium text-zinc-100">System Authentication</h1>
          <p className="text-sm text-zinc-500 mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <Button className="w-full mt-4" size="lg">
            Authenticate <Lock size={16} />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-xs text-zinc-500 font-mono">
          <p className="mb-2 uppercase tracking-widest text-[10px]">Demo Credentials</p>
          <div className="flex justify-between mb-1"><span>Expert:</span> <span className="text-zinc-400">expert@snake.ai / demo1234</span></div>
          <div className="flex justify-between"><span>Admin:</span> <span className="text-zinc-400">admin@snake.ai / admin1234</span></div>
        </div>
      </div>
    </main>
  )
}
`);
