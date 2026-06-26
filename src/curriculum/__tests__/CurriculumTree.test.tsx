import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CurriculumTree, SuggestedNext, ProblemSetProgress } from '../CurriculumTree'
import type { Subject, Topic } from '@/lib/types'

const subjects: Subject[] = [
  { id: 'calculus', title: 'Calculus', topicCount: 2, mastery: 45 },
  { id: 'physics', title: 'Physics', topicCount: 1, mastery: 0 },
]

const topics: Record<string, Topic[]> = {
  calculus: [
    {
      id: 'calculus/derivatives',
      subjectId: 'calculus',
      title: 'Derivatives',
      prerequisites: [],
      masteryLevel: 'proficient',
      masteryScore: 72,
      isCapstone: false,
    },
    {
      id: 'calculus/integrals',
      subjectId: 'calculus',
      title: 'Integrals',
      prerequisites: ['calculus/derivatives'],
      masteryLevel: 'unstarted',
      masteryScore: 0,
      isCapstone: false,
    },
  ],
  physics: [
    {
      id: 'physics/mechanics',
      subjectId: 'physics',
      title: 'Mechanics',
      prerequisites: [],
      masteryLevel: 'unstarted',
      masteryScore: 0,
      isCapstone: false,
    },
  ],
}

describe('CurriculumTree', () => {
  it('renders subject headings', () => {
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Calculus')).toBeInTheDocument()
    expect(screen.getByText('Physics')).toBeInTheDocument()
  })

  it('shows topics when subject is expanded', () => {
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Derivatives')).toBeInTheDocument()
    expect(screen.getByText('Integrals')).toBeInTheDocument()
  })

  it('hides topics when subject is collapsed', () => {
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set()}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.queryByText('Derivatives')).not.toBeInTheDocument()
  })

  it('calls onToggleSubject when subject header clicked', () => {
    const toggle = vi.fn()
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={toggle}
        onTopicClick={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Calculus'))
    expect(toggle).toHaveBeenCalledWith('calculus')
  })

  it('calls onTopicClick when a topic row is clicked', () => {
    const click = vi.fn()
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={click}
      />,
    )
    fireEvent.click(screen.getByText('Derivatives'))
    expect(click).toHaveBeenCalledWith(topics.calculus[0], subjects[0])
  })

  it('shows ⚠ for unstarted topic with prerequisites', () => {
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.getByText('⚠')).toBeInTheDocument()
  })

  it('shows mastery score for topics with score > 0', () => {
    render(
      <CurriculumTree
        subjects={subjects}
        topicsBySubject={topics}
        expandedSubjects={new Set(['calculus'])}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('shows empty state when no subjects', () => {
    render(
      <CurriculumTree
        subjects={[]}
        topicsBySubject={{}}
        expandedSubjects={new Set()}
        activeTopicId={null}
        onToggleSubject={vi.fn()}
        onTopicClick={vi.fn()}
      />,
    )
    expect(screen.getByText(/no subjects loaded/i)).toBeInTheDocument()
  })
})

describe('SuggestedNext', () => {
  it('renders topic title and click handler', () => {
    const click = vi.fn()
    render(
      <SuggestedNext
        topic={topics.calculus[0]}
        onClick={click}
      />,
    )
    expect(screen.getByText('Derivatives')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Derivatives'))
    expect(click).toHaveBeenCalled()
  })
})

describe('ProblemSetProgress', () => {
  it('renders correct/total label', () => {
    render(<ProblemSetProgress correct={3} total={5} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })

  it('shows at least 5 dots', () => {
    const { container } = render(<ProblemSetProgress correct={1} total={3} />)
    // 5 dots minimum (spans with background)
    const dots = container.querySelectorAll('span[style]')
    expect(dots.length).toBeGreaterThanOrEqual(5)
  })
})
