'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppLocale, translate } from '@/lib/i18n'

type LanguageContextValue = { locale: AppLocale; setLocale: (locale: AppLocale) => void; t: (text: string) => string }
const LanguageContext = createContext<LanguageContextValue | null>(null)
const storageKey = 'nstru-vision-locale'

function isTranslatableText(node: Text) {
  const parent = node.parentElement
  return Boolean(parent && !parent.closest('[data-i18n-ignore]') && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) && node.nodeValue?.trim())
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('th')
  const [domReady, setDomReady] = useState(false)
  const sourceText = useRef(new WeakMap<Text, string>())
  const sourceAttributes = useRef(new WeakMap<Element, Map<string, string>>())

  const applyLocale = useCallback((nextLocale: AppLocale, root: Node = document.body) => {
    const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : root instanceof Document ? Array.from(root.querySelectorAll('*')) : []
    for (const element of elements) {
      if (element.closest('[data-i18n-ignore]')) continue
      const attributes = ['placeholder', 'aria-label', 'title'] as const
      const remembered = sourceAttributes.current.get(element) ?? new Map<string, string>()
      for (const attribute of attributes) {
        const current = element.getAttribute(attribute)
        if (!current) continue
        const original = remembered.get(attribute) ?? current
        remembered.set(attribute, original)
        const output = translate(original, nextLocale)
        if (current !== output) element.setAttribute(attribute, output)
      }
      sourceAttributes.current.set(element, remembered)
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    for (const node of nodes) {
      if (!isTranslatableText(node)) continue
      const original = sourceText.current.get(node) ?? node.nodeValue ?? ''
      sourceText.current.set(node, original)
      const output = translate(original, nextLocale)
      if (node.nodeValue !== output) node.nodeValue = output
    }
    document.documentElement.lang = nextLocale
  }, [])

  useEffect(() => {
    let readyTimer = 0

    const markDomReady = () => {
      // Route content behind Suspense can hydrate shortly after the layout.
      // Keep the DOM translator idle until that work has settled, otherwise it
      // can replace SSR text before React compares it during hydration.
      readyTimer = window.setTimeout(() => setDomReady(true), 600)
    }

    if (document.readyState === 'complete') {
      markDomReady()
    } else {
      window.addEventListener('load', markDomReady, { once: true })
    }

    return () => {
      window.removeEventListener('load', markDomReady)
      if (readyTimer) window.clearTimeout(readyTimer)
    }
  }, [])

  useEffect(() => {
    if (!domReady || window.localStorage.getItem(storageKey) !== 'en') return

    const timer = window.setTimeout(() => setLocaleState('en'), 0)
    return () => window.clearTimeout(timer)
  }, [domReady])

  useEffect(() => {
    if (!domReady) return

    applyLocale(locale)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') mutation.addedNodes.forEach((node) => applyLocale(locale, node))
        if (mutation.type === 'characterData' && mutation.target instanceof Text && isTranslatableText(mutation.target)) {
          const original = sourceText.current.get(mutation.target)
          // Ignore the mutation produced by applyLocale itself. A React update
          // has a different value and becomes the new source text instead.
          if (original && mutation.target.nodeValue === translate(original, locale)) continue
          sourceText.current.set(mutation.target, mutation.target.nodeValue ?? '')
          applyLocale(locale, mutation.target.parentNode ?? document.body)
        }
      }
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [applyLocale, domReady, locale])

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(storageKey, nextLocale)
    setLocaleState(nextLocale)
  }, [])

  const value = useMemo(() => ({ locale, setLocale, t: (text: string) => translate(text, locale) }), [locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
