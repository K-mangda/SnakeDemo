import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import { Toaster } from 'sonner'

const prompt = Prompt({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NSTRUVision | Toxicological Classification System',
  description: 'AI-assisted venomous snake classification system with human-in-the-loop verification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="dark">
      <body className={prompt.className + " bg-zinc-950 text-zinc-100 antialiased"}>
        <ToastProvider>
          <Navbar />
          {children}
          <Footer />
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
