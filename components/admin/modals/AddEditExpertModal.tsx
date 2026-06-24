import Button from '@/components/ui/Button'
import { ShieldCheck, X } from 'lucide-react'

interface ExpertFormData {
  name: string;
  email: string;
  specialty: string;
}

interface AddEditExpertModalProps {
  editingId: number | null;
  newExpert: ExpertFormData;
  setNewExpert: (data: ExpertFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddEditExpertModal({
  editingId,
  newExpert,
  setNewExpert,
  onClose,
  onSubmit
}: AddEditExpertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            {editingId ? 'Edit Expert Account' : 'Add New Expert'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Full Name</label>
            <input required value={newExpert.name} onChange={e => setNewExpert({...newExpert, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500/50 transition-colors" placeholder="Dr. John Doe" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Email Address</label>
            <input required type="email" value={newExpert.email} onChange={e => setNewExpert({...newExpert, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500/50 transition-colors" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Specialty</label>
            <input required value={newExpert.specialty} onChange={e => setNewExpert({...newExpert, specialty: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500/50 transition-colors" placeholder="e.g. Herpetology" />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Account'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
