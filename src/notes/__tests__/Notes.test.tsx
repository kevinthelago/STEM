import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Notes } from '../Notes'
import type { Note } from '@/lib/types'

const note1: Note = { id: 'n1', topicId: null, content: 'First note content', createdAt: 1000000, updatedAt: 1000001 }
const note2: Note = { id: 'n2', topicId: null, content: 'Second note content', createdAt: 1000002, updatedAt: 1000003 }

// Mock the notes store
const mockStore = {
  notes: [] as Note[],
  searchResults: null as Note[] | null,
  searchQuery: '',
  activeNoteId: null as string | null,
  loading: false,
  loadNotes: vi.fn().mockResolvedValue(undefined),
  search: vi.fn().mockResolvedValue(undefined),
  clearSearch: vi.fn(),
  save: vi.fn().mockResolvedValue(note1),
  remove: vi.fn().mockResolvedValue(undefined),
  setActiveNote: vi.fn(),
}

vi.mock('@/app/store', () => ({
  useNotesStore: () => mockStore,
  useSessionStore: () => ({ sessions: {}, messages: {}, ensureSession: vi.fn() }),
  useCurriculumStore: () => ({ subjects: [], topicsBySubject: {} }),
  useNavStore: () => ({ view: { type: 'notes' }, navigateTo: vi.fn() }),
  useSettingsStore: () => ({ settings: { claudePath: '', masteryWeights: { problemAccuracy: 0.4, explainGrade: 0.3, capstone: 0.2, retention: 0.1 }, dataDir: '', theme: 'dark' }, dirty: false, load: vi.fn(), update: vi.fn(), persist: vi.fn() }),
  useReviewStore: () => ({ dueItems: [], sessionActive: false }),
}))

beforeEach(() => {
  mockStore.notes = []
  mockStore.searchResults = null
  mockStore.searchQuery = ''
  mockStore.activeNoteId = null
  mockStore.loading = false
  vi.clearAllMocks()
})

describe('Notes — empty state', () => {
  it('renders "No notes yet" when notes list is empty', () => {
    render(<Notes />)
    expect(screen.getByText('No notes yet')).toBeInTheDocument()
  })

  it('renders "Select a note or create a new one" in editor area', () => {
    render(<Notes />)
    expect(screen.getByText(/select a note or create a new one/i)).toBeInTheDocument()
  })

  it('renders New note button', () => {
    render(<Notes />)
    expect(screen.getByText('+ New note')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<Notes />)
    expect(screen.getByPlaceholderText('Search notes…')).toBeInTheDocument()
  })

  it('calls loadNotes on mount', () => {
    render(<Notes />)
    expect(mockStore.loadNotes).toHaveBeenCalledWith(null)
  })

  it('passes topicId to loadNotes when provided', () => {
    render(<Notes topicId="calculus/derivatives" />)
    expect(mockStore.loadNotes).toHaveBeenCalledWith('calculus/derivatives')
  })
})

describe('Notes — with notes', () => {
  beforeEach(() => {
    mockStore.notes = [note1, note2]
  })

  it('renders note list items', () => {
    render(<Notes />)
    expect(screen.getByText('First note content')).toBeInTheDocument()
    expect(screen.getByText('Second note content')).toBeInTheDocument()
  })

  it('selects a note on click', () => {
    render(<Notes />)
    fireEvent.click(screen.getByText('First note content'))
    expect(mockStore.setActiveNote).toHaveBeenCalledWith('n1')
  })
})

describe('Notes — active note', () => {
  beforeEach(() => {
    mockStore.notes = [note1]
    mockStore.activeNoteId = 'n1'
  })

  it('shows Edit / Preview tabs when a note is active', () => {
    render(<Notes />)
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('shows Delete button when a note is active', () => {
    render(<Notes />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls remove when Delete is clicked', () => {
    render(<Notes />)
    fireEvent.click(screen.getByText('Delete'))
    expect(mockStore.remove).toHaveBeenCalledWith('n1')
  })
})

describe('Notes — search', () => {
  it('calls search when search input changes', () => {
    render(<Notes />)
    fireEvent.change(screen.getByPlaceholderText('Search notes…'), {
      target: { value: 'eigenvalues' },
    })
    expect(mockStore.search).toHaveBeenCalledWith('eigenvalues')
  })

  it('calls clearSearch when search is cleared', () => {
    mockStore.searchQuery = 'eigenvalues'
    render(<Notes />)
    fireEvent.change(screen.getByPlaceholderText('Search notes…'), {
      target: { value: '' },
    })
    expect(mockStore.clearSearch).toHaveBeenCalled()
  })

  it('shows "No results" when search returns empty', () => {
    mockStore.searchResults = []
    mockStore.searchQuery = 'xyz'
    render(<Notes />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})

describe('Notes — loading', () => {
  it('shows Loading… while notes are loading', () => {
    mockStore.loading = true
    render(<Notes />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
