import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePadStore } from '@/stores/usePadStore'
import { saveKit, getAllKits, deleteKit as deleteStoredKit } from '@/services/storage'
import { DRUM_SOUNDS, PAD_COLORS } from '@/utils/constants'
import type { CustomDrumKit, KitSound } from '@/types'

interface CustomKitState {
  kits: CustomDrumKit[]
  activeKitId: string | null
  defaultKit: KitSound[]

  saveCurrentAsKit: (name: string) => Promise<void>
  loadKit: (kitId: string) => void
  deleteKit: (kitId: string) => Promise<void>
  renameKit: (kitId: string, name: string) => Promise<void>
  restoreDefaults: () => void
  initDefaultKit: () => void
  loadKitsFromStorage: () => Promise<void>
}

function padConfigToKitSound(pad: { soundId: string; label: string; color: string; customAudioId?: string }, index: number): KitSound {
  const isBuiltin = DRUM_SOUNDS.some((s) => s.id === pad.soundId)
  const isVoice = pad.soundId.startsWith('voice-')
  let sourceType: KitSound['sourceType'] = 'builtin'
  if (!isBuiltin) {
    sourceType = isVoice ? 'recorded' : 'ai-generated'
  }

  return {
    padIndex: index,
    soundId: pad.soundId,
    label: pad.label,
    color: pad.color,
    sourceType,
    storedSoundId: pad.customAudioId,
  }
}

export const useCustomKitStore = create<CustomKitState>()(
  persist(
    (set, get) => ({
      kits: [],
      activeKitId: null,
      defaultKit: [],

      initDefaultKit: () => {
        const { defaultKit } = get()
        if (defaultKit.length > 0) return

        const defaults: KitSound[] = DRUM_SOUNDS.map((sound, i) => ({
          padIndex: i,
          soundId: sound.id,
          label: sound.label,
          color: PAD_COLORS[i % PAD_COLORS.length],
          sourceType: 'builtin' as const,
        }))

        set({ defaultKit: defaults })
      },

      loadKitsFromStorage: async () => {
        try {
          const kits = await getAllKits()
          set({ kits })
        } catch {
          // Storage may be empty on first load
        }
      },

      saveCurrentAsKit: async (name: string) => {
        const pads = usePadStore.getState().pads
        const sounds: KitSound[] = pads.map((pad, i) => padConfigToKitSound(pad, i))

        const kit: CustomDrumKit = {
          id: crypto.randomUUID(),
          name,
          sounds,
          createdAt: Date.now(),
        }

        await saveKit(kit)
        set((state) => ({
          kits: [kit, ...state.kits],
          activeKitId: kit.id,
        }))
      },

      loadKit: (kitId: string) => {
        const kit = get().kits.find((k) => k.id === kitId)
        if (!kit) return

        usePadStore.setState((state) => ({
          pads: state.pads.map((pad, i) => {
            const kitSound = kit.sounds.find((s) => s.padIndex === i)
            if (!kitSound) return pad
            return {
              ...pad,
              soundId: kitSound.soundId,
              label: kitSound.label,
              color: kitSound.color,
              customAudioId: kitSound.storedSoundId,
            }
          }),
        }))

        set({ activeKitId: kitId })
      },

      deleteKit: async (kitId: string) => {
        await deleteStoredKit(kitId)
        set((state) => ({
          kits: state.kits.filter((k) => k.id !== kitId),
          activeKitId: state.activeKitId === kitId ? null : state.activeKitId,
        }))
      },

      renameKit: async (kitId: string, name: string) => {
        const kit = get().kits.find((k) => k.id === kitId)
        if (!kit) return

        const updated = { ...kit, name }
        await saveKit(updated)
        set((state) => ({
          kits: state.kits.map((k) => (k.id === kitId ? updated : k)),
        }))
      },

      restoreDefaults: () => {
        const { defaultKit } = get()
        if (defaultKit.length === 0) return

        usePadStore.setState((state) => ({
          pads: state.pads.map((pad, i) => {
            const defaultSound = defaultKit.find((s) => s.padIndex === i)
            if (!defaultSound) return pad
            return {
              ...pad,
              soundId: defaultSound.soundId,
              label: defaultSound.label,
              color: defaultSound.color,
              customAudioId: undefined,
            }
          }),
        }))

        set({ activeKitId: null })
      },
    }),
    {
      name: 'beatforge-custom-kits',
      partialize: (state) => ({
        kits: state.kits,
        activeKitId: state.activeKitId,
        defaultKit: state.defaultKit,
      }),
    }
  )
)
