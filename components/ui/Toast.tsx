'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastData {
  id: string
  message: string
  type: ToastType
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    // We only keep the latest 3 toasts to avoid screen clutter
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }]
      return newToasts.slice(-3)
    })
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className={`
                flex items-center gap-3 px-5 py-3 rounded-full shadow-xl backdrop-blur-md border 
                ${toast.type === 'success' ? 'bg-zinc-900/80 border-emerald-500/40 text-emerald-50 shadow-emerald-500/10' : ''}
                ${toast.type === 'error' ? 'bg-zinc-900/80 border-red-500/40 text-red-50 shadow-red-500/10' : ''}
                ${toast.type === 'info' ? 'bg-zinc-900/80 border-blue-500/40 text-blue-50 shadow-blue-500/10' : ''}
              `}
            >
              {toast.type === 'success' && <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />}
              {toast.type === 'error' && <AlertCircle className="text-red-400 shrink-0" size={18} />}
              {toast.type === 'info' && <Info className="text-blue-400 shrink-0" size={18} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
