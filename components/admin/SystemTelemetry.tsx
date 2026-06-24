import { useMemo } from 'react'
import { MOCK_STATS, SNAKE_DATA } from '@/lib/data'
import { Activity, BrainCircuit } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

export default function SystemTelemetry() {
  const activityData = useMemo(() => MOCK_STATS.daily_uploads.map((count, i) => ({
    day: `Day ${i + 1}`,
    uploads: count
  })), [])

  const accuracyData = useMemo(() => MOCK_STATS.weekly_accuracy.map((acc, i) => ({
    week: `Week ${i + 1}`,
    accuracy: acc
  })), [])

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

  const speciesData = useMemo(() => [...allSpeciesData].sort((a, b) => b.count - a.count).slice(0, 5), [allSpeciesData])

  const statusData = useMemo(() => [
    { name: 'Verified', value: MOCK_STATS.validated_images, color: '#10b981' },
    { name: 'Pending', value: MOCK_STATS.pending_images, color: '#f59e0b' },
    { name: 'Unclear', value: MOCK_STATS.unclear_images, color: '#ef4444' },
    { name: 'New Class', value: MOCK_STATS.waiting_for_new_class_images, color: '#3b82f6' }
  ], [])

  return (
    <>
      {/* Chart Row 1 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl transition-all duration-300">
          <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500"/> System Activity (14 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="uploads" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl transition-all duration-300">
          <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
            <BrainCircuit size={16} className="text-purple-500"/> Model Accuracy Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="week" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#18181b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl md:col-span-2 transition-all duration-300">
          <h3 className="text-sm font-medium text-zinc-300 mb-6">Top Species Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speciesData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <RechartsTooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-xl flex flex-col transition-all duration-300">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Dataset Status</h3>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-mono text-zinc-100">{MOCK_STATS.total_images.toLocaleString()}</span>
              <span className="text-xs text-zinc-500">Total Images</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 mx-auto w-fit">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.name === 'Unclear' ? '#ef4444' : d.name === 'New Class' ? '#3b82f6' : d.color }}></div> {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
