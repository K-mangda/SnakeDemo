'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, CloudUpload, ExternalLink, LoaderCircle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type PublishRun = {
  status: string
  conclusion: string | null
  createdAt: string
  updatedAt: string
  url: string
  title: string
}

type PublishStatus = { configured: boolean; run: PublishRun | null }

export default function DatasetPublisher() {
  const [publisher, setPublisher] = useState<PublishStatus | null>(null)
  const [version, setVersion] = useState('v1')
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  async function request(method: 'GET' | 'POST', body?: object) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sign in is required.')
    const response = await fetch('/api/admin/dataset-publish', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.detail ?? 'Dataset publisher request failed.')
    return payload
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try { setPublisher(await request('GET')) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load the dataset publisher.') } finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    void request('GET').then(payload => { if (active) setPublisher(payload) }).catch(requestError => { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load the dataset publisher.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function publish() {
    setPublishing(true)
    setError(null)
    try {
      await request('POST', { version })
      setPublisher(current => current ? { ...current, run: { status: 'queued', conclusion: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), title: `Publish ${version}`, url: '' } } : current)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start the publish job.')
    } finally { setPublishing(false) }
  }

  const run = publisher?.run
  const running = run && ['queued', 'in_progress', 'pending', 'requested', 'waiting'].includes(run.status)
  const published = run?.status === 'completed' && run.conclusion === 'success'

  return <section className="mb-12 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.035] p-6">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <div className="flex items-center gap-2 text-lg font-medium text-zinc-100"><CloudUpload size={20} className="text-emerald-400" /> Dataset publisher</div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Builds YOLO, COCO, and CSV ZIP packages from only verified final annotations. The job runs on GitHub Actions, not on this computer or the inference service.</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading || publishing}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh status</Button>
    </div>

    <div className="mt-6 grid gap-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <label htmlFor="dataset-version" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Release version</label>
        <input id="dataset-version" value={version} onChange={event => setVersion(event.target.value)} placeholder="v1" className="mt-2 block w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-400" />
        <p className="mt-2 text-xs text-zinc-600">Publishing the same version replaces that version’s ZIP files with the latest verified data.</p>
      </div>
      <Button onClick={() => setShowPublishConfirm(true)} disabled={publishing || loading || !publisher?.configured} className="min-w-52 justify-center py-2.5"><CloudUpload size={17} /> {publishing ? 'Starting job…' : 'Publish dataset'}</Button>
    </div>

    {loading ? <p className="mt-4 text-sm text-zinc-500">Checking publisher status…</p> : error ? <p className="mt-4 flex gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} className="shrink-0" />{error}</p> : !publisher?.configured ? <p className="mt-4 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"><CircleAlert size={17} className="shrink-0" />One-time GitHub publisher setup is still required before this button can start jobs.</p> : run ? <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${published ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : running ? 'border-sky-500/20 bg-sky-500/10 text-sky-200' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}><span className="flex items-center gap-2">{published ? <CheckCircle2 size={17} /> : running ? <LoaderCircle size={17} className="animate-spin" /> : <CircleAlert size={17} />}{published ? 'Published successfully' : running ? `Publish job ${run.status}` : `Publish job ${run.conclusion ?? run.status}`}</span>{run.url && <a href={run.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4">View job <ExternalLink size={13} /></a>}</div> : <p className="mt-4 text-sm text-zinc-500">No dataset publish job has run yet.</p>}
    {showPublishConfirm && <div role="dialog" aria-modal="true" aria-labelledby="publish-confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
        <h3 id="publish-confirm-title" className="text-lg font-semibold text-zinc-100">Publish dataset release?</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">This will build a new dataset package for <strong className="font-medium text-zinc-100">{version.trim() || 'this version'}</strong> using only verified final annotations.</p>
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm leading-5 text-amber-100">If this version already exists, its YOLO, COCO, and CSV ZIP files will be replaced with the latest verified data.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowPublishConfirm(false)}>Cancel</Button>
          <Button onClick={() => { setShowPublishConfirm(false); void publish() }}><CloudUpload size={16} /> Publish {version.trim() || 'release'}</Button>
        </div>
      </div>
    </div>}
  </section>
}
