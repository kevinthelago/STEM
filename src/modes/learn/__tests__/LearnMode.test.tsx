import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LearnMode } from '../LearnMode'
import type { SessionInfo, ChatMessage, Topic } from '@/lib/types'

// ── fixtures ──────────────────────────────────────────────────────────────────

const SESSION: SessionInfo = { id: 'sess-1', topicId: 'topic-eigen', turnCount: 3, isActive: true }

const TOPIC: Topic = {
  id: 'topic-eigen',
  subjectId: 'subj-linalg',
  title: 'Eigenvectors',
  masteryScore: 42,
  masteryLevel: 'learning',
  prerequisites: [],
  isCapstone: false,
}

const TUTOR_MSG: ChatMessage = { id: 'm1', role: 'tutor', content: 'An eigenvector satisfies Av = λv.', isStreaming: false }
const USER_MSG: ChatMessage = { id: 'm2', role: 'user', content: 'What is an eigenvector?', isStreaming: false }
const STREAMING_MSG: ChatMessage = { id: 'm3', role: 'tutor', content: 'Streaming…', isStreaming: true }

// ── mutable store state (mutated in beforeEach, read by the mock factory) ────

const storeState = {
  sessions: {} as Record<string, SessionInfo>,
  messages: {} as Record<string, ChatMessage[]>,
  ensureSession: vi.fn(),
  appendUserMessage: vi.fn(),
  setPendingViz: vi.fn(),
}

const curriculumState = {
  topicsBySubject: { 'subj-linalg': [TOPIC] } as Record<string, Topic[]>,
}

const navState = {
  view: { type: 'mode' as const, mode: 'learn' as const, topicId: 'topic-eigen' },
  navigateTo: vi.fn(),
}

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/app/store', () => {
  function useSessionStore(sel?: (s: typeof storeState) => unknown) {
    return sel ? sel(storeState) : storeState
  }
  useSessionStore.getState = () => storeState
  return {
    useSessionStore,
    useCurriculumStore: () => curriculumState,
    useNavStore: () => navState,
    useNotesStore: () => ({}),
    useSettingsStore: () => ({}),
    useReviewStore: () => ({}),
  }
})

vi.mock('@/lib/tauri', () => ({
  sendLearnMessage: vi.fn(),
  ensureSession: vi.fn(),
}))

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  const tauri = await import('@/lib/tauri')
  vi.clearAllMocks()
  vi.mocked(tauri.sendLearnMessage).mockResolvedValue(undefined)
  vi.mocked(tauri.ensureSession).mockResolvedValue(SESSION)
  storeState.sessions = { 'sess-1': SESSION }
  storeState.messages = {}
  storeState.ensureSession.mockResolvedValue(SESSION)
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LearnMode — header', () => {
  it('renders the topic title', () => {
    render(<LearnMode topicId="topic-eigen" />)
    expect(screen.getByText('Eigenvectors')).toBeInTheDocument()
  })

  it('shows mastery score', () => {
    render(<LearnMode topicId="topic-eigen" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows claude · pty badge', () => {
    render(<LearnMode topicId="topic-eigen" />)
    expect(screen.getByText(/claude · pty/i)).toBeInTheDocument()
  })
})

describe('LearnMode — empty state', () => {
  it('shows empty conversation prompt', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument(),
    )
  })

  it('renders the input textarea', () => {
    render(<LearnMode topicId="topic-eigen" />)
    expect(screen.getByPlaceholderText(/ask a follow-up/i)).toBeInTheDocument()
  })

  it('renders the explain-check trigger', () => {
    render(<LearnMode topicId="topic-eigen" />)
    expect(screen.getByText('+ Explain-check')).toBeInTheDocument()
  })
})

describe('LearnMode — messages', () => {
  beforeEach(() => {
    storeState.messages = { 'sess-1': [TUTOR_MSG, USER_MSG] }
  })

  it('renders tutor message content', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText(/An eigenvector satisfies/i)).toBeInTheDocument(),
    )
  })

  it('renders user message content', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText('What is an eigenvector?')).toBeInTheDocument(),
    )
  })

  it('hides empty-state prompt when messages exist', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.queryByText(/start a conversation/i)).not.toBeInTheDocument(),
    )
  })
})

describe('LearnMode — streaming', () => {
  beforeEach(() => {
    storeState.messages = { 'sess-1': [STREAMING_MSG] }
  })

  it('hides empty-state prompt when streaming', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.queryByText(/start a conversation/i)).not.toBeInTheDocument(),
    )
  })
})

describe('LearnMode — dead session', () => {
  it('shows session-ended state after send error', async () => {
    const { sendLearnMessage } = await import('@/lib/tauri')
    vi.mocked(sendLearnMessage).mockRejectedValueOnce(new Error('PTY closed'))

    render(<LearnMode topicId="topic-eigen" />)

    // Wait for session to be established (indicated by "session active" text)
    await waitFor(() =>
      expect(screen.getByText(/session active/i)).toBeInTheDocument(),
    )

    const textarea = screen.getByPlaceholderText(/ask a follow-up/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await waitFor(() =>
      expect(screen.getByText('Session ended')).toBeInTheDocument(),
    )
  })
})

describe('LearnMode — explain-check', () => {
  it('opens explain-check panel on trigger click', async () => {
    render(<LearnMode topicId="topic-eigen" />)
    fireEvent.click(screen.getByText('+ Explain-check'))
    await waitFor(() =>
      expect(screen.getByText(/explain in your own words/i)).toBeInTheDocument(),
    )
  })
})
