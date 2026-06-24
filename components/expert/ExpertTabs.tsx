import { User, ArrowUpDown, LayoutGrid, List } from 'lucide-react'

export type FilterStatus = 'all' | 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class' | 'my_queue'
export type ViewMode = 'grid' | 'list'
export type SortMode = 'date' | 'confidence_asc' | 'confidence_desc'

export const TAB_CONFIG: { key: FilterStatus; label: string; underline: string; icon?: React.ReactNode }[] = [
  { key: 'my_queue',              label: 'My Queue',            underline: 'bg-violet-500', icon: <User size={13} /> },
  { key: 'all',                   label: 'All',                 underline: 'bg-zinc-300' },
  { key: 'pending',               label: 'Pending',             underline: 'bg-amber-500' },
  { key: 'verified',              label: 'Verified',            underline: 'bg-emerald-500' },
  { key: 'unclear',               label: 'Unclear',             underline: 'bg-red-500' },
  { key: 'waiting_for_new_class', label: 'Waiting for New Class', underline: 'bg-blue-500' },
]

interface ExpertTabsProps {
  currentFilter: FilterStatus;
  setCurrentFilter: (f: FilterStatus) => void;
  counts: Record<FilterStatus, number>;
  sortMode: SortMode;
  setSortMode: (s: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}

export default function ExpertTabs({
  currentFilter,
  setCurrentFilter,
  counts,
  sortMode,
  setSortMode,
  viewMode,
  setViewMode
}: ExpertTabsProps) {
  return (
    <div className="flex items-end justify-between border-b border-zinc-800 mb-8 gap-4">
      {/* Tabs (scrollable on small screens) */}
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-none flex-1 min-w-0">
        {TAB_CONFIG.map(tab => {
          const active = currentFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setCurrentFilter(tab.key)}
              className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-1.5 whitespace-nowrap shrink-0
                ${active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono
                ${active ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800/50 text-zinc-400'}`}>
                {counts[tab.key]}
              </span>
              {active && <div className={`absolute bottom-[-1px] left-0 right-0 h-[2px] ${tab.underline}`} />}
            </button>
          )
        })}
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-2 pb-4 shrink-0">
        {/* Sort dropdown */}
        <div className="relative flex items-center">
          <ArrowUpDown size={13} className="absolute left-2.5 text-zinc-500 pointer-events-none" />
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="pl-7 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300
                       rounded-lg focus:outline-none focus:border-zinc-600 cursor-pointer appearance-none"
          >
            <option value="date">Date added</option>
            <option value="confidence_asc">Confidence: Low → High</option>
            <option value="confidence_desc">Confidence: High → Low</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <button
            title="Grid view"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 transition-colors
              ${viewMode === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            title="List view"
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors
              ${viewMode === 'list' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
