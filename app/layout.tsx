import type { Metadata } from 'next'
import './globals.css'
import AppChrome from '@/components/layout/AppChrome'
import { ToastProvider } from '@/components/ui/Toast'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Thai Snake Classifier',
  description: 'Thai snake image classification with expert data verification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <ToastProvider>
          <AppChrome>{children}</AppChrome>
        </ToastProvider>
        <Toaster theme="dark" position="top-center" toastOptions={{
          style: {
            background: 'rgba(24, 24, 27, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            color: '#fff',
          }
        }} />
      </body>
    </html>
  )
}
