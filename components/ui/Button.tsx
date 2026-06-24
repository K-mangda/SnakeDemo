import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 border border-transparent',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  outline: 'bg-transparent text-zinc-100 border border-zinc-700 hover:bg-zinc-800',
  ghost:   'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent',
  danger:  'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ children, variant='primary', size='md', href, className='', disabled, ...props }: ButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200',
    variants[variant],
    sizes[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button disabled={disabled} className={cls} {...props}>{children}</button>
}
