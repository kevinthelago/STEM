import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandPalette } from '../CommandPalette'
import { useCurriculumStore } from '../store/curriculum'
import { useNavStore } from '../store/nav'
import type { Subject, Topic } from '@/lib/types'

const SUBJECTS: Subject[] = [
  { id: 'calc', title: 'Calculus', topicCount: 2, mastery: 50 },
]

const TOPICS: Topic[] = [
  {
    id: 'calc/derivatives',
    subjectId: 'calc',
    title: 'Derivatives',
    prerequisites: [],
    masteryLevel: 'learning',
    masteryScore: 45,
    isCapstone: false,
  },
  {
    id: 'calc/integrals',
    subjectId: 'calc',
    title: 'Integrals',
    prerequisites: [],
    masteryLevel: 'unstarted',
    masteryScore: 0,
    isCapstone: false,
  },
]

function seedStores() {
  useCurriculumStore.setState({
    subjects: SUBJECTS,
    topicsBySubject: { calc: TOPICS },
    expandedSubjects: new Set(['calc']),
    activeTopicId: null,
    loading: false,
    error: null,
  })
  useNavStore.setState({
    view: { type: 'dashboard' },
    reviewDueCount: 0,
    commandPaletteOpen: false,
  })
}

describe('CommandPalette', () => {
  beforeEach(() => {
    seedStores()
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with search input when open', () => {
    render(<CommandPalette open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search topics/i)).toBeInTheDocument()
  })

  it('shows topics from the curriculum store', () => {
    render(<CommandPalette open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Derivatives')).toBeInTheDocument()
    expect(screen.getByText('Integrals')).toBeInTheDocument()
  })

  it('shows action items (Dashboard, Notes, Settings, Review)', () => {
    render(<CommandPalette open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('filters topics by query', () => {
    render(<CommandPalette open={true} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/search topics/i)
    fireEvent.change(input, { target: { value: 'deriv' } })
    expect(screen.getByText('Derivatives')).toBeInTheDocument()
    expect(screen.queryByText('Integrals')).not.toBeInTheDocument()
  })

  it('shows empty state when query matches nothing', () => {
    render(<CommandPalette open={true} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/search topics/i)
    fireEvent.change(input, { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    render(<CommandPalette open={true} onClose={onClose} />)
    const input = screen.getByPlaceholderText(/search topics/i)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('navigates to dashboard view and calls onClose when Dashboard action selected', () => {
    const onClose = vi.fn()
    render(<CommandPalette open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Dashboard'))
    expect(useNavStore.getState().view).toEqual({ type: 'dashboard' })
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates to learn mode and calls onClose when a topic is clicked', () => {
    const onClose = vi.fn()
    render(<CommandPalette open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Derivatives'))
    const view = useNavStore.getState().view
    expect(view.type).toBe('mode')
    if (view.type === 'mode') {
      expect(view.mode).toBe('learn')
      expect(view.topicId).toBe('calc/derivatives')
    }
    expect(onClose).toHaveBeenCalled()
  })
})
