import { useState } from 'react'
import { MOCK_STATS, SNAKE_DATA } from '@/lib/data'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Filter, AlertTriangle, ShieldCheck, Trash2, Search, RefreshCw, Plus, Edit, ChevronDown, Info, Activity, Map } from 'lucide-react'
import UnclearImagesModal from '@/components/admin/modals/UnclearImagesModal'
import NewClassAnomalyModal from '@/components/admin/modals/NewClassAnomalyModal'

export default function DataReview() {
  const [showUnclearModal, setShowUnclearModal] = useState(false)
  const [showNewClassModal, setShowNewClassModal] = useState(false)
  const [selectedUnclearIds, setSelectedUnclearIds] = useState<number[]>([])
  const [selectAllDatabase, setSelectAllDatabase] = useState(false)
  const [anomalyItems, setAnomalyItems] = useState([1, 2, 3])
  const [unclearActionConfirm, setUnclearActionConfirm] = useState<{ action: 'restore' | 'delete', count: number, isAll: boolean } | null>(null)
  
  const [anomalyAction, setAnomalyAction] = useState<{ type: 'create' | 'reassign', id: number, specimenName: string } | null>(null)
  const [anomalyInputValue, setAnomalyInputValue] = useState('')
  const [anomalyForm, setAnomalyForm] = useState({ 
    scientificName: '', nameEn: '', nameTh: '', venomType: 'Non-venomous',
    family: '', dangerLevel: 1, dangerLabel: 'ไม่อันตราย', habitat: '', distribution: '',
    description: '', symptoms: '', firstAid: '', antivenom: '', tags: ''
  })
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState('')
  const { showToast } = useToast()

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/20 p-6 mb-12 transition-all duration-300">
      
      {/* Unclear Action Confirmation Modal */}
      {unclearActionConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ zIndex: 60 }}>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${unclearActionConfirm.action === 'delete' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {unclearActionConfirm.action === 'delete' ? <Trash2 size={24} /> : <RefreshCw size={24} />}
            </div>
            <h3 className="text-lg font-medium text-zinc-100 mb-2">
              {unclearActionConfirm.action === 'delete' ? 'Delete Images?' : 'Restore Images?'}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              {unclearActionConfirm.action === 'delete' 
                ? `Are you sure you want to permanently delete ${unclearActionConfirm.isAll ? 'ALL ' + MOCK_STATS.unclear_images : unclearActionConfirm.count} unclear images? This cannot be undone.`
                : `Are you sure you want to restore ${unclearActionConfirm.isAll ? 'ALL ' + MOCK_STATS.unclear_images : unclearActionConfirm.count} images back to the main dataset pool?`}
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setUnclearActionConfirm(null)} variant="secondary">Cancel</Button>
              <Button onClick={() => {
                if (unclearActionConfirm.action === 'delete') {
                  showToast(unclearActionConfirm.isAll ? `Bulk purging all ${MOCK_STATS.unclear_images} unclear images on server...` : `Deleted ${unclearActionConfirm.count} selected images.`)
                } else {
                  showToast(unclearActionConfirm.isAll ? `Restored all ${MOCK_STATS.unclear_images} images back to dataset...` : `Restored ${unclearActionConfirm.count} selected images.`)
                }
                setUnclearActionConfirm(null)
                setShowUnclearModal(false)
                setSelectedUnclearIds([])
                setSelectAllDatabase(false)
              }} className={`${unclearActionConfirm.action === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white border-none`}>
                Confirm {unclearActionConfirm.action === 'delete' ? 'Delete' : 'Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anomaly Action Modal */}
      {anomalyAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ zIndex: 60 }}>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh]">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${anomalyAction.type === 'create' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
               {anomalyAction.type === 'create' ? <Plus size={24} /> : <Edit size={24} />}
            </div>
            <h3 className="text-lg font-medium text-zinc-100 mb-2">
              {anomalyAction.type === 'create' ? 'Create New Species Class' : 'Reassign Specimen'}
            </h3>
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-zinc-400">
                {anomalyAction.type === 'create' 
                  ? `Please fill in the complete biological profile for the new species.`
                  : `If this specimen isn't actually a new species, you can merge it into an existing class, or return it to the expert pool.`}
              </p>
              {anomalyAction.type === 'create' && (
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (!anomalyForm.scientificName) {
                      showToast('Please enter a Scientific Name first so AI can search.');
                      return;
                    }
                    setIsAutoFilling(true);
                    setTimeout(() => {
                      setAnomalyForm(prev => ({
                        ...prev,
                        nameEn: prev.nameEn || 'Generated English Name',
                        nameTh: prev.nameTh || 'งูสายพันธุ์ใหม่ (AI Generated)',
                        family: 'Viperidae',
                        dangerLevel: 4,
                        dangerLabel: 'อันตรายมาก',
                        venomType: 'hemotoxic',
                        habitat: 'ป่าดิบชื้น, พื้นที่เกษตรกรรม',
                        distribution: 'ภาคใต้, ภาคตะวันตก',
                        description: `A highly adaptable species generated based on ${prev.scientificName}. Features distinct triangular head and heat-sensing pits.`,
                        symptoms: 'ปวดบวมรุนแรง, เลือดออกตามไรฟัน, คลื่นไส้',
                        firstAid: 'ล้างแผลด้วยน้ำสะอาด, ดามแขนขาให้อยู่นิ่ง, รีบนำส่งโรงพยาบาลทันที',
                        antivenom: 'Polyvalent Pit Viper Antivenom',
                        tags: 'หายาก, หากินกลางคืน, พิษโลหิต'
                      }));
                      setIsAutoFilling(false);
                      showToast('AI Auto-fill completed!');
                    }, 1500);
                  }} 
                  className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 shrink-0 ml-4"
                  disabled={isAutoFilling}
                >
                  {isAutoFilling ? <RefreshCw size={14} className="mr-2 animate-spin" /> : <Activity size={14} className="mr-2" />}
                  Auto-fill with AI
                </Button>
              )}
            </div>

            {anomalyAction.type === 'create' ? (
              <div className="flex flex-col gap-4 mb-6 pr-2 overflow-y-auto custom-scrollbar max-h-[50vh]">
                
                {/* 1. Taxonomy & Names */}
                <div className="space-y-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <h4 className="text-xs font-medium text-zinc-300 uppercase tracking-widest flex items-center gap-2 mb-2"><Info size={14} className="text-blue-500"/> Taxonomy & Names</h4>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Scientific Name *</label>
                    <input autoFocus placeholder="e.g. Trimeresurus albolabris" value={anomalyForm.scientificName} onChange={e => setAnomalyForm({...anomalyForm, scientificName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500/50 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">English Name</label>
                      <input placeholder="e.g. White-lipped Pit Viper" value={anomalyForm.nameEn} onChange={e => setAnomalyForm({...anomalyForm, nameEn: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Thai Name</label>
                      <input placeholder="e.g. งูเขียวหางไหม้ท้องเหลือง" value={anomalyForm.nameTh} onChange={e => setAnomalyForm({...anomalyForm, nameTh: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Family</label>
                    <input placeholder="e.g. Viperidae" value={anomalyForm.family} onChange={e => setAnomalyForm({...anomalyForm, family: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500/50 text-sm" />
                  </div>
                </div>

                {/* 2. Medical & Venom */}
                <div className="space-y-3 p-4 bg-red-950/10 rounded-xl border border-red-900/20">
                  <h4 className="text-xs font-medium text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Activity size={14}/> Medical & Venom</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Venom Type</label>
                      <select value={anomalyForm.venomType} onChange={e => setAnomalyForm({...anomalyForm, venomType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm">
                        <option value="Non-venomous">Non-venomous (ไม่มีพิษ)</option>
                        <option value="neurotoxic">Neurotoxic (พิษต่อประสาท)</option>
                        <option value="hemotoxic">Hemotoxic (พิษต่อเลือด)</option>
                        <option value="cytotoxic">Cytotoxic (พิษทำลายเซลล์)</option>
                        <option value="Unknown">Unknown (ยังไม่ทราบ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Danger Level (1-5)</label>
                      <div className="flex gap-2">
                        <input type="number" min="1" max="5" value={anomalyForm.dangerLevel} onChange={e => setAnomalyForm({...anomalyForm, dangerLevel: parseInt(e.target.value) || 1})} className="w-16 bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm" />
                        <input placeholder="Label e.g. อันตรายมาก" value={anomalyForm.dangerLabel} onChange={e => setAnomalyForm({...anomalyForm, dangerLabel: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Clinical Symptoms (comma separated)</label>
                    <input placeholder="e.g. ปวดบวม, เลือดออก, คลื่นไส้" value={anomalyForm.symptoms} onChange={e => setAnomalyForm({...anomalyForm, symptoms: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">First Aid (comma separated)</label>
                    <input placeholder="e.g. ล้างแผล, ดามแขนขา, รีบส่ง รพ." value={anomalyForm.firstAid} onChange={e => setAnomalyForm({...anomalyForm, firstAid: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Required Antivenom</label>
                    <input placeholder="e.g. Green Pit Viper Antivenom" value={anomalyForm.antivenom} onChange={e => setAnomalyForm({...anomalyForm, antivenom: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-red-500/50 text-sm" />
                  </div>
                </div>

                {/* 3. Ecology & Description */}
                <div className="space-y-3 p-4 bg-emerald-950/10 rounded-xl border border-emerald-900/20">
                  <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Map size={14}/> Ecology & Characteristics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Habitat</label>
                      <input placeholder="e.g. ป่าดิบชื้น, สวนยาง" value={anomalyForm.habitat} onChange={e => setAnomalyForm({...anomalyForm, habitat: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-emerald-500/50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Distribution</label>
                      <input placeholder="e.g. ทั่วประเทศ" value={anomalyForm.distribution} onChange={e => setAnomalyForm({...anomalyForm, distribution: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-emerald-500/50 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Physical Description</label>
                    <textarea placeholder="Describe the snake's appearance..." rows={2} value={anomalyForm.description} onChange={e => setAnomalyForm({...anomalyForm, description: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-emerald-500/50 text-sm resize-none custom-scrollbar" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                    <input placeholder="e.g. กลางคืน, อันตราย, สีเขียว" value={anomalyForm.tags} onChange={e => setAnomalyForm({...anomalyForm, tags: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-emerald-500/50 text-sm" />
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-6">
                 {/* Option 1: Merge */}
                 <label className={`p-4 rounded-xl border flex gap-4 cursor-pointer transition-colors ${anomalyInputValue !== 'pool' ? 'bg-zinc-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'}`} onClick={(e) => { if (anomalyInputValue === 'pool') setAnomalyInputValue('') }}>
                    <div className="flex items-start pt-1">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${anomalyInputValue !== 'pool' ? 'border-purple-500' : 'border-zinc-600'}`}>
                         {anomalyInputValue !== 'pool' && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
                      </div>
                    </div>
                    <div className="flex-1">
                       <span className={`block text-sm font-medium mb-1 ${anomalyInputValue !== 'pool' ? 'text-purple-400' : 'text-zinc-300'}`}>Merge into Existing Class</span>
                       <span className="block text-xs text-zinc-500 mb-3">Map this specimen to a known species in the database.</span>
                       <div className="relative mt-3">
                         <div 
                           className={`w-full bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-sm flex justify-between items-center transition-colors ${anomalyInputValue === 'pool' ? 'opacity-50 cursor-not-allowed text-zinc-500' : 'cursor-pointer text-zinc-100 hover:border-purple-500/50'}`}
                           onClick={() => { if (anomalyInputValue !== 'pool') setDropdownOpen(!dropdownOpen) }}
                         >
                           <span className="truncate">
                             {anomalyInputValue === 'pool' || !anomalyInputValue 
                               ? 'Select an existing species...' 
                               : `${anomalyInputValue} (${SNAKE_DATA.find(s => s.scientific === anomalyInputValue)?.name_th || ''})`}
                           </span>
                           <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                         </div>
                         
                         {dropdownOpen && anomalyInputValue !== 'pool' && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                             <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-950/50">
                                <Search size={16} className="text-zinc-500" />
                                <input 
                                  autoFocus
                                  className="bg-transparent w-full text-sm outline-none text-zinc-100" 
                                  placeholder="Search by scientific or Thai name..."
                                  value={dropdownSearch}
                                  onChange={e => setDropdownSearch(e.target.value)}
                                />
                             </div>
                             <div className="max-h-48 overflow-y-auto custom-scrollbar">
                               {SNAKE_DATA.filter(s => 
                                 s.scientific.toLowerCase().includes(dropdownSearch.toLowerCase()) || 
                                 s.name_th.includes(dropdownSearch)
                               ).map(s => (
                                 <div 
                                   key={s.id}
                                   className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer text-sm border-b border-zinc-800/50 last:border-0 transition-colors"
                                   onClick={() => {
                                     setAnomalyInputValue(s.scientific);
                                     setDropdownOpen(false);
                                     setDropdownSearch('');
                                   }}
                                 >
                                   <div className="font-medium text-zinc-200">{s.scientific}</div>
                                   <div className="text-xs text-zinc-500 mt-0.5">{s.name_th}</div>
                                 </div>
                               ))}
                               {SNAKE_DATA.filter(s => s.scientific.toLowerCase().includes(dropdownSearch.toLowerCase()) || s.name_th.includes(dropdownSearch)).length === 0 && (
                                 <div className="px-4 py-4 text-center text-sm text-zinc-500">No matching species found.</div>
                               )}
                             </div>
                           </div>
                         )}
                       </div>
                    </div>
                 </label>

                 {/* Option 2: Pool */}
                 <label className={`p-4 rounded-xl border flex gap-4 cursor-pointer transition-colors ${anomalyInputValue === 'pool' ? 'bg-purple-900/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'}`} onClick={() => setAnomalyInputValue('pool')}>
                    <div className="flex items-start pt-1">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${anomalyInputValue === 'pool' ? 'border-purple-500' : 'border-zinc-600'}`}>
                         {anomalyInputValue === 'pool' && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
                      </div>
                    </div>
                    <div>
                       <span className={`block text-sm font-medium mb-1 ${anomalyInputValue === 'pool' ? 'text-purple-400' : 'text-zinc-300'}`}>Return to Expert Pool</span>
                       <span className="block text-xs text-zinc-500">Send this specimen back for re-evaluation by multiple experts.</span>
                    </div>
                 </label>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800 shrink-0">
              <Button onClick={() => setAnomalyAction(null)} variant="secondary">Cancel</Button>
              <Button onClick={() => {
                if (anomalyAction.type === 'create') {
                  if (!anomalyForm.scientificName.trim()) {
                    showToast('Scientific Name is required!');
                    return;
                  }
                  showToast(`Created new class: "${anomalyForm.scientificName}". Specimen reassigned.`)
                } else {
                  if (!anomalyInputValue) {
                    showToast('Please select an action or species first.');
                    return;
                  }
                  if (anomalyInputValue === 'pool') {
                    showToast(`Returned ${anomalyAction.specimenName} to validation pool.`);
                  } else {
                    showToast(`Reassigned to existing class: "${anomalyInputValue}"`);
                  }
                }
                setAnomalyItems(prev => prev.filter(x => x !== anomalyAction.id))
                setAnomalyAction(null)
                // Reset form
                setAnomalyForm({ 
                  scientificName: '', nameEn: '', nameTh: '', venomType: 'Non-venomous',
                  family: '', dangerLevel: 1, dangerLabel: 'ไม่อันตราย', habitat: '', distribution: '',
                  description: '', symptoms: '', firstAid: '', antivenom: '', tags: ''
                })
                setAnomalyInputValue('')
              }} className={`${anomalyAction.type === 'create' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white border-none`}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unclear Images Modal */}
      {showUnclearModal && (
        <UnclearImagesModal 
          selectedUnclearIds={selectedUnclearIds}
          selectAllDatabase={selectAllDatabase}
          onSelectToggle={(i) => {
            if (selectedUnclearIds.includes(i)) {
              setSelectedUnclearIds(selectedUnclearIds.filter(id => id !== i))
              setSelectAllDatabase(false)
            } else {
              setSelectedUnclearIds([...selectedUnclearIds, i])
            }
          }}
          onSelectAllToggle={(checked) => {
            if (checked) {
              setSelectedUnclearIds(Array.from({ length: 12 }, (_, i) => i))
              setSelectAllDatabase(true)
            } else {
              setSelectedUnclearIds([])
              setSelectAllDatabase(false)
            }
          }}
          onClearSelection={() => {
            setSelectedUnclearIds([])
            setSelectAllDatabase(false)
          }}
          onRestore={() => setUnclearActionConfirm({ action: 'restore', count: selectedUnclearIds.length, isAll: selectAllDatabase })}
          onDelete={() => setUnclearActionConfirm({ action: 'delete', count: selectedUnclearIds.length, isAll: selectAllDatabase })}
          onClose={() => setShowUnclearModal(false)}
        />
      )}

      {/* New Class Modal */}
      {showNewClassModal && (
        <NewClassAnomalyModal 
          anomalyItems={anomalyItems}
          onClose={() => setShowNewClassModal(false)}
          onCreateClass={(id, specimenName) => {
            setAnomalyAction({ type: 'create', id, specimenName })
            setAnomalyForm({ 
              scientificName: '', nameEn: '', nameTh: '', venomType: 'Non-venomous',
              family: '', dangerLevel: 1, dangerLabel: 'ไม่อันตราย', habitat: '', distribution: '',
              description: '', symptoms: '', firstAid: '', antivenom: '', tags: ''
            })
          }}
          onReassign={(id, specimenName) => {
            setAnomalyAction({ type: 'reassign', id, specimenName })
            setAnomalyInputValue('')
            setDropdownOpen(false)
            setDropdownSearch('')
          }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <Filter size={20} className="text-red-500" /> Data Review & Purge
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Box 1: Unclear */}
        <div className="relative overflow-hidden border border-red-900/30 bg-gradient-to-br from-red-950/20 to-zinc-950/50 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:border-red-500/30 hover:bg-zinc-900/80 group">
          <AlertTriangle size={140} className="absolute -right-8 -bottom-8 text-red-500/5 group-hover:text-red-500/10 transition-colors duration-500 -rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-base font-medium text-zinc-100 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-500" /> Unclear Images
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Images flagged as blurry, ambiguous, or unrecognizable. Review to clean up the dataset and save storage space.
            </p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold text-red-400">{MOCK_STATS.unclear_images}</span>
              <span className="text-sm text-zinc-500">pending review</span>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <Button variant="secondary" className="flex-1 justify-center border-red-500/30 text-red-400 bg-red-500/5 hover:border-red-500 hover:bg-red-500/20 hover:text-red-300 shadow-sm transition-all" onClick={() => setShowUnclearModal(true)}>
              <Trash2 size={16} /> Review & Purge
            </Button>
          </div>
        </div>

        {/* Box 2: New Class */}
        <div className="relative overflow-hidden border border-blue-900/30 bg-gradient-to-br from-blue-950/20 to-zinc-950/50 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:border-blue-500/30 hover:bg-zinc-900/80 group">
          <ShieldCheck size={140} className="absolute -right-8 -bottom-8 text-blue-500/5 group-hover:text-blue-500/10 transition-colors duration-500 rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-base font-medium text-zinc-100 flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-blue-500" /> New Class Anomalies
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Images flagged as potential new species or morphs. Expert investigation required to create new classification categories.
            </p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold text-blue-400">{MOCK_STATS.waiting_for_new_class_images}</span>
              <span className="text-sm text-zinc-500">awaiting inspection</span>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <Button variant="secondary" className="flex-1 justify-center border-blue-500/30 text-blue-400 bg-blue-500/5 hover:border-blue-500 hover:bg-blue-500/20 hover:text-blue-300 shadow-sm transition-all" onClick={() => setShowNewClassModal(true)}>
              <Search size={16} /> Investigate
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
