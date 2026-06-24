import { CheckSquare, Square } from 'lucide-react'

interface SelectBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}

export default function SelectBtn({
  active,
  onClick,
  children,
  color = 'emerald'
}: SelectBtnProps) {
  const colors: Record<string, string> = {
    emerald: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400',
    purple: 'border-purple-500/60 bg-purple-500/10 text-purple-400',
    amber: 'border-amber-500/60 bg-amber-500/10 text-amber-400',
    blue: 'border-blue-500/60 bg-blue-500/10 text-blue-400',
    red: 'border-red-500/60 bg-red-500/10 text-red-400',
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-150 cursor-pointer ${
        active
          ? colors[color]
          : 'border-transparent bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
      }`}
    >
      {active ? <CheckSquare size={13} /> : <Square size={13} />}
      {children}
    </button>
  )
}
