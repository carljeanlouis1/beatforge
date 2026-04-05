import { create } from 'zustand'
import {
  saveSound,
  getAllSounds,
  deleteSound,
  renameSound as renameStoredSound,
} from '@/services/storage'
import type { StoredSound } from '@/types'

interface SoundLibraryState {
  sounds: StoredSound[]
  isLoading: boolean

  loadSounds: () => Promise<void>
  addSound: (sound: Omit<StoredSound, 'id' | 'createdAt'>) => Promise<void>
  removeSound: (id: string) => Promise<void>
  renameSound: (id: string, name: string) => Promise<void>
}

export const useSoundLibraryStore = create<SoundLibraryState>()((set) => ({
  sounds: [],
  isLoading: false,

  loadSounds: async () => {
    set({ isLoading: true })
    try {
      const sounds = await getAllSounds()
      set({ sounds, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addSound: async (soundData) => {
    const sound: StoredSound = {
      ...soundData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    await saveSound(sound)
    set((state) => ({
      sounds: [sound, ...state.sounds],
    }))
  },

  removeSound: async (id: string) => {
    await deleteSound(id)
    set((state) => ({
      sounds: state.sounds.filter((s) => s.id !== id),
    }))
  },

  renameSound: async (id: string, name: string) => {
    await renameStoredSound(id, name)
    set((state) => ({
      sounds: state.sounds.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    }))
  },
}))
