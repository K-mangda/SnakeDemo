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
