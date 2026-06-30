import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProblemCard } from '../ProblemCard'
import type { Problem } from '@/lib/types'

vi.mock('@/lib/tauri', () => ({
  submitAnswer: vi.fn().mockResolvedValue(undefined),
}))

const baseNumericProblem: Problem = {
  id: 'p1',
  sessionId: 's1',
  topicId: 'calculus/derivatives',
  kind: 'numeric',
  difficulty: 'easy',
  statement: 'What is $\\frac{d}{dx}[x^2]$?',
}

const multiChoiceProblem: Problem = {
  id: 'p2',
  sessionId: 's1',
  topicId: 'calculus/derivatives',
  kind: 'derived',
  difficulty: 'intermediate',
  statement: `Which rule applies here?

A) Product rule
B) Chain rule
C) Quotient rule
D) Power rule`,
}

const codeProblem: Problem = {
  id: 'p3',
  sessionId: 's1',
  topicId: 'calculus/derivatives',
  kind: 'multistep',
  difficulty: 'hard',
  statement: 'Implement a function that computes the derivative of $x^n$.',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProblemCard — numeric', () => {
  it('renders the problem statement', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    // The katex rendering should be present in the document
    expect(document.querySelector('.katex, [data-testid], textarea, input')).toBeTruthy()
  })

  it('renders ans= prefix for numeric kind', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText('ans =')).toBeInTheDocument()
  })

  it('submit button is disabled when input is empty', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    const btn = screen.getByText(/submit/i)
    expect(btn).toBeDisabled()
  })

  it('submit button enables after typing', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2x' } })
    const btn = screen.getByText(/submit/i)
    expect(btn).not.toBeDisabled()
  })
})

describe('ProblemCard — multiple choice (derived kind)', () => {
  it('renders A/B/C/D option rows', () => {
    render(<ProblemCard problem={multiChoiceProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('renders option labels text', () => {
    render(<ProblemCard problem={multiChoiceProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText('Product rule')).toBeInTheDocument()
    expect(screen.getByText('Chain rule')).toBeInTheDocument()
    expect(screen.getByText('Quotient rule')).toBeInTheDocument()
    expect(screen.getByText('Power rule')).toBeInTheDocument()
  })

  it('submit button is disabled before selection', () => {
    render(<ProblemCard problem={multiChoiceProblem} sessionId="s1" answered={false} />)
    const btn = screen.getByText(/submit answer/i)
    expect(btn).toBeDisabled()
  })

  it('submit enables after clicking an option', () => {
    render(<ProblemCard problem={multiChoiceProblem} sessionId="s1" answered={false} />)
    // Click the first option row (the button containing label "A")
    fireEvent.click(screen.getByText('Product rule').closest('button')!)
    const btn = screen.getByText(/submit answer/i)
    expect(btn).not.toBeDisabled()
  })

  it('shows ✓ correct after correct grade on the submitted row', () => {
    render(
      <ProblemCard
        problem={multiChoiceProblem}
        sessionId="s1"
        answered={true}
        gradeResult="correct"
        submittedAnswer="A"
      />,
    )
    expect(screen.getByText('✓ correct')).toBeInTheDocument()
  })
})

describe('ProblemCard — code (multistep kind)', () => {
  it('renders a CodeMirror editor for code entry', () => {
    render(<ProblemCard problem={codeProblem} sessionId="s1" answered={false} />)
    expect(document.querySelector('.cm-editor')).toBeInTheDocument()
    expect(document.querySelector('.cm-content')).toBeInTheDocument()
  })

  it('renders Run & grade button', () => {
    render(<ProblemCard problem={codeProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText(/run & grade/i)).toBeInTheDocument()
  })

  it('run button is disabled when code is empty', () => {
    render(<ProblemCard problem={codeProblem} sessionId="s1" answered={false} />)
    const btn = screen.getByText(/run & grade/i)
    expect(btn).toBeDisabled()
  })

  it('run button enables after typing code', async () => {
    render(<ProblemCard problem={codeProblem} sessionId="s1" answered={false} />)
    const content = document.querySelector('.cm-content') as HTMLElement
    const user = userEvent.setup()
    await user.type(content, 'def f(x, n): return n * x**(n-1)')
    const btn = screen.getByText(/run & grade/i)
    expect(btn).not.toBeDisabled()
  })

  it('editor is non-editable once answered', () => {
    render(<ProblemCard problem={codeProblem} sessionId="s1" answered={true} gradeResult="correct" />)
    const content = document.querySelector('.cm-content') as HTMLElement
    expect(content.getAttribute('contenteditable')).toBe('false')
  })
})

describe('ProblemCard — difficulty indicators', () => {
  it('shows difficulty label', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })

  it('shows topic id in header', () => {
    render(<ProblemCard problem={baseNumericProblem} sessionId="s1" answered={false} />)
    expect(screen.getByText('calculus/derivatives')).toBeInTheDocument()
  })
})
