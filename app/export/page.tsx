'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, BrainCircuit, CheckCircle2, ChevronDown, Database, Download, FileCode2, FileJson, Image as ImageIcon, Package, ShieldCheck } from 'lucide-react'
import { MOCK_STATS } from '@/lib/data'
import Button from '@/components/ui/Button'
import DatasetExportModal from '@/components/export/DatasetExportModal'

type ModelArtifact = {
  name: string
  format: string
  runtime: string
  size: number | null
  updatedAt: string | null
  url: string
}

type ModelRelease = {
  version: string
  architecture: string
  classCount: number | null
  releasedAt: string | null
  metrics: { map50: number | null; map50_95: number | null }
  artifacts: ModelArtifact[]
}

type ModelReleaseResponse = {
  releases: ModelRelease[]
  recommendedVersion: string
}

export default function ExportPage() {
  const [showDatasetModal, setShowDatasetModal] = useState(false)
  const [modelReleases, setModelReleases] = useState<ModelRelease[]>([])
  const [recommendedVersion, setRecommendedVersion] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [releaseMenuOpen, setReleaseMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = showDatasetModal ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showDatasetModal])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/model-release', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load model release.')))
      .then((response: ModelReleaseResponse) => {
        setModelReleases(response.releases)
        setRecommendedVersion(response.recommendedVersion)
        setSelectedVersion(response.recommendedVersion)
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.error(error)
      })
    return () => controller.abort()
  }, [])

  const modelRelease = modelReleases.find(release => release.version === selectedVersion) ?? null
  const recommendedArtifact = modelRelease?.artifacts.find(artifact => artifact.format.includes('ONNX')) ?? modelRelease?.artifacts[0]

  return (
    <main className="min-h-screen bg-zinc-950 px-6 pb-24 pt-32 text-zinc-100">
      {showDatasetModal && <DatasetExportModal onClose={() => setShowDatasetModal(false)} />}

      <div className="mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="text-sm font-medium text-emerald-400">NSTRU Vision resources</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl">Models and datasets, ready to use.</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">Download the latest snake-classification model weights or a verified dataset package for your own work.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-7 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><BrainCircuit size={23} /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-emerald-300">Free model download</p>
                    {modelRelease?.version === recommendedVersion && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Recommended</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{modelRelease?.version === recommendedVersion ? 'Recommended by validation results' : 'Available model release'}</p>
                </div>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">NSTRU Snake Classifier</h2>
              <p className="mt-2 text-sm text-zinc-400">{modelRelease ? `${modelRelease.version} · ${modelRelease.architecture}` : 'Loading release details…'}</p>
              {modelReleases.length > 1 && (
                <div className="relative mt-4 inline-block">
                  <button onClick={() => setReleaseMenuOpen(open => !open)} aria-haspopup="menu" aria-expanded={releaseMenuOpen} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500">
                    <span>Model version: {modelRelease?.version}</span><ChevronDown size={15} className={releaseMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>
                  {releaseMenuOpen && (
                    <div role="menu" className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
                      {modelReleases.map(release => (
                        <button key={release.version} role="menuitem" onClick={() => { setSelectedVersion(release.version); setReleaseMenuOpen(false) }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${release.version === selectedVersion ? 'bg-emerald-500/10 text-emerald-200' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                          <span className="font-medium">{release.version}</span>
                          {release.version === recommendedVersion && <span className="text-xs text-emerald-400">Best</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-400">Trained model weights for identifying Thai snake species. Choose a release format that fits your inference environment.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {recommendedArtifact ? (
                  <a href={recommendedArtifact.url} className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"><Download size={18} /> Download {recommendedArtifact.format}</a>
                ) : (
                  <Button disabled size="lg" className="min-w-48 justify-center"><Download size={18} /> Release unavailable</Button>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-3 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-400" /> No account required</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Metric label="Validation mAP50" value={formatMetric(modelRelease?.metrics.map50)} />
              <Metric label="Validation mAP50–95" value={formatMetric(modelRelease?.metrics.map50_95)} />
              <Metric label="Snake species" value={modelRelease?.classCount ? String(modelRelease.classCount) : '—'} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-300"><Package size={20} /></div>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">Model files</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight">Choose your runtime</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Published files are loaded directly from the public model release bucket.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {modelRelease?.artifacts.map(artifact => (
                <a key={artifact.name} href={artifact.url} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition hover:border-emerald-500/50 hover:bg-emerald-500/5">
                  {artifact.format.includes('ONNX') ? <FileJson size={16} className="text-zinc-400" /> : <FileCode2 size={16} className="text-zinc-400" />}
                  <p className="mt-3 text-sm font-medium text-zinc-200">{artifact.format}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{artifact.name} · {formatFileSize(artifact.size)}</p>
                </a>
              ))}
            </div>
            {modelRelease && modelRelease.artifacts.length === 0 && <p className="mt-6 text-sm text-amber-300">No published files are available for this release yet.</p>}
            <a href="https://docs.ultralytics.com/modes/export/" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition hover:text-emerald-300">About the available formats <ArrowUpRight size={16} /></a>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-300"><ImageIcon size={20} /></div>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-400">Verified data</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight">Training dataset</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Reviewed images with final species labels and bounding boxes for training and research.</p>
            <div className="mt-6 border-y border-zinc-800 py-4">
              <p className="text-2xl font-semibold tracking-tight text-zinc-100">{MOCK_STATS.validated_images.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">verified images available for dataset export</p>
            </div>
            <Button onClick={() => setShowDatasetModal(true)} variant="outline" className="mt-6 w-full justify-center"><Database size={16} /> Export dataset</Button>
          </div>
        </section>

        <section className="mt-8 flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/20 px-5 py-4 text-sm text-zinc-500">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          <p>Dataset packages include verified annotations only. Model and dataset downloads are available to all users.</p>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">{value}</p></div>
}

function formatFileSize(size: number | null) {
  if (!size) return 'size unavailable'
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatMetric(value: number | null | undefined) {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'
}
