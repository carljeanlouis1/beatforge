import { useCallback, useMemo } from 'react'
import { PianoKey } from '@/components/Piano/PianoKey'
import { useKeyboardStore } from '@/stores/useKeyboardStore'
import {
  PIANO_KEY_MAP_LOWER,
  PIANO_KEY_MAP_UPPER,
} from '@/utils/constants'

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const BLACK_NOTES = ['C#', 'D#', null, 'F#', 'G#', 'A#'] as const

// Maps from note name to physical key for the lower octave (Z row)
function invertMap(map: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, note] of Object.entries(map)) {
    result[note] = key.toUpperCase()
  }
  return result
}

const LOWER_NOTE_TO_KEY = invertMap(PIANO_KEY_MAP_LOWER)
const UPPER_NOTE_TO_KEY = invertMap(PIANO_KEY_MAP_UPPER)

// Black key offsets relative to white key positions (as percentage from left of the white key)
// C# sits between C and D, D# between D and E, F# between F and G, etc.
const BLACK_KEY_OFFSETS = [0, 1, -1, 3, 4, 5] // index of white key to the left
// Indices 0-5 correspond to positions between white keys:
// 0: C-D (C#), 1: D-E (D#), 2: E-F (no black), 3: F-G (F#), 4: G-A (G#), 5: A-B (A#)

interface OctaveKeysProps {
  octaveNum: number
  octaveIndex: number // 0 = lower (z-row), 1 = upper (q-row), 2+ = no shortcut
  activeNotes: string[]
  showLabels: boolean
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

function OctaveKeys({
  octaveNum,
  octaveIndex,
  activeNotes,
  showLabels,
  onNoteOn,
  onNoteOff,
}: OctaveKeysProps) {
  const shortcutMap =
    octaveIndex === 0
      ? LOWER_NOTE_TO_KEY
      : octaveIndex === 1
        ? UPPER_NOTE_TO_KEY
        : null

  return (
    <div className="relative flex" style={{ height: 160 }}>
      {/* White keys */}
      {WHITE_NOTES.map((noteName) => {
        const fullNote = `${noteName}${octaveNum}`
        const shortcut = shortcutMap ? shortcutMap[noteName] : undefined
        return (
          <PianoKey
            key={fullNote}
            note={fullNote}
            isBlack={false}
            isActive={activeNotes.includes(fullNote)}
            label={noteName}
            keyboardShortcut={shortcut}
            showLabels={showLabels}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        )
      })}

      {/* Black keys positioned absolutely */}
      {BLACK_NOTES.map((noteName, i) => {
        if (!noteName) return null
        const fullNote = `${noteName}${octaveNum}`
        const shortcut = shortcutMap ? shortcutMap[noteName] : undefined

        // Position: each white key is 48px wide
        // Black key should be centered between the two white keys
        const whiteKeyIndex = BLACK_KEY_OFFSETS[i]
        const leftPos = (whiteKeyIndex + 1) * 48 - 16 // 16 = half of 32px black key width

        return (
          <div
            key={fullNote}
            style={{
              position: 'absolute',
              left: leftPos,
              top: 0,
            }}
          >
            <PianoKey
              note={fullNote}
              isBlack
              isActive={activeNotes.includes(fullNote)}
              label={noteName}
              keyboardShortcut={shortcut}
              showLabels={showLabels}
              onNoteOn={onNoteOn}
              onNoteOff={onNoteOff}
            />
          </div>
        )
      })}
    </div>
  )
}

export function PianoKeyboard() {
  const octave = useKeyboardStore((s) => s.octave)
  const activeNotes = useKeyboardStore((s) => s.activeNotes)
  const showLabels = useKeyboardStore((s) => s.showLabels)
  const noteOn = useKeyboardStore((s) => s.noteOn)
  const noteOff = useKeyboardStore((s) => s.noteOff)

  const handleNoteOn = useCallback(
    (note: string) => noteOn(note),
    [noteOn],
  )
  const handleNoteOff = useCallback(
    (note: string) => noteOff(note),
    [noteOff],
  )

  // Render 2 octaves starting from the current octave
  const octaves = useMemo(
    () => [octave, octave + 1],
    [octave],
  )

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 overflow-x-auto">
      <div className="flex justify-center min-w-fit">
        {octaves.map((oct, i) => (
          <OctaveKeys
            key={oct}
            octaveNum={oct}
            octaveIndex={i}
            activeNotes={activeNotes}
            showLabels={showLabels}
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
        ))}
      </div>
    </div>
  )
}
