'use client'
import { motion } from 'framer-motion'
import React from 'react'
import Button from '@/components/ui/Button'
import { ArrowRight, ShieldCheck, Database, Zap } from 'lucide-react'
import NodeGraph from './NodeGraph'
import { MOCK_STATS } from '@/lib/data'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-zinc-950 to-zinc-950 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center lg:text-left flex flex-col items-center lg:items-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Live: Model {MOCK_STATS.auto_train.model_version} (Accuracy: {MOCK_STATS.model_accuracy}%)
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-zinc-100 mb-6 leading-tight">
            Venomous Snake <br/>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Classification System</span>
          </h1>
          
          <p className="text-zinc-400 text-lg mb-8 max-w-xl font-light leading-relaxed mx-auto lg:mx-0">
            Advanced computer vision model trained on verified herpetological datasets. Designed for clinical triage and rapid species identification in medical emergencies.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button href="/predict" size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-white font-semibold w-full sm:w-auto justify-center">
              Initialize Analysis <ArrowRight size={18} />
            </Button>
            <Button href="/database" variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
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
          className="relative hidden lg:block h-full min-h-[500px]"
        >
          {/* Free-floating interactive node graph */}
          <NodeGraph />
        </motion.div>
      </div>
    </section>
  )
}
