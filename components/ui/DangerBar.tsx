interface DangerBarProps { level: number }

export default function DangerBar({ level }: DangerBarProps) {
  const getColor = (pip: number) => {
    if (pip > level) return 'bg-zinc-800'
    if (level >= 5) return 'bg-red-500'
    if (level >= 4) return 'bg-orange-500'
    if (level >= 3) return 'bg-amber-500'
    return 'bg-emerald-500'
  }
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(pip => (
        <div key={pip} className={`h-1.5 w-8 rounded-sm ${getColor(pip)}`} />
      ))}
    </div>
  )
}
