import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SequencerTrack } from '@/types'

interface SequencerState {
  stepCount: 16 | 32
  tracks: SequencerTrack[]

  toggleStep: (trackIndex: number, stepIndex: number) => void
  setStepCount: (count: 16 | 32) => void
  addTrack: (soundId: string, label: string) => void
  removeTrack: (index: number) => void
  toggleTrackMute: (index: number) => void
  setTrackVolume: (index: number, volume: number) => void
  clearPattern: () => void
  loadPattern: (tracks: SequencerTrack[]) => void
  initDefaultTracks: () => void
}

function createEmptySteps(count: number): boolean[] {
  return Array.from({ length: count }, () => false)
}

function createDefaultTracks(stepCount: number): SequencerTrack[] {
  return [
    { soundId: 'kick', label: 'Kick', steps: createEmptySteps(stepCount), volume: 80, muted: false },
    { soundId: 'snare', label: 'Snare', steps: createEmptySteps(stepCount), volume: 80, muted: false },
    { soundId: 'hihat-closed', label: 'HH Closed', steps: createEmptySteps(stepCount), volume: 70, muted: false },
    { soundId: 'hihat-open', label: 'HH Open', steps: createEmptySteps(stepCount), volume: 65, muted: false },
  ]
}

export const useSequencerStore = create<SequencerState>()(
  persist(
    (set, get) => ({
      stepCount: 16,
      tracks: createDefaultTracks(16),

      toggleStep: (trackIndex: number, stepIndex: number) => {
        set((state) => ({
          tracks: state.tracks.map((track, i) =>
            i === trackIndex
              ? {
                  ...track,
                  steps: track.steps.map((s, j) => (j === stepIndex ? !s : s)),
                }
              : track
          ),
        }))
      },

      setStepCount: (count: 16 | 32) => {
        set((state) => ({
          stepCount: count,
          tracks: state.tracks.map((track) => {
            if (track.steps.length === count) return track
            if (count > track.steps.length) {
              // Extend with empty steps
              return {
                ...track,
                steps: [...track.steps, ...createEmptySteps(count - track.steps.length)],
              }
            }
            // Truncate
            return {
              ...track,
              steps: track.steps.slice(0, count),
            }
          }),
        }))
      },

      addTrack: (soundId: string, label: string) => {
        const { stepCount } = get()
        set((state) => ({
          tracks: [
            ...state.tracks,
            {
              soundId,
              label,
              steps: createEmptySteps(stepCount),
              volume: 80,
              muted: false,
            },
          ],
        }))
      },

      removeTrack: (index: number) => {
        set((state) => ({
          tracks: state.tracks.filter((_, i) => i !== index),
        }))
      },

      toggleTrackMute: (index: number) => {
        set((state) => ({
          tracks: state.tracks.map((track, i) =>
            i === index ? { ...track, muted: !track.muted } : track
          ),
        }))
      },

      setTrackVolume: (index: number, volume: number) => {
        set((state) => ({
          tracks: state.tracks.map((track, i) =>
            i === index ? { ...track, volume } : track
          ),
        }))
      },

      clearPattern: () => {
        set((state) => ({
          tracks: state.tracks.map((track) => ({
            ...track,
            steps: createEmptySteps(state.stepCount),
          })),
        }))
      },

      loadPattern: (tracks: SequencerTrack[]) => {
        set({ tracks })
      },

      initDefaultTracks: () => {
        const { stepCount } = get()
        set({ tracks: createDefaultTracks(stepCount) })
      },
    }),
    {
      name: 'beatforge-sequencer',
      partialize: (state) => ({
        stepCount: state.stepCount,
        tracks: state.tracks,
      }),
    }
  )
)
