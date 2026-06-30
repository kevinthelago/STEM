import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ResearchMode } from '../ResearchMode'
import type { SessionInfo, ChatMessage, Topic } from '@/lib/types'

// ── fixtures ──────────────────────────────────────────────────────────────────

const SESSION: SessionInfo = { id: 'sess-r1', topicId: 'topic-eigen', turnCount: 1, isActive: true }

const TOPIC: Topic = {
  id: 'topic-eigen',
  subjectId: 'subj-linalg',
  title: 'Eigenvectors',
  masteryScore: 55,
  masteryLevel: 'learning',
  prerequisites: [],
  isCapstone: false,
}

const TUTOR_MSG: ChatMessage = {
  id: 'm1',
  role: 'tutor',
  content: 'Eigenvectors are special vectors that only scale under a transformation.',
  isStreaming: false,
}

const STREAMING_MSG: ChatMessage = { ...TUTOR_MSG, id: 'm2', content: 'Thinking…', isStreaming: true }

const USER_MSG: ChatMessage = {
  id: 'm3',
  role: 'user',
  content: 'Tell me more about eigenvectors.',
  isStreaming: false,
}

// ── mutable store state ───────────────────────────────────────────────────────

const storeState = {
  sessions: {} as Record<string, SessionInfo>,
  messages: {} as Record<string, ChatMessage[]>,
  ensureSession: vi.fn(),
  appendUserMessage: vi.fn(),
}

const curriculumState = {
  topicsBySubject: { 'subj-linalg': [TOPIC] } as Record<string, Topic[]>,
}

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/app/store', () => ({
  useSessionStore: (sel?: (s: typeof storeState) => unknown) =>
    sel ? sel(storeState) : storeState,
  useCurriculumStore: () => curriculumState,
  useNavStore: () => ({ view: { type: 'mode', mode: 'research', topicId: 'topic-eigen' }, navigateTo: vi.fn() }),
  useNotesStore: () => ({}),
  useSettingsStore: () => ({}),
  useReviewStore: () => ({}),
}))

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
  storeState.sessions = { 'sess-r1': SESSION }
  storeState.messages = {}
  storeState.ensureSession.mockResolvedValue(SESSION)
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ResearchMode — header', () => {
  it('renders the topic title with Research prefix', () => {
    render(<ResearchMode topicId="topic-eigen" />)
    expect(screen.getByText('Research: Eigenvectors')).toBeInTheDocument()
  })

  it('shows the free exploration badge', () => {
    render(<ResearchMode topicId="topic-eigen" />)
    expect(screen.getByText('free exploration')).toBeInTheDocument()
  })

  it('shows claude · pty badge once session is set', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText(/claude · pty/i)).toBeInTheDocument(),
    )
  })
})

describe('ResearchMode — empty state', () => {
  it('shows the explore prompt when no messages', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText(/ask anything/i)).toBeInTheDocument(),
    )
  })

  it('renders the input textarea', () => {
    render(<ResearchMode topicId="topic-eigen" />)
    expect(screen.getByPlaceholderText(/explore freely/i)).toBeInTheDocument()
  })
})

describe('ResearchMode — messages', () => {
  beforeEach(() => {
    storeState.messages = { 'sess-r1': [TUTOR_MSG, USER_MSG] }
  })

  it('renders tutor message content', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText(/Eigenvectors are special vectors/i)).toBeInTheDocument(),
    )
  })

  it('renders user message content', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText('Tell me more about eigenvectors.')).toBeInTheDocument(),
    )
  })

  it('hides the explore prompt when messages exist', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.queryByText(/ask anything/i)).not.toBeInTheDocument(),
    )
  })
})

describe('ResearchMode — streaming', () => {
  beforeEach(() => {
    storeState.messages = { 'sess-r1': [STREAMING_MSG] }
  })

  it('shows streaming indicator', async () => {
    render(<ResearchMode topicId="topic-eigen" />)
    await waitFor(() =>
      expect(screen.getByText('streaming')).toBeInTheDocument(),
    )
  })
})
