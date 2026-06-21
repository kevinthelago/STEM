import { create } from 'zustand'
import type { ActiveView, AppMode } from '@/lib/types'

interface NavState {
  view: ActiveView
  reviewDueCount: number

  navigateTo(view: ActiveView): void
  setMode(mode: AppMode): void
  setReviewDueCount(n: number): void
}

export const useNavStore = create<NavState>((set, get) => ({
  view: { type: 'dashboard' },
  reviewDueCount: 0,

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
}))
