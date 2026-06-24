import { Hexagon } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-50">
          <Hexagon size={20} />
          <span className="font-semibold tracking-tight">NSTRUVision</span>
        </div>
        <div className="text-center md:text-right text-xs text-zinc-500 space-y-1">
          <p>Computer Science Research · Nakhon Si Thammarat Rajabhat University (NSTRU) 2026</p>
          <p>Toxicological Data Reference: Queen Saovabha Memorial Institute (QSMI)</p>
        </div>
      </div>
    </footer>
  )
}
