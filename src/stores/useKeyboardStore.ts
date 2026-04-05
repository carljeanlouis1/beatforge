import { create } from 'zustand'
import { pianoEngine } from '@/engine/PianoEngine'
import type { InstrumentType } from '@/types'

interface KeyboardState {
  instrument: InstrumentType
  octave: number
  sustain: boolean
  activeNotes: string[]
  showLabels: boolean

  setInstrument: (instrument: InstrumentType) => void
  shiftOctave: (direction: 1 | -1) => void
  toggleSustain: () => void
  noteOn: (note: string) => void
  noteOff: (note: string) => void
  toggleLabels: () => void
}

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  instrument: 'piano',
  octave: 4,
  sustain: false,
  activeNotes: [],
  showLabels: true,

  setInstrument: (instrument) => {
    pianoEngine.setInstrument(instrument)
    set({ instrument })
  },

  shiftOctave: (direction) => {
    const next = get().octave + direction
    if (next < 2 || next > 6) return
    pianoEngine.setOctave(next)
    set({ octave: next })
  },

  toggleSustain: () => {
    set((s) => ({ sustain: !s.sustain }))
  },

  noteOn: (note) => {
    const { activeNotes } = get()
    if (activeNotes.includes(note)) return
    pianoEngine.noteOn(note)
    set({ activeNotes: [...activeNotes, note] })
  },

  noteOff: (note) => {
    const { sustain } = get()
    if (sustain) return
    pianoEngine.noteOff(note)
    set((s) => ({ activeNotes: s.activeNotes.filter((n) => n !== note) }))
  },

  toggleLabels: () => {
    set((s) => ({ showLabels: !s.showLabels }))
  },
}))
