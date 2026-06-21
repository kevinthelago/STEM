import { create } from 'zustand'
import { getSettings, saveSettings } from '@/lib/tauri'
import type { AppSettings } from '@/lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  claudePath: '',
  masteryWeights: {
    problemAccuracy: 0.4,
    explainGrade: 0.3,
    capstone: 0.2,
    retention: 0.1,
  },
  dataDir: '',
  theme: 'dark',
}

interface SettingsState {
  settings: AppSettings
  dirty: boolean
  loading: boolean

  load(): Promise<void>
  update(patch: Partial<AppSettings>): void
  persist(): Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  dirty: false,
  loading: false,

  async load() {
    set({ loading: true })
    try {
      const settings = await getSettings()
      set({ settings, loading: false, dirty: false })
    } catch {
      set({ loading: false })
    }
  },

  update(patch) {
    set((s) => ({ settings: { ...s.settings, ...patch }, dirty: true }))
  },

  async persist() {
    await saveSettings(get().settings)
    set({ dirty: false })
  },
}))
