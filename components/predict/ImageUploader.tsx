import { UploadCloud } from 'lucide-react'
import { Snake } from '@/lib/types'

interface ImageUploaderProps {
  previewUrl: string | null;
  loading: boolean;
  result: Snake | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploader({
  previewUrl,
  loading,
  result,
  fileInputRef,
  handleFileChange
}: ImageUploaderProps) {
  return (
    <>
      <input 
        type="file" 
        accept="image/png, image/jpeg" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 min-h-[400px] overflow-hidden relative group
          ${previewUrl ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-emerald-500/50'}
        `}
      >
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className={`absolute inset-0 w-full h-full object-contain p-2 transition-all duration-700 ${loading ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'}`} 
            />
            
            {loading && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                {/* Scanning Line */}
                <div className="absolute left-0 w-full h-[2px] bg-emerald-500/80 shadow-[0_0_20px_2px_rgba(16,185,129,0.5)] animate-scan z-20"></div>
                {/* Scanning Overlay */}
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse mix-blend-screen z-10"></div>
              </div>
            )}

            {result && !loading && (
              <div className="absolute inset-2 pointer-events-none animate-fade-up">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Mock Bounding Box */}
                  <div className="absolute border-2 border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]" style={{ left: '15%', top: '15%', width: '70%', height: '70%' }}>
                     <div className="absolute -top-7 left-[-2px] bg-emerald-500 text-zinc-950 text-xs font-bold px-2 py-1 rounded-t-md">
                       {result.scientific} {result.confidence_avg}%
                     </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-zinc-500 text-center transition-transform duration-300 group-hover:-translate-y-2">
            <div className="relative flex items-center justify-center animate-float-small">
              {/* Idle Pulse Ring */}
              <div className="absolute inset-0 rounded-full bg-zinc-700/40 animate-ping-slow group-hover:opacity-0 transition-opacity duration-300"></div>
              
              {/* Main Icon Circle */}
              <div className="relative w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] z-10">
                <UploadCloud size={28} className="text-zinc-400 transition-colors duration-300 group-hover:text-emerald-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1 transition-colors duration-300 group-hover:text-emerald-300">Click to browse files</p>
              <p className="text-xs transition-colors duration-300 group-hover:text-zinc-400">JPEG, PNG up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
