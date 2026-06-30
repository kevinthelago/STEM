import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PracticeMode } from '../PracticeMode'
import type { SessionInfo, Problem, Grade, Topic } from '@/lib/types'

// ── fixtures ──────────────────────────────────────────────────────────────────

const SESSION: SessionInfo = { id: 'sess-p1', topicId: 'topic-det', turnCount: 0, isActive: true }

const TOPIC: Topic = {
  id: 'topic-det',
  subjectId: 'subj-linalg',
  title: 'Determinants',
  masteryScore: 60,
  masteryLevel: 'proficient',
  prerequisites: [],
  isCapstone: false,
}

const PROBLEM: Problem = {
  id: 'prob-1',
  sessionId: 'sess-p1',
  topicId: 'topic-det',
  kind: 'numeric',
  statement: 'Compute the determinant of the 2x2 identity matrix.',
  difficulty: 'intermediate',
}

const CORRECT_GRADE: Grade = {
  sessionId: 'sess-p1',
  problemId: 'prob-1',
  result: 'correct',
  submittedAnswer: '3',
  masteryDelta: 5,
  hintLevel: 0,
  maxHints: 3,
}

const WRONG_GRADE: Grade = {
  ...CORRECT_GRADE,
  result: 'wrong',
  submittedAnswer: '2',
  masteryDelta: undefined,
}

// ── mutable store state ───────────────────────────────────────────────────────

const storeState = {
  sessions: {} as Record<string, SessionInfo>,
  messages: {} as Record<string, unknown[]>,
  ensureSession: vi.fn(),
  currentProblem: {} as Record<string, Problem | null>,
  currentGrade: {} as Record<string, Grade | null>,
  clearGrade: vi.fn(),
  appendUserMessage: vi.fn(),
  setPendingViz: vi.fn(),
}

const curriculumState = {
  topicsBySubject: { 'subj-linalg': [TOPIC] } as Record<string, Topic[]>,
}

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/app/store', () => ({
  useSessionStore: (sel?: (s: typeof storeState) => unknown) =>
    sel ? sel(storeState) : storeState,
  useCurriculumStore: () => curriculumState,
  useNavStore: () => ({ view: { type: 'mode', mode: 'practice', topicId: 'topic-det' }, navigateTo: vi.fn() }),
  useNotesStore: () => ({}),
  useSettingsStore: () => ({}),
  useReviewStore: () => ({}),
}))

vi.mock('@/lib/tauri', () => ({
  generateProblem: vi.fn(),
  revealSolution: vi.fn(),
  requestHint: vi.fn(),
  submitAnswer: vi.fn(),
  ensureSession: vi.fn(),
}))

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  const tauri = await import('@/lib/tauri')
  vi.clearAllMocks()
  vi.mocked(tauri.generateProblem).mockResolvedValue(undefined)
  vi.mocked(tauri.revealSolution).mockResolvedValue(undefined)
  vi.mocked(tauri.requestHint).mockResolvedValue(undefined)
  vi.mocked(tauri.submitAnswer).mockResolvedValue(undefined)
  vi.mocked(tauri.ensureSession).mockResolvedValue(SESSION)
  storeState.sessions = {}
  storeState.currentProblem = {}
  storeState.currentGrade = {}
  storeState.ensureSession.mockResolvedValue(SESSION)
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('PracticeMode — header', () => {
  it('renders the topic title', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText('Determinants')).toBeInTheDocument()
  })

  it('renders ⌘N new problem button', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText(/⌘N new problem/i)).toBeInTheDocument()
  })

  it('shows Problem 1 · attempt 1', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText(/problem 1 · attempt 1/i)).toBeInTheDocument()
  })

  it('shows mastery score in header', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })
})

describe('PracticeMode — difficulty selector', () => {
  it('renders all three difficulty buttons', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText('Easy')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })

  it('renders Generate problem button', () => {
    render(<PracticeMode topicId="topic-det" />)
    expect(screen.getByText('Generate problem')).toBeInTheDocument()
  })

  it('selecting a difficulty does not crash', () => {
    render(<PracticeMode topicId="topic-det" />)
    fireEvent.click(screen.getByText('Hard'))
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })

  it('calls generateProblem on Generate click', async () => {
    const { generateProblem } = await import('@/lib/tauri')
    render(<PracticeMode topicId="topic-det" />)
    // Wait for session to be established (button becomes enabled)
    await waitFor(() =>
      expect(screen.getByText('Generate problem')).not.toBeDisabled(),
    )
    fireEvent.click(screen.getByText('Generate problem'))
    await waitFor(() => expect(generateProblem).toHaveBeenCalledWith('sess-p1', 'intermediate'))
  })
})

describe('PracticeMode — problem present', () => {
  beforeEach(() => {
    storeState.currentProblem = { 'sess-p1': PROBLEM }
  })

  it('renders ProblemCard statement', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() =>
      expect(screen.getByText(/Compute the determinant/i)).toBeInTheDocument(),
    )
  })

  it('hides difficulty selector when problem is present', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() =>
      expect(screen.queryByText('Generate problem')).not.toBeInTheDocument(),
    )
  })
})

describe('PracticeMode — grade present', () => {
  beforeEach(() => {
    storeState.currentProblem = { 'sess-p1': PROBLEM }
    storeState.currentGrade = { 'sess-p1': CORRECT_GRADE }
  })

  it('renders GradePanel for correct grade', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() =>
      expect(screen.getByText(/Correct!/i)).toBeInTheDocument(),
    )
  })

  it('shows mastery delta chip in header', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() =>
      expect(screen.getByText(/▲/)).toBeInTheDocument(),
    )
  })
})

describe('PracticeMode — try again', () => {
  beforeEach(() => {
    storeState.currentProblem = { 'sess-p1': PROBLEM }
    storeState.currentGrade = { 'sess-p1': WRONG_GRADE }
  })

  it('calls clearGrade when Try again is clicked', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() => screen.getByText(/try again/i))
    fireEvent.click(screen.getByText(/try again/i))
    expect(storeState.clearGrade).toHaveBeenCalledWith('sess-p1')
  })

  it('increments attempt counter after try again', async () => {
    render(<PracticeMode topicId="topic-det" />)
    await waitFor(() => screen.getByText(/try again/i))
    fireEvent.click(screen.getByText(/try again/i))
    await waitFor(() =>
      expect(screen.getByText(/attempt 2/i)).toBeInTheDocument(),
    )
  })
})
