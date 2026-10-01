'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, BrainCircuit, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
} from 'recharts'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'

type Telemetry = {
  counts: { total: number; verified: number; pending: number; unclear: number; waitingForNewClass: number }
  recentImageCreatedAt: string[]
  verifiedSpecies: { name: string; count: number }[]
}

type ModelRelease = {
  version: string
  architecture: string
  classCount: number | null
  releasedAt: string | null
  metrics: { map50: number | null; map50_95: number | null }
  artifacts: { name: string }[]
}

type CachedTelemetry = { telemetry: Telemetry; modelReleases: ModelRelease[] }

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function dayLabel(value: Date) {
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function TelemetrySkeleton() {
  return <div className="animate-pulse" aria-label="Loading system telemetry">
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {[0, 1].map(item => <div key={item} className="h-[350px] rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="h-4 w-48 rounded bg-zinc-800" /><div className="mt-8 h-64 rounded-lg bg-zinc-900/50" /></div>)}
    </div>
    <div className="grid md:grid-cols-3 gap-6 mb-12"><div className="h-[350px] rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 md:col-span-2"><div className="h-4 w-56 rounded bg-zinc-800" /><div className="mt-8 h-64 rounded-lg bg-zinc-900/50" /></div><div className="h-[350px] rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="h-4 w-32 rounded bg-zinc-800" /><div className="mx-auto mt-8 h-40 w-40 rounded-full border-[22px] border-zinc-800" /></div></div>
  </div>
}

export default function SystemTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(() => readAdminCache<CachedTelemetry>('system-telemetry')?.telemetry ?? null)
  const [modelReleases, setModelReleases] = useState<ModelRelease[]>(() => readAdminCache<CachedTelemetry>('system-telemetry')?.modelReleases ?? [])
  const [loading, setLoading] = useState(() => readAdminCache<CachedTelemetry>('system-telemetry') === null)
  const [error, setError] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<{ name: string; value: number; color: string } | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sign in is required.')
      const [telemetryResponse, releasesResponse] = await Promise.all([
        fetch('/api/admin/telemetry', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }),
        fetch('/api/model-release', { cache: 'no-store' }),
      ])
      const payload = await telemetryResponse.json()
      if (!telemetryResponse.ok) throw new Error(payload.detail ?? 'Could not load system telemetry.')
      const nextTelemetry = payload as Telemetry
      setTelemetry(nextTelemetry)
      const releasesPayload = await releasesResponse.json()
      const nextReleases = releasesResponse.ok ? releasesPayload.releases ?? [] : []
      setModelReleases(nextReleases)
      writeAdminCache('system-telemetry', { telemetry: nextTelemetry, modelReleases: nextReleases })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load system telemetry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (readAdminCache<CachedTelemetry>('system-telemetry') === null) void load() }, [])

  const activityData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const counts = new Map<string, number>()
    for (const createdAt of telemetry?.recentImageCreatedAt ?? []) {
      const key = localDateKey(new Date(createdAt))
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today)
      day.setDate(today.getDate() - 13 + index)
      const key = localDateKey(day)
      return { day: dayLabel(day), images: counts.get(key) ?? 0 }
    })
  }, [telemetry])

  const modelData = useMemo(() => modelReleases
    .filter(release => release.metrics.map50 !== null)
    .map(release => ({
    ...release,
    map50Percent: (release.metrics.map50 ?? 0) * 100,
  })), [modelReleases])
  const speciesData = useMemo(() => [...(telemetry?.verifiedSpecies ?? [])].sort((left, right) => right.count - left.count).slice(0, 5), [telemetry])
  const statusData = useMemo(() => telemetry ? [
    { name: 'Verified', value: telemetry.counts.verified, color: '#10b981' },
    { name: 'Pending', value: telemetry.counts.pending, color: '#f59e0b' },
    { name: 'Unclear', value: telemetry.counts.unclear, color: '#ef4444' },
    { name: 'New Class', value: telemetry.counts.waitingForNewClass, color: '#3b82f6' },
  ] : [], [telemetry])

  if (loading || !telemetry) {
    return <section className="mb-12">
      {error && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void load()}><RefreshCw size={14} /> Retry</Button></div>}
      <TelemetrySkeleton />
    </section>
  }

  return <section className="mb-12">
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl transition-all duration-300">
        <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2"><Activity size={16} className="text-emerald-500" /> Image Submissions (14 Days)</h3>
        <div className="h-64 select-none">{loading ? <p className="pt-20 text-center text-sm text-zinc-500">Loading image activity…</p> : <ResponsiveContainer width="100%" height="100%"><AreaChart accessibilityLayer={false} data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}><defs><linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ stroke: '#52525b', strokeWidth: 1 }} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} labelStyle={{ color: '#f4f4f5' }} itemStyle={{ color: '#34d399' }} wrapperStyle={{ outline: 'none' }} /><Area type="monotone" dataKey="images" name="Images recorded" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" /></AreaChart></ResponsiveContainer>}</div>
      </div>
      <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl transition-all duration-300">
        <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500" /> Model Performance by Version</h3>
        <div className="h-64 select-none">{loading ? <p className="pt-20 text-center text-sm text-zinc-500">Loading model versions…</p> : modelData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart accessibilityLayer={false} data={modelData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="version" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} /><YAxis dataKey="map50Percent" stroke="#52525b" fontSize={12} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={value => `${value}%`} tickLine={false} axisLine={false} width={48} /><Tooltip cursor={{ stroke: '#52525b', strokeWidth: 1 }} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} labelStyle={{ color: '#f4f4f5' }} itemStyle={{ color: '#c084fc' }} wrapperStyle={{ outline: 'none' }} /><Line type="monotone" dataKey="map50Percent" name="mAP@50" unit="%" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#18181b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-lg border border-dashed border-zinc-800 text-center"><p className="text-sm text-zinc-500">Unavailable<br/><span className="text-xs">No released model has mAP@50 metadata.</span></p></div>}</div>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl md:col-span-2 transition-all duration-300"><h3 className="text-sm font-medium text-zinc-300 mb-6">Top Verified Species Distribution</h3><div className="h-64 select-none">{loading ? <p className="pt-20 text-center text-sm text-zinc-500">Loading verified species…</p> : speciesData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart accessibilityLayer={false} data={speciesData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} /><XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} /><YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={120} /><Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} labelStyle={{ color: '#f4f4f5' }} itemStyle={{ color: '#60a5fa' }} wrapperStyle={{ outline: 'none' }} /><Bar dataKey="count" name="Verified images" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} /></BarChart></ResponsiveContainer> : <p className="pt-20 text-center text-sm text-zinc-500">No verified images are recorded yet.</p>}</div></div>
      <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl flex flex-col transition-all duration-300"><h3 className="text-sm font-medium text-zinc-300 mb-2">Dataset Status</h3><div className="flex-1 min-h-[200px] relative">{loading ? <p className="pt-20 text-center text-sm text-zinc-500">Loading status…</p> : <><ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer={false}><Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" onMouseEnter={(_, index) => setActiveStatus(statusData[index] ?? null)} onMouseLeave={() => setActiveStatus(null)}>{statusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-2xl font-mono" style={{ color: activeStatus?.color ?? '#f4f4f5' }}>{(activeStatus?.value ?? telemetry?.counts.total ?? 0).toLocaleString()}</span><span className="text-xs text-zinc-500">{activeStatus?.name ?? 'Total Images'}</span></div></>}</div><div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 mx-auto w-fit">{statusData.map(item => <div key={item.name} className="flex items-center gap-2 text-xs text-zinc-400"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>{item.name}</div>)}</div></div>
    </div>
  </section>
}
