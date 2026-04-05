import { create } from 'zustand'
import { voiceEngine } from '@/engine/VoiceEngine'
import { voiceEffectsProcessor } from '@/engine/VoiceEffectsProcessor'
import {
  transformVoice as transformVoiceApi,
  isolateAudio as isolateAudioApi,
  listVoices as listVoicesApi,
  textToSpeech as textToSpeechApi,
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

  // Effects state
  effectPitch: number
  effectReverb: number
  effectReverbEnabled: boolean
  effectDelay: number
  effectDelayEnabled: boolean
  effectFilterFreq: number
  effectFilterEnabled: boolean
  effectFilterType: BiquadFilterType
  isPreviewingEffects: boolean
  isRenderingEffects: boolean

  // TTS state
  ttsText: string
  ttsStability: number
  ttsSimilarity: number
  isGeneratingTTS: boolean
  ttsResult: { blob: Blob; url: string } | null

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

  // Waveform trim
  updateRecordingAudio: (id: string, blob: Blob, url: string, duration: number) => void

  // Effects actions
  setEffectPitch: (v: number) => void
  setEffectReverb: (enabled: boolean, wet: number) => void
  setEffectDelay: (enabled: boolean, wet: number) => void
  setEffectFilter: (enabled: boolean, freq: number, type: BiquadFilterType) => void
  previewWithEffects: () => Promise<void>
  stopEffectsPreview: () => void
  saveWithEffects: () => Promise<void>

  // TTS actions
  setTtsText: (text: string) => void
  setTtsStability: (v: number) => void
  setTtsSimilarity: (v: number) => void
  generateTTS: () => Promise<void>
  clearTtsResult: () => void
  saveTtsToLibrary: () => Promise<void>
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

  // Effects defaults
  effectPitch: 0,
  effectReverb: 0.3,
  effectReverbEnabled: false,
  effectDelay: 0.2,
  effectDelayEnabled: false,
  effectFilterFreq: 2000,
  effectFilterEnabled: false,
  effectFilterType: 'lowpass' as BiquadFilterType,
  isPreviewingEffects: false,
  isRenderingEffects: false,

  // TTS defaults
  ttsText: '',
  ttsStability: 0.5,
  ttsSimilarity: 0.75,
  isGeneratingTTS: false,
  ttsResult: null,

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

  // --- Waveform trim ---

  updateRecordingAudio: (id: string, blob: Blob, url: string, duration: number) => {
    const recording = get().recordings.find((r) => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.audioUrl)
    }
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id
          ? { ...r, audioBlob: blob, audioUrl: url, duration }
          : r
      ),
    }))
  },

  // --- Effects actions ---

  setEffectPitch: (v: number) => {
    const clamped = Math.max(-12, Math.min(12, v))
    set({ effectPitch: clamped })
    voiceEffectsProcessor.setPitch(clamped)
  },

  setEffectReverb: (enabled: boolean, wet: number) => {
    set({ effectReverbEnabled: enabled, effectReverb: wet })
    voiceEffectsProcessor.setReverb(enabled, wet)
  },

  setEffectDelay: (enabled: boolean, wet: number) => {
    set({ effectDelayEnabled: enabled, effectDelay: wet })
    voiceEffectsProcessor.setDelay(enabled, wet)
  },

  setEffectFilter: (enabled: boolean, freq: number, type: BiquadFilterType) => {
    set({ effectFilterEnabled: enabled, effectFilterFreq: freq, effectFilterType: type })
    voiceEffectsProcessor.setFilter(enabled, freq, type)
  },

  previewWithEffects: async () => {
    const { selectedRecordingId, recordings } = get()
    if (!selectedRecordingId) return

    const recording = recordings.find((r) => r.id === selectedRecordingId)
    if (!recording) return

    const audioUrl = recording.transformedUrl ?? recording.audioUrl

    set({ isPreviewingEffects: true })

    try {
      await voiceEffectsProcessor.loadRecording(audioUrl)

      // Apply current effect settings
      const state = get()
      voiceEffectsProcessor.setPitch(state.effectPitch)
      voiceEffectsProcessor.setReverb(state.effectReverbEnabled, state.effectReverb)
      voiceEffectsProcessor.setDelay(state.effectDelayEnabled, state.effectDelay)
      voiceEffectsProcessor.setFilter(state.effectFilterEnabled, state.effectFilterFreq, state.effectFilterType)

      voiceEffectsProcessor.play()

      // Auto-reset after playback
      const duration = recording.duration
      setTimeout(() => {
        set({ isPreviewingEffects: false })
      }, (duration + 0.5) * 1000)
    } catch {
      set({ isPreviewingEffects: false })
    }
  },

  stopEffectsPreview: () => {
    voiceEffectsProcessor.stop()
    set({ isPreviewingEffects: false })
  },

  saveWithEffects: async () => {
    const { selectedRecordingId, recordings } = get()
    if (!selectedRecordingId) return

    const recording = recordings.find((r) => r.id === selectedRecordingId)
    if (!recording) return

    const audioUrl = recording.transformedUrl ?? recording.audioUrl

    set({ isRenderingEffects: true })

    try {
      await voiceEffectsProcessor.loadRecording(audioUrl)

      // Apply current effect settings
      const state = get()
      voiceEffectsProcessor.setPitch(state.effectPitch)
      voiceEffectsProcessor.setReverb(state.effectReverbEnabled, state.effectReverb)
      voiceEffectsProcessor.setDelay(state.effectDelayEnabled, state.effectDelay)
      voiceEffectsProcessor.setFilter(state.effectFilterEnabled, state.effectFilterFreq, state.effectFilterType)

      const blob = await voiceEffectsProcessor.renderWithEffects()

      await saveSound({
        id: crypto.randomUUID(),
        name: `${recording.name} (FX)`,
        prompt: `Voice recording with effects (pitch: ${state.effectPitch}, reverb: ${state.effectReverbEnabled ? state.effectReverb : 'off'}, delay: ${state.effectDelayEnabled ? state.effectDelay : 'off'}, filter: ${state.effectFilterEnabled ? `${state.effectFilterFreq}Hz ${state.effectFilterType}` : 'off'})`,
        category: 'voice',
        audioBlob: blob,
        duration: recording.duration,
        isLoop: false,
        createdAt: Date.now(),
      })

      set({ isRenderingEffects: false })
    } catch {
      set({ isRenderingEffects: false })
    }
  },

  // --- TTS actions ---

  setTtsText: (text: string) => {
    set({ ttsText: text })
  },

  setTtsStability: (v: number) => {
    set({ ttsStability: Math.max(0, Math.min(1, v)) })
  },

  setTtsSimilarity: (v: number) => {
    set({ ttsSimilarity: Math.max(0, Math.min(1, v)) })
  },

  generateTTS: async () => {
    const { ttsText, selectedVoiceId, ttsStability, ttsSimilarity, ttsResult } = get()
    if (!ttsText.trim() || !selectedVoiceId) return

    // Clean up previous result
    if (ttsResult) {
      URL.revokeObjectURL(ttsResult.url)
    }

    set({ isGeneratingTTS: true, ttsResult: null })

    try {
      const result = await textToSpeechApi(
        ttsText,
        selectedVoiceId,
        ttsStability,
        ttsSimilarity
      )

      set({
        isGeneratingTTS: false,
        ttsResult: { blob: result.audioBlob, url: result.audioUrl },
      })
    } catch {
      set({ isGeneratingTTS: false })
    }
  },

  clearTtsResult: () => {
    const { ttsResult } = get()
    if (ttsResult) {
      URL.revokeObjectURL(ttsResult.url)
    }
    set({ ttsResult: null })
  },

  saveTtsToLibrary: async () => {
    const { ttsResult, ttsText } = get()
    if (!ttsResult) return

    // Get approximate duration from blob/audio
    const audioEl = new Audio(ttsResult.url)
    await new Promise<void>((resolve) => {
      audioEl.onloadedmetadata = () => resolve()
      audioEl.onerror = () => resolve()
    })
    const duration = audioEl.duration || 1

    await saveSound({
      id: crypto.randomUUID(),
      name: ttsText.slice(0, 30) || 'TTS Sound',
      prompt: `Text-to-speech: "${ttsText}"`,
      category: 'voice',
      audioBlob: ttsResult.blob,
      duration,
      isLoop: false,
      createdAt: Date.now(),
    })
  },
}))
