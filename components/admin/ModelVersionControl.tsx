'use client'

import { useEffect, useState } from 'react'
import { Activity, Info } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import RollbackConfirmModal from '@/components/admin/modals/RollbackConfirmModal'
import { supabase } from '@/lib/supabase/client'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'
import { onAdminRefresh } from '@/lib/admin-refresh'

type ModelVersion = {
  id: number
  version_name: string
  model_path: string | null
  map50: number | null
  precision_score: number | null
  recall_score: number | null
  is_active: boolean
  created_at: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

function formatScore(value: number | null) {
  return value === null ? '—' : (value * 100).toFixed(1) + '%'
}

export default function ModelVersionControl() {
  const { showToast } = useToast()
  const [models, setModels] = useState<ModelVersion[]>(() => readAdminCache<ModelVersion[]>('model-version-control') ?? [])
  const [loading, setLoading] = useState(() => readAdminCache<ModelVersion[]>('model-version-control') === null)
  const [error, setError] = useState<string | null>(null)
  const [activating, setActivating] = useState<number | null>(null)
  const [confirmation, setConfirmation] = useState<ModelVersion | null>(null)

  async function sessionHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sign in is required.')
    return { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/models', { headers: await sessionHeaders(), cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Could not load the model registry.')
      const nextModels = payload.models as ModelVersion[]
      setModels(nextModels)
      writeAdminCache('model-version-control', nextModels)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load the model registry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (readAdminCache<ModelVersion[]>('model-version-control') === null) void load()
    return onAdminRefresh('system', () => { void load() })
  }, [])

  async function activate(model: ModelVersion) {
    setActivating(model.id)
    try {
      const response = await fetch('/api/admin/models', { method: 'PATCH', headers: await sessionHeaders(), body: JSON.stringify({ id: model.id }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Could not update the active model.')
      const nextModels = models.map(item => ({ ...item, is_active: item.id === payload.model.id }))
      setModels(nextModels)
      writeAdminCache('model-version-control', nextModels)
      showToast(model.version_name + ' is now the active model version in the registry.')
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Could not update the active model.', 'error')
    } finally {
      setActivating(null)
    }
  }

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
    {confirmation && <RollbackConfirmModal version={confirmation.version_name} onClose={() => setConfirmation(null)} onConfirm={() => { void activate(confirmation); setConfirmation(null) }} />}
    <div className="mb-6"><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Activity size={20} className="text-blue-400" /> Model registry</h2><p className="mt-2 text-sm text-zinc-500">Registered model versions and their recorded validation metrics.</p></div>
    {loading ? <div aria-busy="true" aria-label="Loading model registry" className="animate-pulse overflow-hidden rounded-lg border border-zinc-800"><div className="h-11 border-b border-zinc-800 bg-zinc-900/60" />{[0, 1, 2].map(item => <div key={item} className="h-16 border-b border-zinc-800 last:border-b-0" />)}</div> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : models.length === 0 ? <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-10 text-center"><p className="text-sm text-zinc-400">No model versions are registered yet.</p><p className="mt-1 text-xs text-zinc-600">Add a released model to the model_versions table before it can be selected.</p></div> : <div className="overflow-x-auto rounded-lg border border-zinc-800"><table className="min-w-[720px] w-full text-left text-sm"><thead className="border-b border-zinc-800 bg-zinc-900/40 text-[11px] font-medium uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Version</th><th className="px-4 py-3">Registered</th><th className="px-4 py-3">mAP@50</th><th className="px-4 py-3">Precision</th><th className="px-4 py-3 text-right">Status</th></tr></thead><tbody className="divide-y divide-zinc-800">{models.map(model => <tr key={model.id} className={model.is_active ? 'bg-emerald-500/[0.035]' : 'hover:bg-zinc-900/40'}><td className="px-4 py-4"><p className="font-medium text-zinc-100">{model.version_name}</p>{model.model_path && <p className="mt-1 max-w-56 truncate font-mono text-xs text-zinc-600" title={model.model_path}>{model.model_path}</p>}</td><td className="px-4 py-4 text-zinc-400">{formatDate(model.created_at)}</td><td className="px-4 py-4 text-zinc-300">{formatScore(model.map50)}</td><td className="px-4 py-4 text-zinc-300">{formatScore(model.precision_score)}</td><td className="px-4 py-4 text-right">{model.is_active ? <Badge variant="success" className="inline-flex">Active registry</Badge> : <Button variant="ghost" size="sm" onClick={() => setConfirmation(model)} disabled={activating !== null}>{activating === model.id ? 'Updating…' : 'Set active'}</Button>}</td></tr>)}</tbody></table></div>}
    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-zinc-500"><Info size={14} className="mt-0.5 shrink-0" /> Setting an active version updates the Supabase registry. The prediction service must be configured to read this registry before it can switch the running inference model.</p>
  </section>
}
