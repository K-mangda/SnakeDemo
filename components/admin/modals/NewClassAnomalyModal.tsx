import { ShieldCheck, X, Search, Users } from 'lucide-react'
import Button from '@/components/ui/Button'

interface NewClassAnomalyModalProps {
  anomalyItems: number[];
  onClose: () => void;
  onCreateClass: (id: number, specimenName: string) => void;
  onReassign: (id: number, specimenName: string) => void;
}

export default function NewClassAnomalyModal({
  anomalyItems,
  onClose,
  onCreateClass,
  onReassign
}: NewClassAnomalyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-500" />
            Investigate New Class Anomalies
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-2 pb-4 flex-1">
            <p className="text-sm text-zinc-400 mb-4">Experts have flagged these images as potential new species. Group similar images to create a new class.</p>
            <div className="space-y-4">
              {anomalyItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                  <p>All anomalies have been investigated.</p>
                </div>
              ) : anomalyItems.map(i => (
                <div key={i} className="flex gap-4 p-4 border border-zinc-800 bg-zinc-950/50 rounded-lg transition-all hover:border-zinc-700">
                  <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center shrink-0">
                      <Search size={24} className="text-blue-500/30" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-medium text-zinc-200 mb-1">Unknown Specimen #{204 + i}</h4>
                      <p className="text-xs text-zinc-500 mb-3 flex items-center gap-2"><Users size={12} /> Flagged by: Dr. Smith • High Confidence</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="text-xs py-1.5 h-auto" onClick={() => onCreateClass(i, `Unknown Specimen #${204 + i}`)}>
                          Create New Class
                        </Button>
                        <Button size="sm" variant="secondary" className="text-xs py-1.5 h-auto border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500" onClick={() => onReassign(i, `Unknown Specimen #${204 + i}`)}>
                          Reassign...
                        </Button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
        
      </div>
    </div>
  )
}
