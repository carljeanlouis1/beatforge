import { create } from 'zustand'
import { voiceEngine } from '@/engine/VoiceEngine'
import {
  transformVoice as transformVoiceApi,
  isolateAudio as isolateAudioApi,
  listVoices as listVoicesApi,
} from '@/services/voice'
import type { VoiceInfo } from '@/services/voice'
import { saveSound } from '@/services/storage'
import type { VoiceRecording } from '@/types'

interface VoiceState {
  isRecording: boolean
  recordings: VoiceRecording[]
  selectedRecordingId: string | null
  pitchShift: number
  isTransforming: boolean
  availableVoices: VoiceInfo[]
  selectedVoiceId: string | null
  monitorEnabled: boolean
  micPermission: 'prompt' | 'granted' | 'denied'

  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  setPitchShift: (semitones: number) => void
  transformVoice: (recordingId: string) => Promise<void>
  isolateAudio: (recordingId: string) => Promise<void>
  loadVoices: () => Promise<void>
  setSelectedVoice: (voiceId: string) => void
  deleteRecording: (id: string) => void
  renameRecording: (id: string, name: string) => void
  toggleMonitor: () => void
  addRecordingToSoundLibrary: (id: string) => Promise<void>
  selectRecording: (id: string) => void
}

export const useVoiceStore = create<VoiceState>()((set, get) => ({
  isRecording: false,
  recordings: [],
  selectedRecordingId: null,
  pitchShift: 0,
  isTransforming: false,
  availableVoices: [],
  selectedVoiceId: null,
  monitorEnabled: false,
  micPermission: 'prompt' as const,

  startRecording: async () => {
    try {
      await voiceEngine.init()
      set({ micPermission: 'granted' })
    } catch {
      set({ micPermission: 'denied' })
      return
    }

    voiceEngine.setPitchShift(get().pitchShift)
    await voiceEngine.startRecording()
    set({ isRecording: true })
  },

  stopRecording: async () => {
    const { blob, url, duration } = await voiceEngine.stopRecording()

    const recording: VoiceRecording = {
      id: crypto.randomUUID(),
      name: `Recording ${get().recordings.length + 1}`,
      audioBlob: blob,
      audioUrl: url,
      duration,
      pitchShift: get().pitchShift,
      isTransformed: false,
      createdAt: Date.now(),
    }

    set((state) => ({
      isRecording: false,
      recordings: [recording, ...state.recordings],
      selectedRecordingId: recording.id,
    }))
  },

  setPitchShift: (semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones))
    set({ pitchShift: clamped })
    voiceEngine.setPitchShift(clamped)
  },

  transformVoice: async (recordingId: string) => {
    const { recordings, selectedVoiceId } = get()
    if (!selectedVoiceId) return

    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording) return

    set({ isTransforming: true })

    try {
      const result = await transformVoiceApi(recording.audioBlob, selectedVoiceId)

      set((state) => ({
        isTransforming: false,
        recordings: state.recordings.map((r) =>
          r.id === recordingId
            ? {
                ...r,
                isTransformed: true,
                transformedBlob: result.audioBlob,
                transformedUrl: result.audioUrl,
              }
            : r
        ),
      }))
    } catch {
      set({ isTransforming: false })
    }
  },

  isolateAudio: async (recordingId: string) => {
    const { recordings } = get()
    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording) return

    set({ isTransforming: true })

    try {
      const sourceBlob = recording.transformedBlob ?? recording.audioBlob
      const result = await isolateAudioApi(sourceBlob)

      set((state) => ({
        isTransforming: false,
        recordings: state.recordings.map((r) =>
          r.id === recordingId
            ? {
                ...r,
                isTransformed: true,
                transformedBlob: result.audioBlob,
                transformedUrl: result.audioUrl,
              }
            : r
        ),
      }))
    } catch {
      set({ isTransforming: false })
    }
  },

  loadVoices: async () => {
    const { availableVoices } = get()
    if (availableVoices.length > 0) return

    try {
      const voices = await listVoicesApi()
      set({ availableVoices: voices })
    } catch {
      // Silently fail — voices list is non-critical
    }
  },

  setSelectedVoice: (voiceId: string) => {
    set({ selectedVoiceId: voiceId })
  },

  deleteRecording: (id: string) => {
    const recording = get().recordings.find((r) => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.audioUrl)
      if (recording.transformedUrl) {
        URL.revokeObjectURL(recording.transformedUrl)
      }
    }
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
      selectedRecordingId:
        state.selectedRecordingId === id ? null : state.selectedRecordingId,
    }))
  },

  renameRecording: (id: string, name: string) => {
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, name } : r
      ),
    }))
  },

  toggleMonitor: () => {
    const next = !get().monitorEnabled
    set({ monitorEnabled: next })
    voiceEngine.setMonitor(next)
  },

  addRecordingToSoundLibrary: async (id: string) => {
    const recording = get().recordings.find((r) => r.id === id)
    if (!recording) return

    const blob = recording.transformedBlob ?? recording.audioBlob

    await saveSound({
      id: crypto.randomUUID(),
      name: recording.name,
      prompt: `Voice recording${recording.isTransformed ? ' (transformed)' : ''}${recording.pitchShift !== 0 ? ` pitch: ${recording.pitchShift > 0 ? '+' : ''}${recording.pitchShift} semitones` : ''}`,
      category: 'voice',
      audioBlob: blob,
      duration: recording.duration,
      isLoop: false,
      createdAt: Date.now(),
    })
  },

  selectRecording: (id: string) => {
    set({ selectedRecordingId: id })
  },
}))
