import { useState } from 'react'
import { Music, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { PRESET_BEATS, GENRE_COLORS } from '@/utils/presets'
import { useSequencerStore } from '@/stores/useSequencerStore'
import { useTransportStore } from '@/stores/useTransportStore'
import type { PresetBeat, SequencerTrack } from '@/types'

function MiniGrid({ pattern }: { pattern: boolean[][] }) {
  return (
    <div className="flex flex-col gap-px">
      {pattern.map((row, ri) => (
        <div key={ri} className="flex gap-px">
          {row.map((active, ci) => (
            <div
              key={ci}
              className={clsx(
                'w-1.5 h-1.5 rounded-[1px]',
                active ? 'bg-indigo-400' : 'bg-slate-200'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function PresetCard({
  preset,
  isActive,
  onSelect,
}: {
  preset: PresetBeat
  isActive: boolean
  onSelect: () => void
}) {
  const genreStyle = GENRE_COLORS[preset.genre] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  }

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'flex-shrink-0 w-44 p-3 rounded-xl border transition-all text-left',
        'hover:shadow-md hover:-translate-y-0.5',
        isActive
          ? 'border-indigo-300 bg-indigo-50/60 shadow-sm shadow-indigo-100'
          : 'border-slate-200 bg-white hover:border-indigo-200'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm text-slate-800">{preset.name}</h3>
          <span
            className={clsx(
              'inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
              genreStyle.bg,
              genreStyle.text,
              genreStyle.border
            )}
          >
            {preset.genre}
          </span>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500">{preset.bpm}</span>
      </div>
      <MiniGrid pattern={preset.pattern} />
    </button>
  )
}

export function PresetSelector() {
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const loadPattern = useSequencerStore((s) => s.loadPattern)
  const setBpm = useTransportStore((s) => s.setBpm)

  const handleSelect = (preset: PresetBeat) => {
    // Convert preset pattern + pads into SequencerTracks
    const tracks: SequencerTrack[] = preset.pads.map((pad, i) => ({
      soundId: pad.soundId,
      label: pad.label,
      steps: preset.pattern[i] ?? Array.from({ length: 16 }, () => false),
      volume: pad.volume,
      muted: false,
    }))

    loadPattern(tracks)
    setBpm(preset.bpm)
    setActivePreset(preset.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <h2 className="font-semibold text-slate-800 text-sm">Preset Patterns</h2>
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
          <Music size={12} />
          {PRESET_BEATS.length} presets
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {PRESET_BEATS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePreset === preset.id}
            onSelect={() => handleSelect(preset)}
          />
        ))}
      </div>
    </div>
  )
}
