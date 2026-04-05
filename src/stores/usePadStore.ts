import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { drumEngine } from '@/engine/DrumEngine'
import { DRUM_SOUNDS, PAD_COLORS } from '@/utils/constants'
import type { GridSize, PadConfig, PadBank, PadMode } from '@/types'

interface PadState {
  gridSize: GridSize
  pads: PadConfig[]
  currentBank: number
  banks: PadBank[]
  activePadIds: string[]

  triggerPad: (padId: string) => void
  setPadSound: (padId: string, soundId: string) => void
  setPadVolume: (padId: string, volume: number) => void
  setPadColor: (padId: string, color: string) => void
  setPadMode: (padId: string, mode: PadMode) => void
  setGridSize: (size: GridSize) => void
  switchBank: (bankIndex: number) => void
}

function createDefaultPads(): PadConfig[] {
  return DRUM_SOUNDS.map((sound, i) => ({
    id: `pad-${i}`,
    soundId: sound.id,
    label: sound.label,
    color: PAD_COLORS[i % PAD_COLORS.length],
    volume: 80,
    mode: 'one-shot' as PadMode,
  }))
}

function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity
  // Map 0-100 to -60db to 0db
  return -60 + (volume / 100) * 60
}

export const usePadStore = create<PadState>()(
  persist(
    (set, get) => ({
      gridSize: 4 as GridSize,
      pads: createDefaultPads(),
      currentBank: 0,
      banks: [
        { id: 'bank-0', name: 'Bank A', pads: createDefaultPads() },
      ],
      activePadIds: [],

      triggerPad: (padId: string) => {
        const pad = get().pads.find((p) => p.id === padId)
        if (!pad) return

        // Initialize DrumEngine lazily if needed
        if (!drumEngine.isInitialized) {
          drumEngine.init()
        }

        drumEngine.trigger(pad.soundId, volumeToDb(pad.volume))

        // Visual feedback: add pad to active list, remove after 150ms
        set((state) => ({
          activePadIds: [...state.activePadIds, padId],
        }))

        setTimeout(() => {
          set((state) => ({
            activePadIds: state.activePadIds.filter((id) => id !== padId),
          }))
        }, 150)
      },

      setPadSound: (padId: string, soundId: string) => {
        const sound = DRUM_SOUNDS.find((s) => s.id === soundId)
        set((state) => ({
          pads: state.pads.map((p) =>
            p.id === padId
              ? { ...p, soundId, label: sound?.label ?? soundId }
              : p
          ),
        }))
      },

      setPadVolume: (padId: string, volume: number) => {
        set((state) => ({
          pads: state.pads.map((p) =>
            p.id === padId ? { ...p, volume } : p
          ),
        }))
      },

      setPadColor: (padId: string, color: string) => {
        set((state) => ({
          pads: state.pads.map((p) =>
            p.id === padId ? { ...p, color } : p
          ),
        }))
      },

      setPadMode: (padId: string, mode: PadMode) => {
        set((state) => ({
          pads: state.pads.map((p) =>
            p.id === padId ? { ...p, mode } : p
          ),
        }))
      },

      setGridSize: (size: GridSize) => {
        const currentPads = get().pads
        const totalPads = size * size
        let pads: PadConfig[]

        if (totalPads <= currentPads.length) {
          pads = currentPads.slice(0, totalPads)
        } else {
          // Extend pads array for larger grids
          const extra: PadConfig[] = []
          for (let i = currentPads.length; i < totalPads; i++) {
            const sound = DRUM_SOUNDS[i % DRUM_SOUNDS.length]
            extra.push({
              id: `pad-${i}`,
              soundId: sound.id,
              label: sound.label,
              color: PAD_COLORS[i % PAD_COLORS.length],
              volume: 80,
              mode: 'one-shot',
            })
          }
          pads = [...currentPads, ...extra]
        }

        set({ gridSize: size, pads })
      },

      switchBank: (bankIndex: number) => {
        const { banks, pads, currentBank } = get()

        // Save current pads to current bank
        const updatedBanks = banks.map((bank, i) =>
          i === currentBank ? { ...bank, pads: [...pads] } : bank
        )

        // Create bank if it doesn't exist
        while (updatedBanks.length <= bankIndex) {
          updatedBanks.push({
            id: `bank-${updatedBanks.length}`,
            name: `Bank ${String.fromCharCode(65 + updatedBanks.length)}`,
            pads: createDefaultPads(),
          })
        }

        set({
          banks: updatedBanks,
          currentBank: bankIndex,
          pads: updatedBanks[bankIndex].pads,
        })
      },
    }),
    {
      name: 'beatforge-pads',
      partialize: (state) => ({
        gridSize: state.gridSize,
        pads: state.pads,
        currentBank: state.currentBank,
        banks: state.banks,
      }),
    }
  )
)
