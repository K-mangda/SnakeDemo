import { useState } from 'react'
import { MOCK_EXPERTS } from '@/lib/data'
import { Expert } from '@/lib/types'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ShieldCheck, Plus, Edit, Trash2 } from 'lucide-react'
import AddEditExpertModal from '@/components/admin/modals/AddEditExpertModal'
import DeleteExpertModal from '@/components/admin/modals/DeleteExpertModal'

export default function AuthorizedExperts() {
  const [experts, setExperts] = useState<Expert[]>(MOCK_EXPERTS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [newExpert, setNewExpert] = useState({ name: '', email: '', specialty: '' })
  const { showToast } = useToast()

  const handleAddExpert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpert.name || !newExpert.email || !newExpert.specialty) return

    if (editingId) {
      setExperts(experts.map(exp => exp.id === editingId ? { ...exp, ...newExpert } : exp))
      setEditingId(null)
      setNewExpert({ name: '', email: '', specialty: '' })
      setShowAddForm(false)
      showToast(`Expert account updated for ${newExpert.name}`)
    } else {
      const added: Expert = {
        id: Date.now(),
        name: newExpert.name,
        email: newExpert.email,
        specialty: newExpert.specialty,
        validated: 0,
        accuracy: 100,
        status: 'active',
        joined: new Date().toISOString()
      }
      setExperts([...experts, added])
      setNewExpert({ name: '', email: '', specialty: '' })
      setShowAddForm(false)
      showToast(`Account created and credentials emailed to ${added.email}`)
    }
  }

  const handleEditExpert = (exp: Expert) => {
    setNewExpert({ name: exp.name, email: exp.email, specialty: exp.specialty })
    setEditingId(exp.id)
    setShowAddForm(true)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setExperts(experts.filter(e => e.id !== deleteConfirmId))
      showToast('Expert account deleted')
      setDeleteConfirmId(null)
    }
  }

  return (
    <>
      {deleteConfirmId && (
        <DeleteExpertModal 
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showAddForm && (
        <AddEditExpertModal 
          editingId={editingId}
          newExpert={newExpert}
          setNewExpert={setNewExpert}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddExpert}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
          <ShieldCheck size={20} className="text-zinc-500" /> Authorized Experts
        </h2>
        <Button onClick={() => {
          setShowAddForm(true)
          setEditingId(null)
          setNewExpert({ name: '', email: '', specialty: '' })
        }} variant="ghost" className="flex items-center gap-2 text-zinc-300">
          <Plus size={16} /> Add Expert
        </Button>
      </div>
      
      <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-900/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
              <th className="p-4 font-medium">Expert Name</th>
              <th className="p-4 font-medium">Specialty</th>
              <th className="p-4 font-medium">Validated</th>
              <th className="p-4 font-medium">Accuracy</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {experts.map(exp => (
              <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-zinc-200">{exp.name}</p>
                  <p className="text-xs text-zinc-500">{exp.email}</p>
                </td>
                <td className="p-4 text-sm text-zinc-400">{exp.specialty}</td>
                <td className="p-4 font-mono text-sm text-zinc-300">{exp.validated.toLocaleString()}</td>
                <td className="p-4 font-mono text-sm text-zinc-300">{exp.accuracy}%</td>
                <td className="p-4 text-right">
                  <Button onClick={() => handleEditExpert(exp)} variant="ghost" size="sm" className="p-2 mr-2" title="Edit">
                    <Edit size={16} />
                  </Button>
                  <Button onClick={() => setDeleteConfirmId(exp.id)} variant="danger" size="sm" className="p-2" title="Delete">
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {experts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">No experts found. Add one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
