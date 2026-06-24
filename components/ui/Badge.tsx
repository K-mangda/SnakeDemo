import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'muted' | 'destructive' | 'default'
  className?: string
}

const variantMap = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/30',
  destructive: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  info:    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  purple:  'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  default: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  muted:   'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50',
}

export default function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span className={cn(`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium ${variantMap[variant] || variantMap.muted}`, className)}>
      {children}
    </span>
  )
}
