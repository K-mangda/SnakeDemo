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
    setActiveTab(storedAdminTab())
  }, [])

  function selectTab(tab: AdminTab) {
    setActiveTab(tab)
    window.sessionStorage.setItem('admin-active-tab', tab)
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">System Telemetry & Admin</h1>
            <p className="text-zinc-500 font-light">Administrative monitoring, dataset, and infrastructure control.</p>
          </div>
        </header>

        <div className="mb-8 flex gap-1 border-b border-zinc-800" role="tablist" aria-label="Admin sections">
          {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => selectTab(tab.id)} className={'relative px-4 py-3 text-sm font-medium transition-colors ' + (activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300')}>{tab.label}{activeTab === tab.id && <span className="absolute inset-x-4 bottom-0 h-px bg-emerald-400" />}</button>)}
        </div>

        {activeTab === 'overview' && <><SystemTelemetry /><DatasetHealth /><DatasetPublisher /></>}
        {activeTab === 'review' && <><DataReview /><ConsensusAudit /><SpeciesCatalogue /></>}
        {activeTab === 'system' && <><ModelVersionControl /><AuthorizedExperts /></>}

      </div>
    </main>
  )
}
