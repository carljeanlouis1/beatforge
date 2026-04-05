import { Volume2 } from 'lucide-react'

interface AudioInitOverlayProps {
  onInit: () => void
}

export function AudioInitOverlay({ onInit }: AudioInitOverlayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-2xl font-mono">BF</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          BeatForge
        </h1>
        <p className="text-slate-500 mb-8 text-sm">Create. Play. Forge Your Sound.</p>
        <button
          onClick={onInit}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Volume2 size={24} className="group-hover:animate-pulse" />
          Tap to Start
        </button>
      </div>
    </div>
  )
}
