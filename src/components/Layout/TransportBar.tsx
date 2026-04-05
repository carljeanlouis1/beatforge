import { Play, Square, Circle, Repeat, ChevronUp, ChevronDown } from 'lucide-react'
import { DEFAULT_BPM } from '@/utils/constants'
import { useState } from 'react'

export function TransportBar() {
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(true)

  return (
    <header className="glass-strong sticky top-0 z-50 px-4 py-2 flex items-center justify-between gap-4 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm font-mono">BF</span>
        </div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
          BeatForge
        </h1>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>

        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-red-400 border border-slate-200 hover:border-red-300 hover:text-red-500 transition-all"
        >
          <Circle size={16} fill="currentColor" />
        </button>

        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isLooping
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
          }`}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* BPM Control */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 px-3 py-1">
        <div className="flex flex-col">
          <button
            onClick={() => setBpm(Math.min(200, bpm + 1))}
            className="text-slate-400 hover:text-indigo-500 transition-colors -mb-1"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => setBpm(Math.max(60, bpm - 1))}
            className="text-slate-400 hover:text-indigo-500 transition-colors -mt-1"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <span className="font-mono text-lg font-semibold text-slate-800 min-w-[3ch] text-center">
          {bpm}
        </span>
        <span className="text-xs text-slate-400 font-medium">BPM</span>
      </div>
    </header>
  )
}
