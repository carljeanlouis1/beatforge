import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOTAL_STEPS = 10

interface WalkthroughState {
  isOpen: boolean
  currentStep: number
  hasSeenTour: boolean

  open: () => void
  close: () => void
  next: () => void
  prev: () => void
  skipToEnd: () => void
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      currentStep: 0,
      hasSeenTour: false,

      open: () => set({ isOpen: true, currentStep: 0 }),

      close: () => set({ isOpen: false, hasSeenTour: true }),

      next: () => {
        const { currentStep } = get()
        if (currentStep < TOTAL_STEPS - 1) {
          set({ currentStep: currentStep + 1 })
        } else {
          set({ isOpen: false, hasSeenTour: true })
        }
      },

      prev: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      skipToEnd: () => set({ isOpen: false, hasSeenTour: true }),
    }),
    {
      name: 'beatforge-walkthrough',
      partialize: (state) => ({
        hasSeenTour: state.hasSeenTour,
      }),
    }
  )
)
