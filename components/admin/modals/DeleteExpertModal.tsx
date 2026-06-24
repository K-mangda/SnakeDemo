import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface DeleteExpertModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteExpertModal({ onClose, onConfirm }: DeleteExpertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">Delete Expert Account?</h3>
        <p className="text-sm text-zinc-400 mb-6">Are you sure you want to remove this expert? They will lose access to the validation workspace. This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={onConfirm} variant="danger">Delete Account</Button>
        </div>
      </div>
    </div>
  )
}
