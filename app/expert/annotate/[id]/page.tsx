'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, MouseEvent as ReactMouseEvent, use } from 'react'
import { ArrowLeft, Check, X, Maximize, Search, HelpCircle, PlusCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { MOCK_IMAGES, SNAKE_DATA } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function AnnotatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const currentImage = MOCK_IMAGES.find(img => img.id === Number(id)) || MOCK_IMAGES[0]
  const { showToast } = useToast()

  
  // BBox state in percentages (0 to 100)
  const [bbox, setBbox] = useState({ x: 20, y: 20, w: 40, h: 40 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null) // 'tl', 'tr', 'bl', 'br'
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startBbox, setStartBbox] = useState(bbox)

  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [showSpeciesModal, setShowSpeciesModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: ReactMouseEvent, type: string) => {
    e.stopPropagation()
    setIsResizing(type === 'drag' ? null : type)
    if (type === 'drag') setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartBbox(bbox)
  }

  const handlePointerMove = (e: ReactMouseEvent) => {
    if (!isDragging && !isResizing) return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - startPos.x) / rect.width) * 100
    const dy = ((e.clientY - startPos.y) / rect.height) * 100

    const newBbox = { ...startBbox }

    if (isDragging) {
      newBbox.x = Math.max(0, Math.min(100 - newBbox.w, startBbox.x + dx))
      newBbox.y = Math.max(0, Math.min(100 - newBbox.h, startBbox.y + dy))
    } else if (isResizing) {
      if (isResizing.includes('l')) {
        newBbox.x = Math.max(0, Math.min(startBbox.x + startBbox.w - 5, startBbox.x + dx))
        newBbox.w = startBbox.w + (startBbox.x - newBbox.x)
      }
      if (isResizing.includes('r')) {
        newBbox.w = Math.max(5, Math.min(100 - startBbox.x, startBbox.w + dx))
      }
      if (isResizing.includes('t')) {
        newBbox.y = Math.max(0, Math.min(startBbox.y + startBbox.h - 5, startBbox.y + dy))
        newBbox.h = startBbox.h + (startBbox.y - newBbox.y)
      }
      if (isResizing.includes('b')) {
        newBbox.h = Math.max(5, Math.min(100 - startBbox.y, startBbox.h + dy))
      }
    }
    setBbox(newBbox)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setIsResizing(null)
  }

  const handleConfirm = () => {
    setIsConfirmed(true)
    showToast('Annotation saved successfully')
    setTimeout(() => {
      router.push('/expert')
    }, 1500)
  }

  const mockImageWidth = 1920
  const mockImageHeight = 1080

  const pxX = Math.round((bbox.x / 100) * mockImageWidth)
  const pxY = Math.round((bbox.y / 100) * mockImageHeight)
  const pxW = Math.round((bbox.w / 100) * mockImageWidth)
  const pxH = Math.round((bbox.h / 100) * mockImageHeight)

  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-5xl mx-auto relative">
        <header className="mb-8 flex justify-between items-end border-b border-zinc-900 pb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2 text-zinc-500">
              <ArrowLeft size={16} /> Back to Workspace
            </Button>
            <h1 className="text-2xl font-medium text-zinc-100">Verification Task #{currentImage.id}</h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">Image: IMG_{currentImage.id.toString().padStart(4, '0')}.jpg</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div 
            ref={containerRef}
            className="lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden relative min-h-[500px] select-none"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button className="bg-zinc-800/80 p-2 rounded text-zinc-300 hover:bg-zinc-700 transition"><Maximize size={16} /></button>
            </div>
            
            {/* Simulated Image Canvas */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <img src={currentImage.filename} alt="Subject" className="w-full h-full object-cover" />
            </div>

            {/* Interactive Bounding Box */}
            <div 
              className="absolute border-2 border-emerald-500 bg-emerald-500/10 cursor-move group" 
              style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.w}%`, height: `${bbox.h}%` }}
              onMouseDown={(e) => handlePointerDown(e, 'drag')}
            >
              {/* Resize Handles */}
              <div 
                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-500 cursor-nwse-resize opacity-0 group-hover:opacity-100" 
                onMouseDown={(e) => handlePointerDown(e, 'tl')}
              />
              <div 
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 cursor-nesw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handlePointerDown(e, 'tr')}
              />
              <div 
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-emerald-500 cursor-nesw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handlePointerDown(e, 'bl')}
              />
              <div 
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-500 cursor-nwse-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handlePointerDown(e, 'br')}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-6 relative overflow-hidden">
              {isConfirmed && (
                <div className="absolute inset-0 bg-zinc-950/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                  <Check className="text-emerald-500 mb-2" size={32} />
                  <p className="text-emerald-400 font-medium">Status Updated!</p>
                  <p className="text-zinc-500 text-sm mt-1">Returning to workspace...</p>
                </div>
              )}

              <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-widest">Model Inference</h3>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md mb-4">
                <span className="text-xs text-zinc-500">Predicted Class</span>
                <p className="text-zinc-200 font-medium mt-1">{currentImage.ai_prediction.scientific} ({currentImage.ai_confidence}%)</p>
                <p className="text-xs text-zinc-400 mt-0.5">{currentImage.ai_prediction.name_th} / {currentImage.ai_prediction.name_en}</p>
              </div>
              <div className="space-y-3">
                <Button onClick={handleConfirm} className="w-full justify-between" variant="primary">
                  Confirm Prediction <Check size={16} className="text-emerald-400" />
                </Button>
                <Button onClick={() => setShowOverrideModal(true)} className="w-full justify-between" variant="secondary">
                  Override Prediction <X size={16} className="text-red-400" />
                </Button>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 uppercase tracking-widest">Bounding Box Data</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400 font-mono">
                <div>X: {pxX}px</div>
                <div>Y: {pxY}px</div>
                <div>W: {pxW}px</div>
                <div>H: {pxH}px</div>
              </div>
              <Button onClick={() => setBbox({ x: 20, y: 20, w: 40, h: 40 })} className="w-full mt-6" variant="ghost">
                Reset Coordinates
              </Button>
            </div>
          </div>
        </div>

        {/* Override Modal */}
        {showOverrideModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowOverrideModal(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-medium text-zinc-100">Override AI Prediction</h2>
                  <p className="text-zinc-500 text-sm mt-1">Select the correct reason for overriding.</p>
                </div>
                <button onClick={() => setShowOverrideModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setShowOverrideModal(false); setShowSpeciesModal(true); }}
                  className="w-full flex items-center p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all text-left group"
                >
                  <div className="bg-zinc-900 p-2 rounded-lg mr-4 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400">
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors">Select Correct Species</h3>
                    <p className="text-xs text-zinc-500 mt-1">Mark as 'Verified' with a new species.</p>
                  </div>
                </button>

                <button 
                  onClick={() => { setShowOverrideModal(false); handleConfirm(); }}
                  className="w-full flex items-center p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-red-500/50 transition-all text-left group"
                >
                  <div className="bg-zinc-900 p-2 rounded-lg mr-4 group-hover:bg-red-500/20 group-hover:text-red-400 text-zinc-400">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-medium group-hover:text-red-400 transition-colors">Mark as Unclear</h3>
                    <p className="text-xs text-zinc-500 mt-1">Image is blurry, heavily occluded, or unidentifiable.</p>
                  </div>
                </button>

                <button 
                  onClick={() => { setShowOverrideModal(false); handleConfirm(); }}
                  className="w-full flex items-center p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="bg-zinc-900 p-2 rounded-lg mr-4 group-hover:bg-blue-500/20 group-hover:text-blue-400 text-zinc-400">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-medium group-hover:text-blue-400 transition-colors">Suggest New Class</h3>
                    <p className="text-xs text-zinc-500 mt-1">Snake is identifiable but not in the database.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Species Selection Modal */}
        {showSpeciesModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowSpeciesModal(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-start mb-4 shrink-0">
                <div>
                  <h2 className="text-xl font-medium text-zinc-100">Select Correct Species</h2>
                  <p className="text-zinc-500 text-sm mt-1">Search or choose from the known database.</p>
                </div>
                <button onClick={() => setShowSpeciesModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search species name..." 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {SNAKE_DATA.filter(snake => 
                  snake.name_th.includes(searchQuery) || 
                  snake.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  snake.scientific.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(snake => (
                  <button 
                    key={snake.id}
                    onClick={() => { setShowSpeciesModal(false); handleConfirm(); }}
                    className="w-full text-left p-3 rounded-lg border border-zinc-800/50 bg-zinc-950/30 hover:bg-zinc-800 hover:border-emerald-500/50 transition-colors group"
                  >
                    <h3 className="text-zinc-200 font-medium text-sm group-hover:text-emerald-400">{snake.name_th} ({snake.name_en})</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{snake.scientific}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
