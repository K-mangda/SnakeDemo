import { AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { MOCK_STATS } from '@/lib/data'

interface UnclearImagesModalProps {
  selectedUnclearIds: number[];
  selectAllDatabase: boolean;
  onSelectToggle: (id: number) => void;
  onSelectAllToggle: (checked: boolean) => void;
  onClearSelection: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function UnclearImagesModal({
  selectedUnclearIds,
  selectAllDatabase,
  onSelectToggle,
  onSelectAllToggle,
  onClearSelection,
  onRestore,
  onDelete,
  onClose
}: UnclearImagesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Review Unclear Images
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-2 pb-4 flex-1">
          <div className="flex justify-between items-end mb-4">
            <p className="text-sm text-zinc-400">These images were flagged as low quality. Select them to either <strong className="text-red-400 font-medium">permanently delete</strong> them, or <strong className="text-emerald-400 font-medium">restore</strong> them to the dataset.</p>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors shrink-0 whitespace-nowrap">
              <input type="checkbox" checked={selectedUnclearIds.length === 12} onChange={(e) => onSelectAllToggle(e.target.checked)} className="appearance-none w-4 h-4 border border-zinc-600 rounded bg-zinc-800/50 checked:bg-zinc-200 checked:border-zinc-200 cursor-pointer relative after:content-[''] checked:after:block after:hidden after:w-1.5 after:h-2 after:border-r-2 after:border-b-2 after:border-zinc-900 after:rotate-45 after:absolute after:top-[1px] after:left-[5px] transition-all" />
              Select All
            </label>
          </div>

          {selectedUnclearIds.length === 12 && selectAllDatabase && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-2 px-4 rounded-lg mb-4 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span>All <strong>{MOCK_STATS.unclear_images}</strong> images in Unclear are selected.</span>
              <button onClick={onClearSelection} className="text-red-300 font-medium hover:underline ml-1">Clear selection</button>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} onClick={() => onSelectToggle(i)} className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-colors ${selectedUnclearIds.includes(i) ? 'bg-red-500/5 border-red-500/50' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                  <input type="checkbox" checked={selectedUnclearIds.includes(i)} readOnly className="appearance-none w-5 h-5 border border-zinc-600/80 rounded bg-zinc-900/80 checked:bg-red-500 checked:border-red-500 cursor-pointer relative after:content-[''] checked:after:block after:hidden after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:absolute after:top-[2px] after:left-[6px] transition-all" />
                </div>
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <AlertTriangle size={24} className="opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800 shrink-0 mt-2">
          <span className="text-sm text-zinc-400">
            {selectAllDatabase 
              ? <span className="text-red-400 font-medium">{MOCK_STATS.unclear_images} images selected (All)</span> 
              : `${selectedUnclearIds.length} images selected`}
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" disabled={selectedUnclearIds.length === 0 && !selectAllDatabase} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-emerald-500/30" onClick={onRestore}>
              <RefreshCw size={16} className="mr-2 inline-block" /> Restore
            </Button>
            <Button variant="danger" disabled={selectedUnclearIds.length === 0 && !selectAllDatabase} onClick={onDelete}>
              <Trash2 size={16} className="mr-2 inline-block" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
