'use client'
import { MOCK_STATS } from '@/lib/data'

export default function StatsSection() {
  const stats = [
    { label: 'Total Scans', value: MOCK_STATS.total_predictions.toLocaleString() },
    { label: 'Model Accuracy', value: `${MOCK_STATS.model_accuracy}%` },
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
