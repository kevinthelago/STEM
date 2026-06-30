import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExplainCheck } from '../ExplainCheck'

vi.mock('@/lib/tauri', () => ({
  submitExplainAnswer: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ExplainCheck', () => {
  it('renders the Explain-check label', () => {
    render(<ExplainCheck sessionId="s1" question="Why is A singular?" onClose={vi.fn()} />)
    expect(screen.getByText('Explain-check')).toBeInTheDocument()
  })

  it('renders the question text', () => {
    render(<ExplainCheck sessionId="s1" question="Why is A singular?" onClose={vi.fn()} />)
    expect(screen.getByText('Why is A singular?')).toBeInTheDocument()
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<ExplainCheck sessionId="s1" question="Why?" onClose={vi.fn()} />)
    expect(screen.getByText(/Submit explanation/i)).toBeDisabled()
  })

  it('submit button enables after typing', () => {
    render(<ExplainCheck sessionId="s1" question="Why?" onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Because it has no inverse' } })
    expect(screen.getByText(/Submit explanation/i)).not.toBeDisabled()
  })

  it('calls onClose after successful submit', async () => {
    const onClose = vi.fn()
    render(<ExplainCheck sessionId="s1" question="Why?" onClose={onClose} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My explanation' } })
    fireEvent.click(screen.getByText(/Submit explanation/i))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('calls onClose when × button is clicked', () => {
    const onClose = vi.fn()
    render(<ExplainCheck sessionId="s1" question="Why?" onClose={onClose} />)
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows grading-criterion note', () => {
    render(<ExplainCheck sessionId="s1" question="Why?" onClose={vi.fn()} />)
    expect(screen.getByText(/graded on intuition/i)).toBeInTheDocument()
  })
})
