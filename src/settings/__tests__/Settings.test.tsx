import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '../Settings'
import type { AppSettings } from '@/lib/types'

const defaultSettings: AppSettings = {
  claudePath: '/usr/local/bin/claude',
  masteryWeights: {
    problemAccuracy: 0.4,
    explainGrade: 0.3,
    capstone: 0.2,
    retention: 0.1,
  },
  dataDir: '~/.stem',
  theme: 'dark',
}

const mockStore = {
  settings: { ...defaultSettings },
  dirty: false,
  loading: false,
  load: vi.fn().mockResolvedValue(undefined),
  update: vi.fn(),
  persist: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@/app/store', () => ({
  useSettingsStore: () => mockStore,
  useNotesStore: () => ({}),
  useSessionStore: () => ({}),
  useCurriculumStore: () => ({}),
  useNavStore: () => ({}),
  useReviewStore: () => ({}),
}))

vi.mock('@/lib/tauri', () => ({
  claudeProbe: vi.fn().mockResolvedValue({ found: true, path: '/usr/local/bin/claude', version: '1.5.0' }),
  exportBackup: vi.fn().mockResolvedValue('/home/user/.stem/backup.zip'),
  resetAllData: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue({
    claudePath: '/usr/local/bin/claude',
    masteryWeights: { problemAccuracy: 0.4, explainGrade: 0.3, capstone: 0.2, retention: 0.1 },
    dataDir: '~/.stem',
    theme: 'dark',
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  mockStore.settings = { ...defaultSettings }
  mockStore.dirty = false
  vi.clearAllMocks()
})

describe('Settings', () => {
  it('renders Settings heading', () => {
    render(<Settings />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders Claude CLI section', () => {
    render(<Settings />)
    expect(screen.getByText('Claude CLI')).toBeInTheDocument()
  })

  it('renders claude path input with current value', () => {
    render(<Settings />)
    const input = screen.getByDisplayValue('/usr/local/bin/claude')
    expect(input).toBeInTheDocument()
  })

  it('renders Auto-detect button', () => {
    render(<Settings />)
    expect(screen.getByText('Auto-detect')).toBeInTheDocument()
  })

  it('calls claudeProbe when Auto-detect is clicked', async () => {
    const { claudeProbe } = await import('@/lib/tauri')
    render(<Settings />)
    fireEvent.click(screen.getByText('Auto-detect'))
    await waitFor(() => expect(claudeProbe).toHaveBeenCalled())
  })

  it('renders Mastery weights section', () => {
    render(<Settings />)
    expect(screen.getByText('Mastery weights')).toBeInTheDocument()
  })

  it('renders all four weight labels', () => {
    render(<Settings />)
    expect(screen.getByText('Problem accuracy')).toBeInTheDocument()
    expect(screen.getByText('Explain / derive')).toBeInTheDocument()
    expect(screen.getByText('Capstone projects')).toBeInTheDocument()
    expect(screen.getByText('Spaced retention')).toBeInTheDocument()
  })

  it('shows total weight sum', () => {
    render(<Settings />)
    expect(screen.getByText(/current: 1.00/)).toBeInTheDocument()
  })

  it('renders Data section', () => {
    render(<Settings />)
    expect(screen.getByText('Data')).toBeInTheDocument()
  })

  it('renders Export backup button', () => {
    render(<Settings />)
    expect(screen.getByText('Export backup')).toBeInTheDocument()
  })

  it('renders Reset all data button', () => {
    render(<Settings />)
    expect(screen.getByText('Reset all data…')).toBeInTheDocument()
  })

  it('shows confirmation when Reset is clicked', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('Reset all data…'))
    expect(screen.getByText(/All data will be permanently deleted/)).toBeInTheDocument()
    expect(screen.getByText(/Yes, reset everything/)).toBeInTheDocument()
  })

  it('hides reset confirm when Cancel is clicked', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('Reset all data…'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/All data will be permanently deleted/)).not.toBeInTheDocument()
  })

  it('Save changes button is disabled when not dirty', () => {
    mockStore.dirty = false
    render(<Settings />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeDisabled()
  })

  it('Save changes button is enabled when dirty', () => {
    mockStore.dirty = true
    render(<Settings />)
    expect(screen.getByText('Save changes')).not.toBeDisabled()
  })

  it('calls persist when Save changes is clicked', () => {
    mockStore.dirty = true
    render(<Settings />)
    fireEvent.click(screen.getByText('Save changes'))
    expect(mockStore.persist).toHaveBeenCalled()
  })
})
