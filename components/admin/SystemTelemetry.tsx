'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, Database, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

export type AdminOverview = {
  counts: { total: number; verified: number; pending: number; unclear: number; waitingForNewClass: number }
  verifiedSpecies: { id: number; name: string; scientificName: string; count: number }[]
  activeModel: { version: string; modelPath: string | null; map50: number | null; precision: number | null; recall: number | null; recordedAt: string } | null
}

export async function fetchAdminOverview() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sign in is required.')
  const response = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.detail ?? 'Could not load the administrative overview.')
  return payload as AdminOverview
}

export default function SystemTelemetry() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  async function load() { setLoading(true); setError(null); try { setOverview(await fetchAdminOverview()) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load the administrative overview.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const statusData = useMemo(() => overview ? [{ name: 'Verified', value: overview.counts.verified, color: '#10b981' }, { name: 'Pending', value: overview.counts.pending, color: '#f59e0b' }, { name: 'Unclear', value: overview.counts.unclear, color: '#ef4444' }, { name: 'New Class', value: overview.counts.waitingForNewClass, color: '#3b82f6' }] : [], [overview])
  const speciesData = useMemo(() => [...(overview?.verifiedSpecies ?? [])].sort((a, b) => b.count - a.count).slice(0, 5), [overview])
  return <section className="mb-12"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Activity size={20} className="text-emerald-400" /> System telemetry</h2><p className="mt-1 text-sm text-zinc-500">Image and verified-species counts are read from Supabase.</p></div><Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[['Total images', overview?.counts.total], ['Verified', overview?.counts.verified], ['Pending', overview?.counts.pending], ['Unclear', overview?.counts.unclear], ['Waiting for new class', overview?.counts.waitingForNewClass]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{loading ? '…' : Number(value).toLocaleString()}</p></div>)}</div><div className="mt-6 grid gap-6 md:grid-cols-3"><div className="min-h-72 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 md:col-span-2"><h3 className="mb-5 text-sm font-medium text-zinc-300">Verified images by species</h3>{loading ? <p className="text-sm text-zinc-500">Loading verified counts…</p> : speciesData.length ? <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={speciesData} layout="vertical" margin={{ left: 24, right: 16 }}><CartesianGrid stroke="#27272a" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" stroke="#52525b" fontSize={12} /><YAxis type="category" dataKey="name" width={130} stroke="#a1a1aa" fontSize={11} /><RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} /><Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className="text-sm text-zinc-500">No verified images are recorded yet.</p>}</div><div className="min-h-72 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><h3 className="text-sm font-medium text-zinc-300">Dataset status</h3>{loading ? <p className="mt-8 text-sm text-zinc-500">Loading status…</p> : <><div className="relative h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={67} paddingAngle={4} stroke="none">{statusData.map(item => <Cell key={item.name} fill={item.color} />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xl font-semibold text-zinc-100">{overview?.counts.total ?? 0}</p><p className="text-[11px] text-zinc-500">total images</p></div></div></div><div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">{statusData.map(item => <span key={item.name} className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div></>}</div></div><div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/20 p-5"><div className="flex items-center gap-2 text-sm font-medium text-zinc-300"><Database size={16} className="text-zinc-500" /> Operational metrics</div><p className="mt-3 text-sm text-zinc-500">Accuracy, daily trend, and API latency are <span className="text-zinc-300">Unavailable</span>: this system does not persist a source for those measurements.</p></div></>}</section>
}
