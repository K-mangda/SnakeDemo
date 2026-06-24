'use client'

import { ACTIVE_MODEL } from '@/lib/data'
import Badge from '@/components/ui/Badge'
import { Server, Activity, RefreshCw } from 'lucide-react'
import SystemTelemetry from '@/components/admin/SystemTelemetry'
import DatasetHealth from '@/components/admin/DatasetHealth'
import DataReview from '@/components/admin/DataReview'
import ModelVersionControl from '@/components/admin/ModelVersionControl'
import AuthorizedExperts from '@/components/admin/AuthorizedExperts'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">System Telemetry & Admin</h1>
            <p className="text-zinc-500 font-light">Administrative monitoring, dataset, and infrastructure control.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Badge variant="success"><Server size={12} className="mr-1 animate-pulse"/> API Online</Badge>
            <Badge variant="info"><Activity size={12} className="mr-1 animate-pulse"/> Model {ACTIVE_MODEL.version}</Badge>
            <Badge variant="success"><RefreshCw size={12} className="mr-1 animate-[spin_2s_linear_infinite]"/> Ready to Train</Badge>
          </div>
        </header>

        <SystemTelemetry />
        <DatasetHealth />
        <DataReview />
        <ModelVersionControl />
        <AuthorizedExperts />

      </div>
    </main>
  )
}
