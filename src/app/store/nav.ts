import { create } from 'zustand'
import type { ActiveView, AppMode } from '@/lib/types'

interface NavState {
  view: ActiveView
  reviewDueCount: number
  commandPaletteOpen: boolean

  navigateTo(view: ActiveView): void
  setMode(mode: AppMode): void
  setReviewDueCount(n: number): void
  openCommandPalette(): void
  closeCommandPalette(): void
}

export const useNavStore = create<NavState>((set, get) => ({
  view: { type: 'dashboard' },
  reviewDueCount: 0,
  commandPaletteOpen: false,

  navigateTo(view) {
    set({ view })
  },

  setMode(mode) {
    const current = get().view
    if (current.type === 'mode') {
      set({ view: { ...current, mode } })
    }
  },

  setReviewDueCount(n) {
    set({ reviewDueCount: n })
  },

  openCommandPalette() {
    set({ commandPaletteOpen: true })
  },

  closeCommandPalette() {
    set({ commandPaletteOpen: false })
  },
}))
