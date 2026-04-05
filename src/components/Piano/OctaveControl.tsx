import { ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { clsx } from 'clsx'
import { useKeyboardStore } from '@/stores/useKeyboardStore'

export function OctaveControl() {
  const octave = useKeyboardStore((s) => s.octave)
  const shiftOctave = useKeyboardStore((s) => s.shiftOctave)
  const showLabels = useKeyboardStore((s) => s.showLabels)
  const toggleLabels = useKeyboardStore((s) => s.toggleLabels)

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
        <button
          onClick={() => shiftOctave(-1)}
          disabled={octave <= 2}
          className={clsx(
            'p-1 rounded-lg transition-colors',
            octave <= 2
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
          )}
          aria-label="Octave down"
        >
          <ChevronDown size={18} />
        </button>

        <span className="text-sm font-medium text-slate-700 min-w-[72px] text-center">
          C{octave} &ndash; C{octave + 2}
        </span>

        <button
          onClick={() => shiftOctave(1)}
          disabled={octave >= 6}
          className={clsx(
            'p-1 rounded-lg transition-colors',
            octave >= 6
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
          )}
          aria-label="Octave up"
        >
          <ChevronUp size={18} />
        </button>
      </div>

      <button
        onClick={toggleLabels}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
          showLabels
            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50',
        )}
      >
        <Tag size={14} />
        Labels
      </button>
    </div>
  )
}
