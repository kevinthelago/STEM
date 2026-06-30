import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GradePanel } from '../GradePanel'
import type { Grade } from '@/lib/types'

const correctGrade: Grade = {
  sessionId: 's1',
  problemId: 'p1',
  result: 'correct',
  submittedAnswer: '3',
  masteryDelta: 5,
  hintLevel: 0,
  maxHints: 3,
}

const wrongGrade: Grade = {
  sessionId: 's1',
  problemId: 'p1',
  result: 'wrong',
  submittedAnswer: '2',
  hintLevel: 0,
  maxHints: 3,
}

const wrongWithFeedback: Grade = {
  ...wrongGrade,
  whereWrong: 'That is a diagonal entry, not an eigenvalue.',
  hint: 'Set up the characteristic equation.',
  hintLevel: 1,
  maxHints: 3,
}

const partialGrade: Grade = {
  sessionId: 's1',
  problemId: 'p1',
  result: 'partial',
  submittedAnswer: '3.0',
  hintLevel: 0,
  maxHints: 3,
}

const solutionRevealedGrade: Grade = {
  ...wrongGrade,
  solution: 'The eigenvalues are 3 and 1.',
}

describe('GradePanel — correct', () => {
  it('shows Correct! message', () => {
    render(
      <GradePanel
        grade={correctGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText('Correct!')).toBeInTheDocument()
  })

  it('shows mastery delta chip when correct', () => {
    render(
      <GradePanel
        grade={correctGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText('+5 mastery')).toBeInTheDocument()
  })

  it('shows Next problem button', () => {
    render(
      <GradePanel
        grade={correctGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText('Next problem')).toBeInTheDocument()
  })

  it('calls onNextProblem when Next problem clicked', () => {
    const onNext = vi.fn()
    render(
      <GradePanel
        grade={correctGrade}
        onTryAgain={vi.fn()}
        onNextProblem={onNext}
      />,
    )
    fireEvent.click(screen.getByText('Next problem'))
    expect(onNext).toHaveBeenCalled()
  })
})

describe('GradePanel — wrong', () => {
  it('shows "Not quite" message with submitted answer', () => {
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/Not quite/)).toBeInTheDocument()
    expect(screen.getByText(/you entered "2"/)).toBeInTheDocument()
  })

  it('shows "no mastery penalty" hint', () => {
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/no mastery penalty/)).toBeInTheDocument()
  })

  it('shows Try again button for wrong answer', () => {
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/try again/i)).toBeInTheDocument()
  })

  it('calls onTryAgain when Try again clicked', () => {
    const onTryAgain = vi.fn()
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={onTryAgain}
        onNextProblem={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText(/try again/i))
    expect(onTryAgain).toHaveBeenCalled()
  })

  it('shows whereWrong and hint when provided', () => {
    render(
      <GradePanel
        grade={wrongWithFeedback}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/Where it went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Hint 1 of 3/i)).toBeInTheDocument()
  })

  it('shows Reveal solution button when onRevealSolution provided', () => {
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
        onRevealSolution={vi.fn()}
      />,
    )
    expect(screen.getByText(/reveal solution/i)).toBeInTheDocument()
  })

  it('shows Get hint button when onRequestHint provided and hints remain', () => {
    render(
      <GradePanel
        grade={wrongGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
        onRequestHint={vi.fn()}
      />,
    )
    expect(screen.getByText(/get hint/i)).toBeInTheDocument()
  })

  it('shows Next hint when hintLevel > 0', () => {
    render(
      <GradePanel
        grade={wrongWithFeedback}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
        onRequestHint={vi.fn()}
      />,
    )
    expect(screen.getByText(/next hint/i)).toBeInTheDocument()
  })
})

describe('GradePanel — partial', () => {
  it('shows Partially correct message', () => {
    render(
      <GradePanel
        grade={partialGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/Partially correct/)).toBeInTheDocument()
  })
})

describe('GradePanel — solution revealed', () => {
  it('renders worked solution section', () => {
    render(
      <GradePanel
        grade={solutionRevealedGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.getByText(/Worked solution/i)).toBeInTheDocument()
    expect(screen.getByText(/The eigenvalues are 3 and 1/)).toBeInTheDocument()
  })

  it('hides Try again when solution revealed', () => {
    render(
      <GradePanel
        grade={solutionRevealedGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
      />,
    )
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument()
  })

  it('shows Add to review button when onAddToReview provided', () => {
    render(
      <GradePanel
        grade={solutionRevealedGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
        onAddToReview={vi.fn()}
      />,
    )
    expect(screen.getByText(/add to review/i)).toBeInTheDocument()
  })

  it('calls onAddToReview when Add to review clicked', () => {
    const onAdd = vi.fn()
    render(
      <GradePanel
        grade={solutionRevealedGrade}
        onTryAgain={vi.fn()}
        onNextProblem={vi.fn()}
        onAddToReview={onAdd}
      />,
    )
    fireEvent.click(screen.getByText(/add to review/i))
    expect(onAdd).toHaveBeenCalled()
  })
})
