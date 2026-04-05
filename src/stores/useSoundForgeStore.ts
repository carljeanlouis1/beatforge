import { create } from 'zustand'
import { generateSound } from '@/services/elevenlabs'

interface SoundForgeState {
  prompt: string
  duration: number
  loop: boolean
  promptInfluence: number
  category: string

  isGenerating: boolean
  generatedAudioUrl: string | null
  generatedBlob: Blob | null
  error: string | null

  setPrompt: (prompt: string) => void
  setDuration: (duration: number) => void
  setLoop: (loop: boolean) => void
  setPromptInfluence: (influence: number) => void
  setCategory: (category: string) => void
  generate: () => Promise<void>
  reset: () => void
}

export const useSoundForgeStore = create<SoundForgeState>()((set, get) => ({
  prompt: '',
  duration: 2,
  loop: false,
  promptInfluence: 0.4,
  category: 'drums',

  isGenerating: false,
  generatedAudioUrl: null,
  generatedBlob: null,
  error: null,

  setPrompt: (prompt: string) => set({ prompt }),
  setDuration: (duration: number) => set({ duration }),
  setLoop: (loop: boolean) => set({ loop }),
  setPromptInfluence: (influence: number) => set({ promptInfluence: influence }),
  setCategory: (category: string) => set({ category }),

  generate: async () => {
    const { prompt, duration, loop, promptInfluence, category } = get()
    if (!prompt.trim()) return

    // Revoke old audio URL if it exists
    const oldUrl = get().generatedAudioUrl
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }

    set({
      isGenerating: true,
      generatedAudioUrl: null,
      generatedBlob: null,
      error: null,
    })

    try {
      const result = await generateSound({
        text: prompt.trim(),
        duration_seconds: duration,
        prompt_influence: promptInfluence,
        loop,
        category,
      })

      set({
        isGenerating: false,
        generatedAudioUrl: result.audioUrl,
        generatedBlob: result.audioBlob,
      })
    } catch (err) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : 'Failed to generate sound',
      })
    }
  },

  reset: () => {
    const oldUrl = get().generatedAudioUrl
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }
    set({
      prompt: '',
      duration: 2,
      loop: false,
      promptInfluence: 0.4,
      category: 'drums',
      isGenerating: false,
      generatedAudioUrl: null,
      generatedBlob: null,
      error: null,
    })
  },
}))
