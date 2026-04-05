import { Wand2, Loader2 } from 'lucide-react'
import { useSoundForgeStore } from '@/stores/useSoundForgeStore'

const DURATION_PRESETS = [0.5, 1, 2, 5, 10] as const

export function GenerationControls() {
  const duration = useSoundForgeStore((s) => s.duration)
  const setDuration = useSoundForgeStore((s) => s.setDuration)
  const loop = useSoundForgeStore((s) => s.loop)
  const setLoop = useSoundForgeStore((s) => s.setLoop)
  const promptInfluence = useSoundForgeStore((s) => s.promptInfluence)
  const setPromptInfluence = useSoundForgeStore((s) => s.setPromptInfluence)
  const prompt = useSoundForgeStore((s) => s.prompt)
  const isGenerating = useSoundForgeStore((s) => s.isGenerating)
  const error = useSoundForgeStore((s) => s.error)
  const generate = useSoundForgeStore((s) => s.generate)

  const canGenerate = prompt.trim().length > 0 && !isGenerating

  return (
    <div className="space-y-4">
      {/* Duration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">
            Duration
          </label>
          <span className="text-xs text-slate-500 tabular-nums">
            {duration}s
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={duration}
          onChange={(e) => setDuration(parseFloat(e.target.value))}
          disabled={isGenerating}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer
            accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex gap-1.5">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              disabled={isGenerating}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all duration-150
                ${duration === d
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Loop toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">
          Seamless loop
        </label>
        <button
          onClick={() => setLoop(!loop)}
          disabled={isGenerating}
          className={`relative w-10 h-5.5 rounded-full transition-colors duration-200
            ${loop ? 'bg-indigo-500' : 'bg-slate-300'}
            disabled:opacity-50 disabled:cursor-not-allowed`}
          role="switch"
          aria-checked={loop}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm
              transition-transform duration-200
              ${loop ? 'translate-x-4.5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Prompt Influence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">
            Prompt influence
          </label>
          <span className="text-xs text-slate-500 tabular-nums">
            {Math.round(promptInfluence * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={promptInfluence}
          onChange={(e) => setPromptInfluence(parseFloat(e.target.value))}
          disabled={isGenerating}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer
            accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>More Creative</span>
          <span>More Precise</span>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() => void generate()}
        disabled={!canGenerate}
        className={`w-full py-3 rounded-xl font-semibold text-sm text-white
          transition-all duration-200 flex items-center justify-center gap-2
          ${canGenerate
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg active:scale-[0.98]'
            : 'bg-slate-300 cursor-not-allowed'
          }
          ${isGenerating ? 'animate-pulse' : ''}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Sound
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 text-center animate-fade-in">
          {error}
        </p>
      )}
    </div>
  )
}
