import { useEffect, useState, useCallback } from 'react'
import { PAD_KEYBOARD_MAP_4x4 } from '@/utils/constants'
import { usePadStore } from '@/stores/usePadStore'

/** Flat array of keyboard keys mapped to pad indices for the 4x4 grid. */
const FLAT_KEYS = PAD_KEYBOARD_MAP_4x4.flat()

export function usePadKeyboard() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const triggerPad = usePadStore((s) => s.triggerPad)
  const pads = usePadStore((s) => s.pads)
  const gridSize = usePadStore((s) => s.gridSize)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = e.key.toLowerCase()

      // Only use keyboard map for 4x4 grid
      if (gridSize !== 4) return

      // Prevent key repeat
      if (e.repeat) return

      const padIndex = FLAT_KEYS.indexOf(key)
      if (padIndex === -1) return
      if (padIndex >= pads.length) return

      e.preventDefault()
      triggerPad(pads[padIndex].id)
      setPressedKeys((prev) => new Set(prev).add(key))
    },
    [triggerPad, pads, gridSize]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      setPressedKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    },
    []
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  /** Returns the keyboard shortcut key for a given pad index, or undefined. */
  const getKeyForPad = useCallback(
    (padIndex: number): string | undefined => {
      if (gridSize !== 4) return undefined
      return FLAT_KEYS[padIndex]
    },
    [gridSize]
  )

  return { pressedKeys, getKeyForPad }
}
