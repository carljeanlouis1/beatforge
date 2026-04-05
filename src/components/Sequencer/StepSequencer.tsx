import { useEffect, useCallback, useState } from 'react'
import { Trash2, Plus, Grid3X3 } from 'lucide-react'
import { clsx } from 'clsx'
import { useSequencerStore } from '@/stores/useSequencerStore'
import { useTransportStore } from '@/stores/useTransportStore'
import { sequencerEngine } from '@/engine/SequencerEngine'
import { DRUM_SOUNDS, PAD_COLORS } from '@/utils/constants'
import { SequencerRow } from '@/components/Sequencer/SequencerRow'

export function StepSequencer() {
  const { stepCount, tracks, toggleStep, setStepCount, removeTrack, toggleTrackMute, clearPattern, addTrack } =
    useSequencerStore()
  const { currentStep, isPlaying, setCurrentStep } = useTransportStore()
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Sync tracks to SequencerEngine whenever they change
  useEffect(() => {
    sequencerEngine.setPattern(tracks)
  }, [tracks])

  // Sync step count to SequencerEngine
  useEffect(() => {
    sequencerEngine.setStepCount(stepCount)
  }, [stepCount])

  // Register step callback for playhead
  useEffect(() => {
    const callback = (step: number) => {
      setCurrentStep(step)
    }
    sequencerEngine.onStep(callback)
    return () => {
      sequencerEngine.removeStepCallback(callback)
    }
  }, [setCurrentStep])

  const handleAddTrack = useCallback(
    (soundId: string, label: string) => {
      addTrack(soundId, label)
      setShowAddMenu(false)
    },
    [addTrack]
  )

  // Get which sound IDs are already in the sequencer
  const usedSoundIds = new Set(tracks.map((t) => t.soundId))
  const availableSounds = DRUM_SOUNDS.filter((s) => !usedSoundIds.has(s.id))

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Grid3X3 size={16} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700">Step Sequencer</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Step count toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setStepCount(16)}
              className={clsx(
                'px-3 py-1 text-xs font-medium transition-colors',
                stepCount === 16
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              )}
            >
              16
            </button>
            <button
              onClick={() => setStepCount(32)}
              className={clsx(
                'px-3 py-1 text-xs font-medium transition-colors',
                stepCount === 32
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              )}
            >
              32
            </button>
          </div>

          {/* Clear button */}
          <button
            onClick={clearPattern}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
          >
            <Trash2 size={12} />
            Clear
          </button>

          {/* Add track */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={availableSounds.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={12} />
              Add
            </button>
            {showAddMenu && availableSounds.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-20 max-h-52 overflow-y-auto">
                {availableSounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => handleAddTrack(sound.id, sound.label)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {sound.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close add menu on click outside */}
      {showAddMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
      )}

      {/* Sequencer Grid */}
      <div className="overflow-x-auto p-3">
        <div
          className="grid gap-1 items-center"
          style={{
            gridTemplateColumns: `120px repeat(${stepCount}, minmax(16px, 1fr))`,
          }}
        >
          {/* Beat number header */}
          <div className="text-[10px] text-slate-400 font-medium px-2">Track</div>
          {Array.from({ length: stepCount }, (_, i) => (
            <div
              key={i}
              className={clsx(
                'text-center text-[9px] font-medium',
                i % 4 === 0 ? 'text-slate-500' : 'text-slate-300',
                isPlaying && i === currentStep && 'text-indigo-600 font-bold'
              )}
            >
              {i % 4 === 0 ? i / 4 + 1 : ''}
            </div>
          ))}

          {/* Track rows */}
          {tracks.map((track, trackIndex) => (
            <SequencerRow
              key={`${track.soundId}-${trackIndex}`}
              track={track}
              trackIndex={trackIndex}
              currentStep={currentStep}
              isPlaying={isPlaying}
              padColor={PAD_COLORS[trackIndex % PAD_COLORS.length]}
              onToggleStep={toggleStep}
              onToggleMute={toggleTrackMute}
              onRemove={removeTrack}
            />
          ))}
        </div>

        {/* Empty state */}
        {tracks.length === 0 && (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
            No tracks. Click "Add" to add a drum track.
          </div>
        )}
      </div>
    </div>
  )
}
