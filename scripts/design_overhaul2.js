const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('components/home/HeroSection.tsx', `
'use client'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { Hexagon, ArrowRight, ShieldCheck, Database, Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Live: Model v2.4.1 (Accuracy: 94.7%)
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-zinc-100 mb-6 leading-tight">
            Venomous Snake <br/>
            <span className="text-zinc-500">Classification System</span>
          </h1>
          
          <p className="text-zinc-400 text-lg mb-8 max-w-xl font-light leading-relaxed">
            Advanced computer vision model trained on verified herpetological datasets. Designed for clinical triage and rapid species identification in medical emergencies.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/predict" size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-white font-semibold">
              Initialize Analysis <ArrowRight size={18} />
            </Button>
            <Button href="/snakes" variant="secondary" size="lg">
              View Database
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-zinc-900">
            {[
              { icon: ShieldCheck, label: 'Verified', val: 'Human-in-the-loop' },
              { icon: Database, label: 'Data', val: 'QSMI Referenced' },
              { icon: Zap, label: 'Latency', val: '< 200ms API' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-2">
                <stat.icon size={18} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <span className="text-sm font-medium text-zinc-300">{stat.val}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="aspect-square border border-zinc-800/50 rounded-2xl bg-zinc-900/20 backdrop-blur-3xl flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            <Hexagon size={160} strokeWidth={0.5} className="text-zinc-700 absolute" />
            <Hexagon size={120} strokeWidth={1} className="text-zinc-600 absolute animate-spin-slow" />
            <Hexagon size={80} strokeWidth={1.5} className="text-emerald-500 absolute" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
`);

write('components/home/FeaturesSection.tsx', `
'use client'
import { motion } from 'framer-motion'
import { Cpu, Users, RefreshCw, AlertTriangle, BarChart3, Globe } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    { icon: Cpu, title: 'AI Detection Architecture', desc: 'YOLO-based automated detection system optimized for low-light conditions.' },
    { icon: Users, title: 'Human-in-the-Loop', desc: 'Expert verification layer prevents data drift and ensures taxonomic accuracy.' },
    { icon: RefreshCw, title: 'Continuous Learning', desc: 'Automated CI/CD pipeline triggers retraining upon reaching threshold verified samples.' },
    { icon: AlertTriangle, title: 'Clinical Toxicology', desc: 'Integrates medical protocols and antivenom data referenced from QSMI standards.' },
    { icon: BarChart3, title: 'System Analytics', desc: 'Real-time telemetry and distribution monitoring via administrative dashboard.' },
    { icon: Globe, title: 'Zero-Footprint Client', desc: 'Progressive Web App accessible on any device without installation requirements.' }
  ]

  return (
    <section className="py-24 border-t border-zinc-900 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-zinc-100 mb-4">System Capabilities</h2>
          <p className="text-zinc-400 font-light max-w-2xl">Core infrastructure combining machine learning, human expertise, and medical databases.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
          {features.map((F, i) => (
            <motion.div key={i} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} transition={{delay: i*0.1}} viewport={{once:true}} className="group">
              <F.icon size={24} className="text-zinc-500 mb-4 group-hover:text-emerald-400 transition-colors" />
              <h3 className="text-sm font-medium text-zinc-200 mb-2">{F.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{F.desc}</p>
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
import Link from 'next/link'
import { SNAKE_DATA } from '@/lib/data'
import { ChevronRight } from 'lucide-react'

export default function SpeciesStrip() {
  return (
    <section className="py-24 border-t border-zinc-900 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl font-medium text-zinc-100 mb-2">Taxonomic Coverage</h2>
            <p className="text-zinc-400 font-light">Supported species in the current model iteration.</p>
          </div>
          <Link href="/snakes" className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SNAKE_DATA.slice(0, 8).map(s => (
            <Link key={s.id} href={\`/snakes/\${s.id}\`} className="group p-4 border border-zinc-800/50 bg-zinc-900/30 rounded-lg hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{s.family}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: s.color}} />
              </div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">{s.scientific}</h3>
              <p className="text-xs text-zinc-500">{s.name_th} · {s.name_en}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
`);
