import { create } from 'zustand'
import * as Tone from 'tone'
import { recordingEngine } from '@/engine/RecordingEngine'
import { audioEngine } from '@/engine/AudioEngine'
import type { LoopTrack } from '@/types'

interface LoopState {
  isRecording: boolean
  recordingProgress: number
  recordingElapsed: number
  recordingTotal: number
  measures: number
  tracks: LoopTrack[]
  activeSessionId: string | null
  isLoopPlaying: boolean
  loopStartTime: number | null

  setMeasures: (m: number) => void
  startRecording: () => void
  stopRecording: () => Promise<void>
  addTrack: (track: LoopTrack) => void
  removeTrack: (id: string) => void
  toggleTrackMute: (id: string) => void
  setTrackVolume: (id: string, volume: number) => void
  renameTrack: (id: string, name: string) => void
  playAll: () => void
  stopAll: () => void
  clearAll: () => void
}

let trackCounter = 0

export const useLoopStore = create<LoopState>()((set, get) => {
  // Set up callbacks for the recording engine
  recordingEngine.setProgressCallback((progress, elapsed, total) => {
    set({ recordingProgress: progress, recordingElapsed: elapsed, recordingTotal: total })
  })

  recordingEngine.setAutoStopCallback(() => {
    void get().stopRecording()
  })

  return {
    isRecording: false,
    recordingProgress: 0,
    recordingElapsed: 0,
    recordingTotal: 0,
    measures: 4,
    tracks: [],
    activeSessionId: null,
    isLoopPlaying: false,
    loopStartTime: null,

    setMeasures: (m: number) => {
      set({ measures: m })
    },

    startRecording: () => {
      const { measures } = get()
      const bpm = audioEngine.getBpm()

      // Ensure audio context is running
      recordingEngine.init()

      // Start transport if not already playing so sounds can be triggered
      if (Tone.getTransport().state !== 'started') {
        Tone.getTransport().bpm.value = bpm
        Tone.getTransport().start()
      }

      // Start all existing loop players so user hears them during overdub
      if (get().tracks.length > 0) {
        recordingEngine.startAll()
        set({ isLoopPlaying: true, loopStartTime: performance.now() })
      }

      recordingEngine.startRecording(measures, bpm)

      set({
        isRecording: true,
        recordingProgress: 0,
        recordingElapsed: 0,
        recordingTotal: measures * 4 * (60 / bpm),
      })
    },

    stopRecording: async () => {
      if (!get().isRecording) return

      try {
        const { blob: _blob, url, duration } = await recordingEngine.stopRecording()

        trackCounter += 1
        const { measures } = get()
        const bpm = audioEngine.getBpm()

        const track: LoopTrack = {
          id: `loop-${Date.now()}-${trackCounter}`,
          name: `Layer ${trackCounter}`,
          audioUrl: url,
          duration,
          measures,
          bpm,
          muted: false,
          volume: 80,
          createdAt: Date.now(),
        }

        // Create the looping player for this track
        recordingEngine.createLoopTrack(track.id, url, duration)

        // Make sure transport is running for loop playback
        if (Tone.getTransport().state !== 'started') {
          Tone.getTransport().start()
        }

        set((s) => ({
          isRecording: false,
          recordingProgress: 0,
          recordingElapsed: 0,
          recordingTotal: 0,
          tracks: [...s.tracks, track],
          isLoopPlaying: true,
          loopStartTime: s.loopStartTime ?? performance.now(),
        }))
      } catch {
        set({
          isRecording: false,
          recordingProgress: 0,
          recordingElapsed: 0,
          recordingTotal: 0,
        })
      }
    },

    addTrack: (track: LoopTrack) => {
      set((s) => ({ tracks: [...s.tracks, track] }))
    },

    removeTrack: (id: string) => {
      recordingEngine.removeTrack(id)
      set((s) => ({
        tracks: s.tracks.filter((t) => t.id !== id),
      }))
    },

    toggleTrackMute: (id: string) => {
      set((s) => {
        const tracks = s.tracks.map((t) => {
          if (t.id === id) {
            const muted = !t.muted
            recordingEngine.setTrackMute(id, muted)
            return { ...t, muted }
          }
          return t
        })
        return { tracks }
      })
    },

    setTrackVolume: (id: string, volume: number) => {
      // Convert 0-100 to dB: 0 = -Infinity, 100 = 0dB
      const db = volume <= 0 ? -Infinity : -60 + (volume / 100) * 60
      recordingEngine.setTrackVolume(id, db)

      set((s) => ({
        tracks: s.tracks.map((t) =>
          t.id === id ? { ...t, volume } : t
        ),
      }))
    },

    renameTrack: (id: string, name: string) => {
      set((s) => ({
        tracks: s.tracks.map((t) =>
          t.id === id ? { ...t, name } : t
        ),
      }))
    },

    playAll: () => {
      if (Tone.getTransport().state !== 'started') {
        Tone.getTransport().start()
      }
      recordingEngine.startAll()
      set({ isLoopPlaying: true, loopStartTime: performance.now() })
    },

    stopAll: () => {
      recordingEngine.stopAll()
      set({ isLoopPlaying: false, loopStartTime: null })
    },

    clearAll: () => {
      const { tracks } = get()
      for (const track of tracks) {
        recordingEngine.removeTrack(track.id)
      }
      trackCounter = 0
      set({ tracks: [], isLoopPlaying: false, loopStartTime: null })
    },
  }
})
