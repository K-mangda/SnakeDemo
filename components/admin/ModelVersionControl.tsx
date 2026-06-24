import { useState } from 'react'
import { ACTIVE_MODEL, ARCHIVED_MODELS } from '@/lib/data'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Activity, Info } from 'lucide-react'
import RollbackConfirmModal from '@/components/admin/modals/RollbackConfirmModal'

export default function ModelVersionControl() {
  const [activeModel, setActiveModel] = useState(ACTIVE_MODEL)
  const [archivedModels, setArchivedModels] = useState(ARCHIVED_MODELS)
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null)
  const [rollbackConfirm, setRollbackConfirm] = useState<typeof activeModel | null>(null)
  const { showToast } = useToast()

  const handleRollback = (modelToRollback: typeof activeModel) => {
    if (isRollingBack) return;
    setIsRollingBack(modelToRollback.version);
    showToast(`Rolling back to ${modelToRollback.version}...`);
    
    setTimeout(() => {
      // old active becomes archived, swap it out
      const newArchived = [...archivedModels.filter(m => m.version !== modelToRollback.version), activeModel]
        .sort((a, b) => b.version.localeCompare(a.version)) // sort desc
      
      setArchivedModels(newArchived);
      setActiveModel(modelToRollback);
      setIsRollingBack(null);
      showToast(`Successfully rolled back to ${modelToRollback.version}`);
    }, 2000);
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/20 p-6 mb-12 transition-all duration-300">
      {rollbackConfirm && (
        <RollbackConfirmModal 
          version={rollbackConfirm.version}
          onClose={() => setRollbackConfirm(null)}
          onConfirm={() => {
            handleRollback(rollbackConfirm)
            setRollbackConfirm(null)
          }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" /> Model Deployment & Version Control
        </h2>
      </div>
      
      <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/50 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800/50">
            <tr>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Deployed Date</th>
              <th className="px-4 py-3 font-medium">Lab Accuracy</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            <tr className="bg-blue-900/10">
              <td className="px-4 py-3 text-zinc-100 font-medium">
                {activeModel.version}
              </td>
              <td className="px-4 py-3">{activeModel.date}</td>
              <td className="px-4 py-3 text-emerald-400">{activeModel.accuracy}%</td>
              <td className="px-4 py-3 text-right">
                <Badge variant="success" className="inline-flex">Active Serving</Badge>
              </td>
            </tr>
            {archivedModels.map(model => (
              <tr key={model.version}>
                <td className="px-4 py-3 text-zinc-100 font-medium">{model.version}</td>
                <td className="px-4 py-3">{model.date}</td>
                <td className="px-4 py-3">{model.accuracy}%</td>
                <td className="px-4 py-3 text-right">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setRollbackConfirm(model)} 
                    className="text-xs"
                    disabled={isRollingBack !== null}
                  >
                    {isRollingBack === model.version ? 'Rolling back...' : 'Rollback'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
        <Info size={14} className="shrink-0" /> Rollback allows you to quickly revert to a previous stable model if the newly deployed model underperforms in the real world.
      </p>
    </div>
  )
}
