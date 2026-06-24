import { useState } from 'react'
import { MOCK_STATS, SNAKE_DATA } from '@/lib/data'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import SelectBtn from '@/components/ui/SelectBtn'
import {
  Image as ImageIcon, X, CheckSquare, Square, ChevronDown, Filter, Layers, FileJson, FileSpreadsheet,
  BoxSelect, Package, Check, Search, Archive, Download
} from 'lucide-react'

type DatasetFormat = 'YOLO' | 'COCO' | 'VOC' | 'CSV' | 'RAW'
type ImageStatus = 'verified' | 'pending' | 'unclear' | 'new_class'

interface DatasetExportModalProps {
  onClose: () => void;
}

export default function DatasetExportModal({ onClose }: DatasetExportModalProps) {
  const [downloading, setDownloading] = useState(false)
  const { showToast } = useToast()

  // Format
  const [format, setFormat] = useState<DatasetFormat>('YOLO')

  // Species filter
  const allSpecies = SNAKE_DATA.map(s => s.id)
  const [selectedSpecies, setSelectedSpecies] = useState<number[]>(allSpecies)
  const [speciesSearch, setSpeciesSearch] = useState('')
  const toggleSpecies = (id: number) =>
    setSelectedSpecies(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAllSpecies = () =>
    setSelectedSpecies(selectedSpecies.length === allSpecies.length ? [] : allSpecies)

  const filteredSpecies = SNAKE_DATA.filter(s =>
    s.name_th.includes(speciesSearch) ||
    s.name_en.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.scientific.toLowerCase().includes(speciesSearch.toLowerCase())
  )

  // Dynamic status counts based on selected species
  const baseCount = selectedSpecies.reduce((sum, id) => sum + MOCK_STATS.species_distribution[id - 1], 0)
  const speciesRatio = MOCK_STATS.total_images > 0 ? baseCount / MOCK_STATS.total_images : 0

  // Status filter
  const statusOptions: { key: ImageStatus; label: string; count: number; color: string }[] = [
    { key: 'verified', label: 'Verified', count: Math.round(MOCK_STATS.validated_images * speciesRatio), color: 'emerald' },
    { key: 'pending', label: 'Pending Review', count: Math.round(MOCK_STATS.pending_images * speciesRatio), color: 'amber' },
    { key: 'unclear', label: 'Unclear', count: Math.round(MOCK_STATS.unclear_images * speciesRatio), color: 'red' },
    { key: 'new_class', label: 'New Class', count: Math.round(MOCK_STATS.waiting_for_new_class_images * speciesRatio), color: 'blue' },
  ]
  const [selectedStatus, setSelectedStatus] = useState<ImageStatus[]>(['verified'])
  const toggleStatus = (k: ImageStatus) =>
    setSelectedStatus(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  // Include options
  const [includeImages, setIncludeImages] = useState(true)
  const [includeLabels, setIncludeLabels] = useState(true)
  const [includeMeta, setIncludeMeta] = useState(false)
  const [splitDataset, setSplitDataset] = useState(true)
  const [trainRatio, setTrainRatio] = useState(80)

  // Estimated count & size
  const estImages = selectedStatus.reduce((sum, s) => {
    const opt = statusOptions.find(o => o.key === s)
    return sum + (opt ? opt.count : 0)
  }, 0)

  const sizePerImageMB = includeImages ? 0.2 : 0 // ~200KB per image
  const sizePerLabelMB = includeLabels ? 0.005 : 0 // ~5KB per label
  const totalSizeMB = estImages * (sizePerImageMB + sizePerLabelMB)
  const formattedSize = totalSizeMB > 1000 
    ? `${(totalSizeMB / 1024).toFixed(1)} GB` 
    : `${Math.round(totalSizeMB)} MB`

  const formatInfo: Record<DatasetFormat, { icon: React.ReactNode; desc: string }> = {
    YOLO: { icon: <BoxSelect size={14} />, desc: 'txt labels, images/ folder' },
    COCO: { icon: <FileJson size={14} />, desc: 'instances_*.json + images/' },
    VOC: { icon: <Layers size={14} />, desc: 'XML per image (Pascal VOC)' },
    CSV: { icon: <FileSpreadsheet size={14} />, desc: 'Metadata only, no images' },
    RAW: { icon: <ImageIcon size={14} />, desc: 'Raw images only, no labels' },
  }

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => { 
      setDownloading(false)
      showToast(`Dataset exported successfully as ${format}!`)
      onClose()
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ImageIcon size={20} className="text-emerald-500" /> Dataset Export
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* 1. Species Filter */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <ChevronDown size={12} /> Select Species
                <span className="font-normal text-zinc-600 normal-case tracking-normal">
                  ({selectedSpecies.length}/{allSpecies.length} species)
                </span>
              </p>
              <button onClick={toggleAllSpecies} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                {selectedSpecies.length === allSpecies.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search box */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Thai / English / Scientific name..."
                value={speciesSearch}
                onChange={e => setSpeciesSearch(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700 text-zinc-200 placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              {speciesSearch && (
                <button onClick={() => setSpeciesSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Compact scrollable list */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {filteredSpecies.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-sm">No species found</div>
              ) : (
                filteredSpecies.map(snake => {
                  const count = MOCK_STATS.species_distribution[snake.id - 1]
                  const active = selectedSpecies.includes(snake.id)
                  return (
                    <button
                      key={snake.id}
                      onClick={() => toggleSpecies(snake.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all duration-100 cursor-pointer ${
                        active
                          ? 'border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/12'
                          : 'border-transparent bg-zinc-800/40 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-medium truncate ${active ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {snake.name_th}
                        </span>
                        <span className="text-xs text-zinc-600 truncate hidden sm:inline">{snake.name_en}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-zinc-600 tabular-nums">{count?.toLocaleString()}</span>
                        {active
                          ? <CheckSquare size={14} className="text-emerald-500" />
                          : <Square size={14} className="text-zinc-600" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

          </section>

          {/* 2. Status Filter */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter size={12} /> Image Status
            </p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(s => (
                <SelectBtn key={s.key} active={selectedStatus.includes(s.key)} onClick={() => toggleStatus(s.key)} color={s.color}>
                  {s.label}
                  <span className="ml-1 opacity-60">({s.count.toLocaleString()})</span>
                </SelectBtn>
              ))}
            </div>
          </section>

          {/* 3. Export Format */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter size={12} /> Export Format
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(formatInfo) as DatasetFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setFormat(f)
                    if (f === 'RAW') {
                      setIncludeImages(true)
                      setIncludeLabels(false)
                    } else if (f === 'CSV') {
                      setIncludeImages(false)
                      setIncludeLabels(false)
                    } else {
                      setIncludeImages(true)
                      setIncludeLabels(true)
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer ${
                    format === f
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-transparent bg-zinc-800/60 hover:bg-zinc-800'
                  }`}
                >
                  <span className={`mt-0.5 ${format === f ? 'text-emerald-400' : 'text-zinc-500'}`}>{formatInfo[f].icon}</span>
                  <div>
                    <div className={`text-sm font-semibold ${format === f ? 'text-emerald-400' : 'text-zinc-300'}`}>{f}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{formatInfo[f].desc}</div>
                  </div>
                  {format === f && <Check size={14} className="ml-auto text-emerald-400 mt-0.5 shrink-0" />}
                </button>
              ))}
            </div>
          </section>

          {/* 4. Package Contents */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package size={12} /> Package Contents
            </p>
            <div className="flex flex-wrap gap-2">
              <SelectBtn active={includeImages} onClick={() => setIncludeImages(p => !p)} color="emerald">Images</SelectBtn>
              <SelectBtn active={includeLabels} onClick={() => setIncludeLabels(p => !p)} color="emerald">Labels/Annotations</SelectBtn>
              <SelectBtn active={includeMeta} onClick={() => setIncludeMeta(p => !p)} color="emerald">Metadata JSON</SelectBtn>
            </div>
          </section>

          {/* 5. Train/Val Split */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} /> Train / Val Split
              </p>
              <SelectBtn active={splitDataset} onClick={() => setSplitDataset(p => !p)} color="emerald">
                {splitDataset ? 'Enabled' : 'Disabled'}
              </SelectBtn>
            </div>
            {splitDataset && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Train <span className="text-emerald-400 font-medium">{trainRatio}%</span></span>
                  <span>Val <span className="text-zinc-300 font-medium">{100 - trainRatio}%</span></span>
                </div>
                <input
                  type="range" min={60} max={90} step={5} value={trainRatio}
                  onChange={e => setTrainRatio(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 bg-zinc-900/80 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Est. <span className="text-emerald-400 font-semibold text-base">{estImages.toLocaleString()}</span> images</span>
              <span className="text-zinc-600">·</span>
              <span><span className="text-emerald-400 font-semibold text-base">{formattedSize}</span></span>
              <span className="text-zinc-600">·</span>
              <span>{selectedSpecies.length} species</span>
              <span className="text-zinc-600">·</span>
              <span>{format}</span>
            </div>
            <div className="text-xs text-zinc-600">ZIP</div>
          </div>
          <Button onClick={handleDownload} disabled={downloading || selectedSpecies.length === 0 || selectedStatus.length === 0} className="w-full justify-center py-3.5 text-sm shadow-lg shadow-emerald-500/20">
            {downloading ? <><Archive className="animate-spin" size={18} /> Compressing...</> : <><Download size={18} /> Export Dataset Package</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
