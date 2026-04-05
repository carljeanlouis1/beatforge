import { useState, useRef, useEffect } from 'react'
import { Trash2, Volume2, VolumeX } from 'lucide-react'
import { clsx } from 'clsx'

interface LoopTrackRowProps {
  id: string
  name: string
  volume: number
  muted: boolean
  isPlaying: boolean
  colorIndex: number
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onDelete: () => void
  onRename: (name: string) => void
}

const TRACK_COLORS = [
  { bar: 'from-indigo-400 to-violet-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { bar: 'from-rose-400 to-pink-500', bg: 'bg-rose-50', text: 'text-rose-700' },
  { bar: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { bar: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  { bar: 'from-sky-400 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  { bar: 'from-fuchsia-400 to-purple-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
  { bar: 'from-cyan-400 to-teal-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  { bar: 'from-lime-400 to-green-500', bg: 'bg-lime-50', text: 'text-lime-700' },
]

export function LoopTrackRow({
  id: _id,
  name,
  volume,
  muted,
  isPlaying,
  colorIndex,
  onVolumeChange,
  onToggleMute,
  onDelete,
  onRename,
}: LoopTrackRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  const colors = TRACK_COLORS[colorIndex % TRACK_COLORS.length]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== name) {
      onRename(trimmed)
    } else {
      setEditName(name)
    }
    setIsEditing(false)
  }

  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm p-3 transition-all duration-200',
        'hover:shadow-md',
        muted && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Track name */}
        <div className="min-w-0 flex-shrink-0 w-24">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setEditName(name)
                  setIsEditing(false)
                }
              }}
              className="w-full text-sm font-semibold bg-slate-100 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800"
            />
          ) : (
            <button
              onClick={() => {
                setEditName(name)
                setIsEditing(true)
              }}
              className={clsx(
                'text-sm font-semibold truncate block text-left cursor-text hover:underline decoration-dotted underline-offset-2',
                colors.text
              )}
              title="Click to rename"
            >
              {name}
            </button>
          )}
        </div>

        {/* Colored waveform bar */}
        <div className="flex-1 min-w-0">
          <div
            className={clsx(
              'h-8 rounded-lg bg-gradient-to-r overflow-hidden relative',
              colors.bar,
              muted && 'grayscale'
            )}
          >
            {/* Faux waveform pattern */}
            <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2">
              {Array.from({ length: 32 }, (_, i) => {
                const h = 20 + Math.sin(i * 0.8) * 40 + Math.cos(i * 1.3) * 25
                return (
                  <div
                    key={i}
                    className={clsx(
                      'w-full rounded-full bg-white/30 transition-transform duration-300',
                      isPlaying && !muted && 'animate-pulse'
                    )}
                    style={{ height: `${Math.max(15, Math.min(90, h))}%` }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="
              w-full appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-1
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-runnable-track]:bg-slate-200
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-indigo-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-webkit-slider-thumb]:-mt-[4px]
            "
          />
        </div>

        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            muted
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          )}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete track"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
