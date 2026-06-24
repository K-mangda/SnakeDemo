import { useState } from 'react'
import { ARCHIVED_MODELS, ACTIVE_MODEL } from '@/lib/data'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import SelectBtn from '@/components/ui/SelectBtn'
import {
  BrainCircuit, X, ChevronDown, Filter, Package, Cpu, Zap, Download, Search, Check
} from 'lucide-react'

type ModelFormat = 'pt' | 'onnx' | 'tflite'

interface ModelExportModalProps {
  onClose: () => void;
}

export default function ModelExportModal({ onClose }: ModelExportModalProps) {
  const [downloading, setDownloading] = useState(false)
  const { showToast } = useToast()

  const activeModel = ACTIVE_MODEL
  const archivedModels = ARCHIVED_MODELS
  const allVersions = [activeModel, ...archivedModels]

  const [versionSearch, setVersionSearch] = useState('')
  const filteredVersions = allVersions
    .filter(m => m.version.toLowerCase().includes(versionSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.version === activeModel.version) return -1
      if (b.version === activeModel.version) return 1
      return b.accuracy - a.accuracy
    })

  const [selectedVersion, setSelectedVersion] = useState(activeModel.version)
  const [modelFormat, setModelFormat] = useState<ModelFormat>('pt')
  const [includeConfig, setIncludeConfig] = useState(true)
  const [includeClassNames, setIncludeClassNames] = useState(true)
  const [includeOnnxMeta, setIncludeOnnxMeta] = useState(false)
  const [quantize, setQuantize] = useState(false)

  const currentModel = allVersions.find(m => m.version === selectedVersion) ?? activeModel
  const isActive = selectedVersion === activeModel.version

  const formatDetails: Record<ModelFormat, { label: string; size: string; desc: string; icon: React.ReactNode; color: string }> = {
    pt: { label: 'PyTorch (.pt)', size: '~78 MB', desc: 'YOLOv8 weights, Use with Python/GPU', icon: <Cpu size={16} />, color: 'purple' },
    onnx: { label: 'ONNX', size: '~80 MB', desc: 'Universal runtime support', icon: <Zap size={16} />, color: 'amber' },
    tflite: { label: 'TFLite', size: '~22 MB', desc: 'Android/iOS Edge deployment', icon: <Package size={16} />, color: 'blue' },
  }

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => { 
      setDownloading(false)
      showToast(`Model ${selectedVersion} downloaded as ${modelFormat.toUpperCase()}!`)
      onClose()
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <BrainCircuit size={20} className="text-purple-500" /> Model Weights Export
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Version Selector */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <ChevronDown size={12} /> Select Model Version
              </p>
              <div className="relative w-40">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <input
                  type="text"
                  placeholder="Search version..."
                  value={versionSearch}
                  onChange={(e) => setVersionSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 pl-7 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredVersions.length === 0 && (
                <div className="text-center text-sm text-zinc-500 py-8 border-2 border-dashed border-zinc-800 rounded-xl">No model version found.</div>
              )}
              {filteredVersions.map(m => {
                const active = m.version === selectedVersion
                const isActiveModel = m.version === activeModel.version
                return (
                  <button
                    key={m.version}
                    onClick={() => setSelectedVersion(m.version)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer ${
                      active ? 'border-purple-500/50 bg-purple-500/8' : 'border-transparent bg-zinc-800/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        active ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700 text-zinc-400'
                      }`}>v</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>{m.version}</span>
                          {isActiveModel && (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">{m.date} · {m.classes} classes · {m.trainImages.toLocaleString()} train imgs</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`text-right`}>
                        <div className={`text-sm font-bold ${m.accuracy >= 94 ? 'text-emerald-400' : m.accuracy >= 90 ? 'text-amber-400' : 'text-zinc-400'}`}>{m.accuracy}%</div>
                        <div className="text-xs text-zinc-600">Accuracy</div>
                      </div>
                      {active ? <Check size={16} className="text-purple-400" /> : <div className="w-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Model Format */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter size={12} /> Model Format
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(formatDetails) as ModelFormat[]).map(f => {
                const fd = formatDetails[f]
                const active = modelFormat === f
                const colorMap: Record<string, string> = {
                  purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
                  amber: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
                  blue: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
                }
                return (
                  <button
                    key={f}
                    onClick={() => setModelFormat(f)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                      active ? colorMap[fd.color] : 'border-transparent bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {fd.icon}
                    <div className="text-center">
                      <div className="text-xs font-semibold">{fd.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{fd.size}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-zinc-500 mt-2 pl-1">{formatDetails[modelFormat].desc}</p>
          </section>


          {/* Include Options */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package size={12} /> Additional Options
            </p>
            <div className="flex flex-wrap gap-2">
              <SelectBtn active={includeConfig} onClick={() => setIncludeConfig(p => !p)} color="purple">Include Config (.yaml)</SelectBtn>
              <SelectBtn active={includeClassNames} onClick={() => setIncludeClassNames(p => !p)} color="purple">Include Class Names</SelectBtn>
              {modelFormat === 'onnx' && (
                <SelectBtn active={includeOnnxMeta} onClick={() => setIncludeOnnxMeta(p => !p)} color="amber">ONNX Metadata</SelectBtn>
              )}
              {modelFormat === 'tflite' && (
                <SelectBtn active={quantize} onClick={() => setQuantize(p => !p)} color="blue">INT8 Quantization</SelectBtn>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 bg-zinc-900/80 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-purple-400 font-semibold text-base">{selectedVersion}</span>
              {isActive && <span className="text-xs text-emerald-400 ml-1">(Active)</span>}
              <span className="text-zinc-600">·</span>
              <span><span className={`font-semibold text-base ${currentModel.accuracy >= 94 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentModel.accuracy}%</span> Accuracy</span>
              <span className="text-zinc-600">·</span>
              <span>{currentModel.trainImages.toLocaleString()} images</span>
              <span className="text-zinc-600">·</span>
              <span>{currentModel.classes} species</span>
              <span className="text-zinc-600">·</span>
              <span><span className="text-purple-400 font-semibold text-base">{formatDetails[modelFormat].size}</span></span>
              <span className="text-zinc-600">·</span>
              <span>{modelFormat.toUpperCase()}</span>
            </div>
            <div className="text-xs text-zinc-600">ZIP</div>
          </div>
          <Button onClick={handleDownload} disabled={downloading} className="w-full justify-center py-3.5 text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 border-none transition-all">
            {downloading ? <><Download className="animate-bounce" size={18} /> Preparing file...</> : <><Download size={18} /> Download {selectedVersion}.{modelFormat}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
