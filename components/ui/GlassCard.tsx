import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export default function GlassCard({ children, className, onClick, hover = false }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-xl',
        hover && 'transition-colors duration-200 hover:bg-zinc-800/50 hover:border-zinc-700',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
