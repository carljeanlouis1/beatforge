import { useCallback } from 'react'
import { clsx } from 'clsx'

interface PianoKeyProps {
  note: string
  isBlack: boolean
  isActive: boolean
  label?: string
  keyboardShortcut?: string
  showLabels: boolean
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

export function PianoKey({
  note,
  isBlack,
  isActive,
  label,
  keyboardShortcut,
  showLabels,
  onNoteOn,
  onNoteOff,
}: PianoKeyProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      onNoteOn(note)
    },
    [note, onNoteOn],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      onNoteOff(note)
    },
    [note, onNoteOff],
  )

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      // Only release if a button is pressed (dragging off the key)
      if (e.buttons > 0) {
        onNoteOff(note)
      }
    },
    [note, onNoteOff],
  )

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent) => {
      // Glissando: trigger note when dragging into key
      if (e.buttons > 0) {
        onNoteOn(note)
      }
    },
    [note, onNoteOn],
  )

  if (isBlack) {
    return (
      <button
        className={clsx('piano-key-black no-select', isActive && 'active')}
        style={{
          width: 32,
          height: 100,
          position: 'absolute',
          zIndex: 2,
          touchAction: 'none',
          cursor: 'pointer',
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={handlePointerEnter}
        aria-label={note}
      >
        <span className="flex flex-col items-center justify-end h-full pb-2 gap-0.5">
          {showLabels && keyboardShortcut && (
            <span className="text-[9px] text-slate-400 font-mono">
              {keyboardShortcut}
            </span>
          )}
          {showLabels && label && (
            <span className="text-[10px] text-slate-300 font-medium">
              {label}
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <button
      className={clsx('piano-key-white no-select', isActive && 'active')}
      style={{
        width: 48,
        height: 160,
        position: 'relative',
        zIndex: 1,
        touchAction: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      aria-label={note}
    >
      <span className="flex flex-col items-center justify-end h-full pb-3 gap-0.5">
        {showLabels && keyboardShortcut && (
          <span className="text-[9px] text-slate-400 font-mono">
            {keyboardShortcut}
          </span>
        )}
        {showLabels && label && (
          <span className="text-[11px] text-slate-500 font-medium">
            {label}
          </span>
        )}
      </span>
    </button>
  )
}
