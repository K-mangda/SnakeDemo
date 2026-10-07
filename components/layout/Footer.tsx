import { Hexagon } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-11">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 text-zinc-300">
          <Hexagon size={20} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
          <div>
            <p className="font-semibold tracking-tight">NSTRUVision</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Computer Science Research<br />Nakhon Si Thammarat Rajabhat University</p>
          </div>
        </div>
        <div className="max-w-xl text-xs leading-relaxed text-zinc-500 md:text-right">
          <p className="mb-2 font-semibold uppercase tracking-[0.16em] text-zinc-400">Reference data / ข้อมูลอ้างอิง</p>
          <p>Species names and taxonomy: <a className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-300" href="https://thbif.onep.go.th/">TH-BIF / ONEP</a> and <a className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-300" href="https://reptile-database.reptarium.cz/">The Reptile Database</a>.</p>
          <p className="mt-1">Selected venom and antivenom context: <a className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-300" href="https://pubmed.ncbi.nlm.nih.gov/9597848/">Queen Saovabha Memorial Institute / Thai Red Cross review</a>.</p>
          <p className="mt-3 text-zinc-600">Sources inform reference entries; AI predictions are not medical advice or a safety guarantee.</p>
        </div>
      </div>
    </footer>
  )
}
