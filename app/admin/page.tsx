'use client'

import SystemTelemetry from '@/components/admin/SystemTelemetry'
import DatasetHealth from '@/components/admin/DatasetHealth'
import DataReview from '@/components/admin/DataReview'
import ModelVersionControl from '@/components/admin/ModelVersionControl'
import AuthorizedExperts from '@/components/admin/AuthorizedExperts'
import ConsensusAudit from '@/components/admin/ConsensusAudit'
import DatasetPublisher from '@/components/admin/DatasetPublisher'
import SpeciesCatalogue from '@/components/admin/SpeciesCatalogue'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { refreshAdminTab } from '@/lib/admin-refresh'

type AdminTab = 'overview' | 'review' | 'system'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'review', label: 'Reviews' },
  { id: 'system', label: 'Access & models' },
]

function storedAdminTab(): AdminTab {
  if (typeof window === 'undefined') return 'overview'
  const value = window.sessionStorage.getItem('admin-active-tab')
  return value === 'review' || value === 'system' || value === 'overview' ? value : 'overview'
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveTab(storedAdminTab()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  function selectTab(tab: AdminTab) {
    setActiveTab(tab)
    window.sessionStorage.setItem('admin-active-tab', tab)
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-12 selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">System Telemetry & Admin</h1>
            <p className="text-zinc-500 font-light">Administrative monitoring, dataset, and infrastructure control.</p>
          </div>
        </header>

        <div className="mb-8 flex items-center justify-between border-b border-zinc-800">
          <div className="flex gap-1" role="tablist" aria-label="Admin sections">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => selectTab(tab.id)} className={'relative px-4 py-3 text-sm font-medium transition-colors ' + (activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300')}>{tab.label}{activeTab === tab.id && <span className="absolute inset-x-4 bottom-0 h-px bg-emerald-400" />}</button>)}</div>
          <Button variant="ghost" size="sm" onClick={() => refreshAdminTab(activeTab)}><RefreshCw size={14} /> Refresh</Button>
        </div>

        {activeTab === 'overview' && <><SystemTelemetry /><DatasetHealth /><DatasetPublisher /></>}
        {activeTab === 'review' && <><section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="mb-5"><h2 className="text-lg font-medium text-zinc-100">Review queues</h2><p className="mt-2 text-sm text-zinc-500">Manage items that need action and track decisions already made by experts.</p></div><div className="overflow-hidden rounded-lg border border-zinc-800"><div className="hidden bg-zinc-900/40 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1fr)_72px_128px]"><span>Status</span><span className="text-right">Items</span><span className="text-right">Action</span></div><DataReview embedded /><ConsensusAudit embedded /></div></section><SpeciesCatalogue /></>}
        {activeTab === 'system' && <><ModelVersionControl /><AuthorizedExperts /></>}

      </div>
    </main>
  )
}
