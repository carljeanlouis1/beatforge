import { useEffect, useRef, useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import { clsx } from 'clsx'
import { useLoopStore } from '@/stores/useLoopStore'
import { useTransportStore } from '@/stores/useTransportStore'

const TRACK_COLORS = [
  { bar: 'from-indigo-400 to-violet-500' },
  { bar: 'from-rose-400 to-pink-500' },
  { bar: 'from-emerald-400 to-teal-500' },
  { bar: 'from-amber-400 to-orange-500' },
  { bar: 'from-sky-400 to-blue-500' },
  { bar: 'from-fuchsia-400 to-purple-500' },
  { bar: 'from-cyan-400 to-teal-500' },
  { bar: 'from-lime-400 to-green-500' },
]

export function LoopVisualizer() {
  const tracks = useLoopStore((s) => s.tracks)
  const measures = useLoopStore((s) => s.measures)
  const isLoopPlaying = useLoopStore((s) => s.isLoopPlaying)
  const loopStartTime = useLoopStore((s) => s.loopStartTime)
  const bpm = useTransportStore((s) => s.bpm)

  const [playheadPercent, setPlayheadPercent] = useState(0)
  const rafRef = useRef<number>(0)

  const totalBeats = measures * 4
  const loopDuration = measures * 4 * (60 / bpm) // seconds

  const animate = useCallback(() => {
    if (!loopStartTime) {
      setPlayheadPercent(0)
      return
    }

    const elapsed = (performance.now() - loopStartTime) / 1000
    const percent = ((elapsed % loopDuration) / loopDuration) * 100
    setPlayheadPercent(percent)

    rafRef.current = requestAnimationFrame(animate)
  }, [loopStartTime, loopDuration])

  useEffect(() => {
    if (isLoopPlaying && loopStartTime) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(rafRef.current)
      if (!isLoopPlaying) {
        setPlayheadPercent(0)
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [isLoopPlaying, loopStartTime, animate])

  if (tracks.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700">Loop Timeline</h3>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {measures} {measures === 1 ? 'bar' : 'bars'}
        </span>
      </div>

      {/* Timeline */}
      <div className="px-4 py-3">
        {/* Beat markers */}
        <div className="relative ml-20 mr-2 mb-2">
          <div className="flex">
            {Array.from({ length: totalBeats }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-left"
              >
                <span
                  className={clsx(
                    'text-[10px] font-medium',
                    i % 4 === 0 ? 'text-slate-500' : 'text-slate-300'
                  )}
                >
                  {i % 4 === 0 ? `|${Math.floor(i / 4) + 1}` : '|'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="relative">
          {/* Track rows */}
          <div className="space-y-1.5">
            {tracks.map((track, index) => {
              const colors = TRACK_COLORS[index % TRACK_COLORS.length]
              return (
                <div key={track.id} className="flex items-center gap-2">
                  {/* Layer name */}
                  <div className="w-18 flex-shrink-0 truncate text-xs font-medium text-slate-500 text-right pr-1">
                    {track.name}
                  </div>

                  {/* Colored bar */}
                  <div className="flex-1 relative">
                    <div
                      className={clsx(
                        'h-7 rounded-md bg-gradient-to-r transition-opacity duration-200',
                        colors.bar,
                        track.muted ? 'opacity-30' : 'opacity-100'
                      )}
                    >
                      {/* Faux waveform inside bar */}
                      <div className="absolute inset-0 flex items-center gap-[1px] px-1.5">
                        {Array.from({ length: 48 }, (_, i) => {
                          const h = 25 + Math.sin(i * 0.7 + index * 2) * 35 + Math.cos(i * 1.1 + index) * 20
                          return (
                            <div
                              key={i}
                              className="w-full rounded-full bg-white/25"
                              style={{ height: `${Math.max(15, Math.min(85, h))}%` }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Playhead overlay - positioned over the bar area only */}
          {isLoopPlaying && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: '80px', right: '8px' }}
            >
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 shadow-sm shadow-indigo-400/50 transition-none"
                style={{
                  left: `${playheadPercent}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Playhead top marker */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-600 shadow-sm" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
