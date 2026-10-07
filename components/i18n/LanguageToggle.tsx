'use client'

import { Languages } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage()
  const nextLocale = locale === 'th' ? 'en' : 'th'
  return (
    <button
      type="button"
      data-i18n-ignore
      onClick={() => setLocale(nextLocale)}
      className={compact ? 'inline-flex items-center justify-center rounded-md border border-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white' : 'inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white'}
      aria-label={locale === 'th' ? 'Change language to English' : 'เปลี่ยนภาษาเป็นไทย'}
      title={locale === 'th' ? 'English' : 'ไทย'}
    >
      <Languages size={14} aria-hidden="true" />
      <span>{locale === 'th' ? 'ไทย' : 'EN'}</span>
    </button>
  )
}
