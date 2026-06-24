const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
  const fullPath = path.resolve(path.join(__dirname, '..'), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Updated:', filepath);
};

write('app/page.tsx', `
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import SpeciesStrip from '@/components/home/SpeciesStrip'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950">
      <HeroSection />
      <FeaturesSection />
      <SpeciesStrip />
    </main>
  )
}
`);

write('app/predict/page.tsx', `
'use client'
import { useState } from 'react'
import { UploadCloud, Loader2, AlertCircle, ShieldAlert, Crosshair } from 'lucide-react'
import { SNAKE_DATA } from '@/lib/data'
import { Snake } from '@/lib/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getDangerColor } from '@/lib/utils'

export default function PredictPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Snake | null>(null)

  const handlePredict = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(SNAKE_DATA[0])
      setLoading(false)
    }, 2000)
  }

  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-zinc-900 pb-8">
          <h1 className="text-3xl font-medium text-zinc-100 mb-2">Subject Analysis</h1>
          <p className="text-zinc-500 font-light">Upload an image for automated taxonomic classification.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div 
            onClick={handlePredict}
            className="border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-colors cursor-pointer flex flex-col items-center justify-center p-12 min-h-[400px]"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-zinc-400">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
                <span className="text-sm font-medium animate-pulse">Processing image data...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-zinc-500 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                  <UploadCloud size={28} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300 mb-1">Click to upload</p>
                  <p className="text-xs">JPEG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex flex-col h-full">
            {!result ? (
              <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/10 flex items-center justify-center text-zinc-600 text-sm p-6 text-center">
                Analysis results will appear here after processing.
              </div>
            ) : (
              <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/40 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="success" className="animate-fade-up">Classification Complete</Badge>
                  <span className="text-xs font-mono text-zinc-500">CONFIDENCE: 94.2%</span>
                </div>

                <div className="mb-8">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{result.scientific}</p>
                  <h2 className="text-2xl font-medium text-zinc-100">{result.name_en}</h2>
                  <p className="text-zinc-400 text-sm mt-1">{result.name_th}</p>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                    <span className="text-sm text-zinc-500">Toxicity Profile</span>
                    <span className={\`text-sm font-medium \${getDangerColor(result.danger_level)}\`}>{result.danger_label}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                    <span className="text-sm text-zinc-500">Venom Type</span>
                    <span className="text-sm text-zinc-300 capitalize">{result.venom_type}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                    <span className="text-sm text-zinc-500">Antivenom Protocol</span>
                    <span className="text-sm text-zinc-300 text-right max-w-[200px] truncate" title={result.antivenom}>{result.antivenom}</span>
                  </div>
                </div>

                <Button href={\`/snakes/\${result.id}\`} variant="secondary" className="w-full">
                  View Full Medical Protocol
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
`);

write('app/snakes/page.tsx', `
import Link from 'next/link'
import { SNAKE_DATA } from '@/lib/data'
import { Search } from 'lucide-react'
import { getDangerColor } from '@/lib/utils'

export default function SnakesPage() {
  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-medium text-zinc-100 mb-2">Taxonomic Database</h1>
            <p className="text-zinc-500 font-light">Reference database of venomous species in Thailand.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search database..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </header>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                <th className="p-4 font-medium">Species</th>
                <th className="p-4 font-medium hidden sm:table-cell">Scientific Name</th>
                <th className="p-4 font-medium">Toxicity</th>
                <th className="p-4 font-medium hidden md:table-cell">Habitat</th>
                <th className="p-4 font-medium text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {SNAKE_DATA.map((snake) => (
                <tr key={snake.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4">
                    <Link href={\`/snakes/\${snake.id}\`} className="flex flex-col">
                      <span className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">{snake.name_en}</span>
                      <span className="text-xs text-zinc-500">{snake.name_th}</span>
                    </Link>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-sm text-zinc-400 italic">
                    {snake.scientific}
                  </td>
                  <td className="p-4">
                    <span className={\`text-xs font-medium px-2 py-1 rounded-sm bg-zinc-900 border border-zinc-800 \${getDangerColor(snake.danger_level)}\`}>
                      {snake.venom_type}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-zinc-400">
                    {snake.habitat}
                  </td>
                  <td className="p-4 text-right text-sm text-zinc-500 font-mono">
                    {snake.predictions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
`);
