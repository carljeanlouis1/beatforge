import { clsx } from 'clsx'
import { useKeyboardStore } from '@/stores/useKeyboardStore'
import type { InstrumentType } from '@/types'

const instruments: { type: InstrumentType; label: string; icon: string }[] = [
  { type: 'piano', label: 'Piano', icon: '\u{1F3B9}' },
  { type: 'electric-piano', label: 'E.Piano', icon: '\u{26A1}' },
  { type: 'synth-pad', label: 'Synth Pad', icon: '\u{1F30A}' },
  { type: 'organ', label: 'Organ', icon: '\u{26EA}' },
  { type: 'strings', label: 'Strings', icon: '\u{1F3BB}' },
  { type: 'bass', label: 'Bass', icon: '\u{1F50A}' },
  { type: 'pluck', label: 'Pluck', icon: '\u{1FA95}' },
]

export function InstrumentSelector() {
  const currentInstrument = useKeyboardStore((s) => s.instrument)
  const setInstrument = useKeyboardStore((s) => s.setInstrument)

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none">
      {instruments.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => setInstrument(type)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            currentInstrument === type
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
          )}
        >
          <span className="text-base">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
