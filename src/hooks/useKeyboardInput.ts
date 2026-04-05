import { useEffect, useRef } from 'react'
import { PIANO_KEY_MAP_LOWER, PIANO_KEY_MAP_UPPER } from '@/utils/constants'
import { useKeyboardStore } from '@/stores/useKeyboardStore'

export function useKeyboardInput(enabled: boolean) {
  const pressedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) {
      // Release all held notes when disabled
      const { activeNotes, noteOff } = useKeyboardStore.getState()
      for (const note of activeNotes) {
        noteOff(note)
      }
      pressedKeys.current.clear()
      return
    }

    function resolveNote(key: string): string | null {
      const { octave } = useKeyboardStore.getState()
      const lowerKey = key.toLowerCase()

      const lowerNote = PIANO_KEY_MAP_LOWER[lowerKey]
      if (lowerNote) return `${lowerNote}${octave}`

      const upperNote = PIANO_KEY_MAP_UPPER[lowerKey]
      if (upperNote) return `${upperNote}${octave + 1}`

      return null
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if focus is in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const key = e.key
      if (pressedKeys.current.has(key)) return // Prevent repeat

      const note = resolveNote(key)
      if (!note) return

      e.preventDefault()
      pressedKeys.current.add(key)
      useKeyboardStore.getState().noteOn(note)
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key
      if (!pressedKeys.current.has(key)) return

      const note = resolveNote(key)
      if (!note) return

      e.preventDefault()
      pressedKeys.current.delete(key)
      useKeyboardStore.getState().noteOff(note)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)

      // Release any held notes on cleanup
      const { noteOff } = useKeyboardStore.getState()
      for (const key of pressedKeys.current) {
        const note = resolveNote(key)
        if (note) noteOff(note)
      }
      pressedKeys.current.clear()
    }
  }, [enabled])
}
