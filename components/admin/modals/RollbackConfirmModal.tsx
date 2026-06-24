import Button from '@/components/ui/Button'
import { RefreshCw } from 'lucide-react'

interface RollbackConfirmModalProps {
  version: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RollbackConfirmModal({ version, onClose, onConfirm }: RollbackConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
          <RefreshCw size={24} />
        </div>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">Rollback to {version}?</h3>
        <p className="text-sm text-zinc-400 mb-6">Are you sure you want to rollback to this previous model version? This will immediately replace the active serving model and may affect live predictions.</p>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-500 text-white border-none">Confirm Rollback</Button>
        </div>
      </div>
    </div>
  )
}
