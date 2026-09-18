'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string | number; label: string }

type SelectMenuProps = {
  value: string | number
  options: SelectOption[]
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
  buttonClassName?: string
  menuClassName?: string
  leading?: ReactNode
}

export default function SelectMenu({ value, options, onChange, ariaLabel, className = '', buttonClassName = '', menuClassName = '', leading }: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => String(option.value) === String(value)) ?? options[0]

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  return <div ref={rootRef} className={`relative ${className}`}>
    <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }} className={`flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 focus:outline-none focus:border-zinc-600 ${buttonClassName}`}>
      {leading}
      <span className="truncate">{selected?.label}</span>
      <ChevronDown size={14} className={`shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div role="listbox" className={`absolute right-0 z-30 mt-2 min-w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-2xl shadow-black/50 ${menuClassName}`}>
      {options.map((option) => {
        const active = String(option.value) === String(value)
        return <button key={String(option.value)} type="button" role="option" aria-selected={active} onClick={() => { onChange(String(option.value)); setOpen(false) }} className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-xs transition-colors ${active ? 'bg-emerald-500/15 text-emerald-300' : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}`}><span>{option.label}</span>{active && <Check size={14} className="shrink-0" />}</button>
      })}
    </div>}
  </div>
}
