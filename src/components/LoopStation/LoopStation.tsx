import { useCallback } from 'react'
import { Play, Square, Trash2, Circle } from 'lucide-react'
import { clsx } from 'clsx'
import { useLoopStore } from '@/stores/useLoopStore'
import { LoopTrackRow } from '@/components/LoopStation/LoopTrackRow'
import { LoopVisualizer } from '@/components/LoopStation/LoopVisualizer'

const MEASURE_OPTIONS = [1, 2, 4, 8] as const

export function LoopStation() {
  const {
    isRecording,
    recordingProgress,
    recordingElapsed,
    recordingTotal,
    measures,
    tracks,
    isLoopPlaying,
    setMeasures,
    startRecording,
    stopRecording,
    removeTrack,
    toggleTrackMute,
    setTrackVolume,
    renameTrack,
    playAll,
    stopAll,
    clearAll,
  } = useLoopStore()

  const handleRecord = useCallback(() => {
    if (isRecording) {
      void stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Progress ring dimensions
  const ringSize = 120
  const strokeWidth = 6
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - recordingProgress)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Loop Station
        </h2>
      </div>

      {/* Measure selector + Record button */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        {/* Measure selector */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loop Length
          </span>
          <div className="flex gap-1.5">
            {MEASURE_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMeasures(m)}
                disabled={isRecording || tracks.length > 0}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  measures === m
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  (isRecording || tracks.length > 0) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {m} {m === 1 ? 'bar' : 'bars'}
              </button>
            ))}
          </div>
        </div>

        {/* Record button area */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {/* Progress ring */}
            <svg
              width={ringSize}
              height={ringSize}
              className="transform -rotate-90"
            >
              {/* Background ring */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              {isRecording && (
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-100 ease-linear"
                />
              )}
            </svg>

            {/* Record button (centered inside ring) */}
            <button
              onClick={handleRecord}
              className={clsx(
                'absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center',
                'transition-all duration-200 focus:outline-none',
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
              )}
            >
              {isRecording ? (
                <Square className="w-7 h-7 text-white fill-white" />
              ) : (
                <Circle className="w-8 h-8 text-white fill-white" />
              )}
            </button>
          </div>

          {/* Recording status text */}
          <div className="h-6 flex items-center">
            {isRecording ? (
              <span className="text-sm font-medium text-red-600 tabular-nums">
                Recording... {recordingElapsed.toFixed(1)}s / {recordingTotal.toFixed(1)}s
              </span>
            ) : tracks.length === 0 ? (
              <span className="text-sm text-slate-400">
                Press Record and play some pads to create your first loop!
              </span>
            ) : (
              <span className="text-sm text-slate-400">
                Press Record to overdub a new layer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      {tracks.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recorded Layers ({tracks.length})
          </h3>

          <div className="space-y-2">
            {tracks.map((track, index) => (
              <LoopTrackRow
                key={track.id}
                id={track.id}
                name={track.name}
                volume={track.volume}
                muted={track.muted}
                isPlaying={isLoopPlaying}
                colorIndex={index}
                onVolumeChange={(v) => setTrackVolume(track.id, v)}
                onToggleMute={() => toggleTrackMute(track.id)}
                onDelete={() => removeTrack(track.id)}
                onRename={(n) => renameTrack(track.id, n)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loop Visualizer */}
      {tracks.length > 0 && <LoopVisualizer />}

      {/* Transport controls */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-2">
          {isLoopPlaying ? (
            <button
              onClick={stopAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={playAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              Play All
            </button>
          )}

          <button
            onClick={clearAll}
            disabled={isRecording}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors',
              isRecording
                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            )}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}
