import Button from '@/components/ui/Button'
import { BrainCircuit } from 'lucide-react'

interface TrainingConfirmModalProps {
  isBalanced: boolean;
  message: string;
  onClose: () => void;
  onConfirm: (message: string) => void;
}

export default function TrainingConfirmModal({ isBalanced, message, onClose, onConfirm }: TrainingConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isBalanced ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <BrainCircuit size={24} />
        </div>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">
          {isBalanced ? 'Start Training Pipeline?' : 'Start Training with Auto-Balancing?'}
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          {isBalanced 
            ? 'This will initiate a new model training job on the GPU cluster using the balanced, verified dataset. The process may take several hours.'
            : 'The dataset is currently imbalanced. The system will automatically apply class-weight balancing during training. Proceed?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={() => onConfirm(message)} className={`${isBalanced ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'} text-white border-none`}>
            Confirm Training
          </Button>
        </div>
      </div>
    </div>
  )
}
