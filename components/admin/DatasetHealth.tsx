import { useState, useMemo } from 'react'
import { MOCK_STATS, SNAKE_DATA } from '@/lib/data'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { BrainCircuit, AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react'
import TrainingConfirmModal from '@/components/admin/modals/TrainingConfirmModal'

export default function DatasetHealth() {
  const [isTraining, setIsTraining] = useState(false)
  const [trainingConfirm, setTrainingConfirm] = useState<{ isBalanced: boolean, message: string } | null>(null)
  const [updateTargetConfirm, setUpdateTargetConfirm] = useState(false)
  const [autoTrainSettings, setAutoTrainSettings] = useState({
    minValidated: MOCK_STATS.auto_train.min_validated
  })
  const { showToast } = useToast()

  const allSpeciesData = useMemo(() => {
    const baseData = SNAKE_DATA.map((snake, i) => ({
      name: snake.name_en,
      count: MOCK_STATS.species_distribution[i]
    }));
    const mock100 = Array.from({ length: 100 }).map((_, i) => ({
      name: `Rare Unknown Snake ${i + 1}`,
      count: ((i * 137) % 800) + 50
    }));
    return [...baseData, ...mock100];
  }, [])

  const handleStartTraining = (message: string) => {
    if (isTraining) return;
    setIsTraining(true);
    showToast(message);
    setTimeout(() => {
      setIsTraining(false);
      showToast('Training completed! New model (v2.4.2) deployed automatically.');
    }, 8000);
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/20 p-6 mb-12 transition-all duration-300">
      {trainingConfirm && (
        <TrainingConfirmModal 
          isBalanced={trainingConfirm.isBalanced}
          message={trainingConfirm.message}
          onClose={() => setTrainingConfirm(null)}
          onConfirm={(msg) => {
            handleStartTraining(msg)
            setTrainingConfirm(null)
          }}
        />
      )}

      {updateTargetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">Update Dataset Target?</h3>
            <p className="text-sm text-zinc-400 mb-6">Changing the minimum image target will affect the dataset health assessment and class-balancing logic during training.</p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setUpdateTargetConfirm(false)} variant="secondary">Cancel</Button>
              <Button onClick={() => {
                showToast('Target configuration updated')
                setUpdateTargetConfirm(false)
              }} className="bg-blue-600 hover:bg-blue-500 text-white border-none">Update Target</Button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-medium text-zinc-100 mb-6 flex items-center gap-2">
        <BrainCircuit size={20} className="text-purple-500" /> Dataset Health & Export Readiness
      </h2>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Minimum Images per Species Target</label>
          <div className="flex gap-3">
            <input 
              type="number" 
              value={autoTrainSettings.minValidated}
              onChange={e => setAutoTrainSettings({ ...autoTrainSettings, minValidated: parseInt(e.target.value) || 0 })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 px-4 py-2 rounded-lg outline-none focus:border-emerald-500/50 w-48 font-mono"
            />
            <Button onClick={() => setUpdateTargetConfirm(true)} variant="secondary">Update Target</Button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Setting a minimum threshold helps identify data imbalance. Training with too few images for certain species leads to biased AI.
          </p>
        </div>
        
        <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-zinc-300">Ready Species (Target Met)</span>
            <span className="text-xs text-zinc-500 font-mono">
              {allSpeciesData.filter(s => s.count >= autoTrainSettings.minValidated).length} / {allSpeciesData.length}
            </span>
          </div>
          <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
              style={{ width: `${Math.min(100, (allSpeciesData.filter(s => s.count >= autoTrainSettings.minValidated).length / allSpeciesData.length) * 100)}%` }}
            ></div>
          </div>
          
          {allSpeciesData.filter(s => s.count < autoTrainSettings.minValidated).length > 0 ? (() => {
            const lacking = allSpeciesData.filter(s => s.count < autoTrainSettings.minValidated).sort((a,b) => a.count - b.count);
            return (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-800/50">
              <div className="text-xs text-amber-500 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="mb-1">
                    <strong>Imbalance Warning:</strong> {lacking.length} species have fewer than {autoTrainSettings.minValidated} images. Training directly may cause bias.
                  </p>
                  <p className="text-amber-500/70 mb-2">
                    Lowest counts: {lacking.slice(0, 3).map(s => `${s.name} (${s.count})`).join(', ')}
                    {lacking.length > 3 ? ` ...` : ''}
                  </p>
                  
                  {lacking.length > 3 && (
                    <details className="group">
                      <summary className="text-amber-500/80 cursor-pointer list-none hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-medium select-none">
                        <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                        View all {lacking.length} lacking species
                      </summary>
                      <div className="mt-2 p-3 bg-zinc-950/80 rounded-lg border border-amber-900/30 max-h-40 overflow-y-auto custom-scrollbar">
                        <ul className="space-y-1.5 text-amber-500/80">
                          {lacking.map(s => (
                            <li key={s.name} className="flex justify-between items-center border-b border-zinc-800/50 pb-1.5 last:border-0 last:pb-0">
                              <span>{s.name}</span>
                              <span className="font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded text-[10px]">{s.count} / {autoTrainSettings.minValidated}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => setTrainingConfirm({ isBalanced: false, message: 'Triggered training with class-weight balancing...' })} 
                variant="secondary" 
                size="sm" 
                className="w-full justify-center"
                disabled={isTraining}
              >
                {isTraining ? 'Training in Progress...' : 'Start Training (Apply Auto-Balancing)'}
              </Button>
            </div>
          )})() : (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-800/50">
              <div className="text-xs text-emerald-500 flex items-start gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Dataset is Balanced!</strong> All tracked species meet the minimum requirement. The dataset is healthy.
                </p>
              </div>
              <Button 
                onClick={() => setTrainingConfirm({ isBalanced: true, message: 'Starting training pipeline on server...' })} 
                size="sm" 
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isTraining}
              >
                {isTraining ? 'Training in Progress...' : 'Start Training Pipeline'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
