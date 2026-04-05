import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as Tone from 'tone'
import { sequencerEngine } from '@/engine/SequencerEngine'
import { DEFAULT_BPM } from '@/utils/constants'

interface TransportState {
  bpm: number
  isPlaying: boolean
  isRecording: boolean
  isLooping: boolean
  currentStep: number

  setBpm: (bpm: number) => void
  togglePlay: () => void
  stop: () => void
  toggleRecord: () => void
  toggleLoop: () => void
  setCurrentStep: (step: number) => void
  tapTempo: () => void
}

const tapTimestamps: number[] = []

export const useTransportStore = create<TransportState>()(
  persist(
    (set, get) => ({
      bpm: DEFAULT_BPM,
      isPlaying: false,
      isRecording: false,
      isLooping: true,
      currentStep: 0,

      setBpm: (bpm: number) => {
        const clamped = Math.min(300, Math.max(30, bpm))
        Tone.getTransport().bpm.value = clamped
        set({ bpm: clamped })
      },

      togglePlay: () => {
        const { isPlaying, bpm } = get()

        if (isPlaying) {
          sequencerEngine.stop()
          set({ isPlaying: false, currentStep: 0 })
        } else {
          // Ensure BPM is synced
          Tone.getTransport().bpm.value = bpm
          sequencerEngine.start()
          set({ isPlaying: true })
        }
      },

      stop: () => {
        sequencerEngine.stop()
        set({ isPlaying: false, currentStep: 0 })
      },

      toggleRecord: () => {
        set((s) => ({ isRecording: !s.isRecording }))
      },

      toggleLoop: () => {
        const next = !get().isLooping
        Tone.getTransport().loop = next
        set({ isLooping: next })
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step })
      },

      tapTempo: () => {
        const now = performance.now()
        tapTimestamps.push(now)

        // Keep only the last 4 taps
        while (tapTimestamps.length > 4) {
          tapTimestamps.shift()
        }

        if (tapTimestamps.length >= 2) {
          const intervals: number[] = []
          for (let i = 1; i < tapTimestamps.length; i++) {
            intervals.push(tapTimestamps[i] - tapTimestamps[i - 1])
          }
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
          const bpm = Math.round(60000 / avgInterval)
          const clamped = Math.min(300, Math.max(30, bpm))
          Tone.getTransport().bpm.value = clamped
          set({ bpm: clamped })
        }

        // Reset if tap is too long after last one (> 2 seconds)
        setTimeout(() => {
          if (tapTimestamps.length > 0 && performance.now() - tapTimestamps[tapTimestamps.length - 1] > 2000) {
            tapTimestamps.length = 0
          }
        }, 2100)
      },
    }),
    {
      name: 'beatforge-transport',
      partialize: (state) => ({
        bpm: state.bpm,
        isLooping: state.isLooping,
      }),
    }
  )
)
