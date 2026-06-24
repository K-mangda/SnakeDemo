const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('lib/utils.ts', `
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDangerColor(level: number): string {
  if (level >= 5) return 'text-red-500'
  if (level >= 4) return 'text-orange-500'
  if (level >= 3) return 'text-amber-500'
  return 'text-emerald-500'
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
`);

write('app/layout.tsx', `
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NRRUVision | Toxicological Classification System',
  description: 'AI-assisted venomous snake classification system with human-in-the-loop verification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className + " bg-zinc-950 text-zinc-100 antialiased"}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
`);
