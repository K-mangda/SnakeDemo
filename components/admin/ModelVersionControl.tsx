'use client'

import { useEffect, useState } from 'react'
import { Activity, Info, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { fetchAdminOverview, type AdminOverview } from '@/components/admin/SystemTelemetry'

function metric(value: number | null) { return value === null ? 'Unavailable' : `${(value * 100).toFixed(2)}%` }

export default function ModelVersionControl() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  async function load() { setLoading(true); setError(null); try { setOverview(await fetchAdminOverview()) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load model information.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const model = overview?.activeModel
  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Activity size={20} className="text-blue-400" /> Active model information</h2><p className="mt-1 text-sm text-zinc-500">Read-only record from the active `model_versions` database row.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{error ? <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : loading ? <p className="mt-6 text-sm text-zinc-500">Loading active model information…</p> : model ? <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50"><dl className="grid divide-y divide-zinc-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0"><div className="p-4"><dt className="text-xs uppercase tracking-wider text-zinc-500">Version</dt><dd className="mt-1 text-sm font-medium text-zinc-100">{model.version}</dd></div><div className="p-4"><dt className="text-xs uppercase tracking-wider text-zinc-500">Recorded at</dt><dd className="mt-1 text-sm text-zinc-200">{new Date(model.recordedAt).toLocaleString()}</dd></div><div className="p-4"><dt className="text-xs uppercase tracking-wider text-zinc-500">mAP@50</dt><dd className="mt-1 text-sm text-emerald-300">{metric(model.map50)}</dd></div><div className="p-4"><dt className="text-xs uppercase tracking-wider text-zinc-500">Precision / Recall</dt><dd className="mt-1 text-sm text-zinc-200">{metric(model.precision)} / {metric(model.recall)}</dd></div><div className="p-4 sm:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Model path</dt><dd className="mt-1 break-all font-mono text-xs text-zinc-300">{model.modelPath ?? 'Unavailable'}</dd></div></dl></div> : <p className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-500">No active model record is available.</p>}<p className="mt-5 flex gap-2 text-xs leading-5 text-zinc-500"><Info size={15} className="mt-0.5 shrink-0" />Deployment and rollback are not configured, so this section does not offer model-switching controls.</p></section>
}
