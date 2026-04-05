import { useCallback, useEffect, useRef } from 'react'
import { DRUM_SOUNDS, PAD_COLORS, PAD_COLOR_HEX } from '@/utils/constants'
import { usePadStore } from '@/stores/usePadStore'
import type { PadMode } from '@/types'
import { X } from 'lucide-react'

interface PadSettingsProps {
  padId: string
  anchorRect: DOMRect
  onClose: () => void
}

const MODES: { value: PadMode; label: string }[] = [
  { value: 'one-shot', label: 'One-Shot' },
  { value: 'hold', label: 'Hold' },
  { value: 'toggle', label: 'Toggle' },
]

export function PadSettings({ padId, anchorRect, onClose }: PadSettingsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const pads = usePadStore((s) => s.pads)
  const setPadSound = usePadStore((s) => s.setPadSound)
  const setPadVolume = usePadStore((s) => s.setPadVolume)
  const setPadColor = usePadStore((s) => s.setPadColor)
  const setPadMode = usePadStore((s) => s.setPadMode)

  const pad = pads.find((p) => p.id === padId)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleSoundChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPadSound(padId, e.target.value)
    },
    [padId, setPadSound]
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPadVolume(padId, Number(e.target.value))
    },
    [padId, setPadVolume]
  )

  const handleModeChange = useCallback(
    (mode: PadMode) => {
      setPadMode(padId, mode)
    },
    [padId, setPadMode]
  )

  if (!pad) return null

  // Position the panel near the anchor pad
  const top = anchorRect.bottom + 8
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 280))

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-4 animate-slide-up"
        style={{ top, left }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Pad Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Sound selector */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1 block">Sound</span>
          <select
            value={pad.soundId}
            onChange={handleSoundChange}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {DRUM_SOUNDS.map((sound) => (
              <option key={sound.id} value={sound.id}>
                {sound.label}
              </option>
            ))}
          </select>
        </label>

        {/* Volume slider */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1 block">
            Volume: {pad.volume}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={pad.volume}
            onChange={handleVolumeChange}
            className="w-full accent-indigo-500"
          />
        </label>

        {/* Color picker */}
        <div className="mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Color</span>
          <div className="grid grid-cols-8 gap-1.5">
            {PAD_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setPadColor(padId, color)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: PAD_COLOR_HEX[color],
                  borderColor: pad.color === color ? '#334155' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Mode</span>
          <div className="flex gap-1">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                  pad.mode === mode.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
