import { Volume2, VolumeX, X } from 'lucide-react'
import { clsx } from 'clsx'
import { PAD_COLOR_HEX } from '@/utils/constants'
import type { SequencerTrack } from '@/types'

interface SequencerRowProps {
  track: SequencerTrack
  trackIndex: number
  currentStep: number
  isPlaying: boolean
  padColor: string
  onToggleStep: (trackIndex: number, stepIndex: number) => void
  onToggleMute: (trackIndex: number) => void
  onRemove: (trackIndex: number) => void
}

export function SequencerRow({
  track,
  trackIndex,
  currentStep,
  isPlaying,
  padColor,
  onToggleStep,
  onToggleMute,
  onRemove,
}: SequencerRowProps) {
  const color = PAD_COLOR_HEX[padColor] ?? '#818cf8'

  return (
    <div
      className={clsx(
        'contents',
        track.muted && 'opacity-40'
      )}
    >
      {/* Track label cell */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
        <button
          onClick={() => onToggleMute(trackIndex)}
          className={clsx(
            'shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
            track.muted
              ? 'bg-slate-100 text-slate-400'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          )}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-slate-700 truncate">
          {track.label}
        </span>
        <button
          onClick={() => onRemove(trackIndex)}
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors ml-auto"
          title="Remove track"
        >
          <X size={10} />
        </button>
      </div>

      {/* Step cells */}
      {track.steps.map((active, stepIndex) => {
        const isCurrentStep = isPlaying && stepIndex === currentStep
        const isBeatStart = stepIndex % 4 === 0

        return (
          <button
            key={stepIndex}
            onClick={() => onToggleStep(trackIndex, stepIndex)}
            className={clsx(
              'w-full aspect-square rounded-md transition-all duration-75 border',
              'min-w-0 max-w-[32px]',
              active
                ? 'border-transparent shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300',
              isCurrentStep && !active && 'border-indigo-300 bg-indigo-50',
              isCurrentStep && active && 'ring-2 ring-indigo-400 ring-offset-1',
              isBeatStart && !active && !isCurrentStep && 'border-slate-300'
            )}
            style={
              active
                ? {
                    backgroundColor: color,
                    boxShadow: isCurrentStep
                      ? `0 0 8px ${color}80`
                      : undefined,
                  }
                : undefined
            }
          />
        )
      })}
    </div>
  )
}
