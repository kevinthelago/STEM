import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TutorMessage } from '../TutorMessage'
import type { ChatMessage } from '@/lib/types'

const baseMessage: ChatMessage = {
  id: 'm1',
  role: 'tutor',
  content: 'Hello, this is a tutor message.',
  isStreaming: false,
}

const streamingMessage: ChatMessage = {
  ...baseMessage,
  id: 'm2',
  content: 'Streaming response so far',
  isStreaming: true,
}

const messageWithViz: ChatMessage = {
  ...baseMessage,
  id: 'm3',
  content: 'Here is a visualization.',
  vizPayload: {
    sessionId: 's3',
    type: 'eigen_2d',
    label: 'Eigenvectors of a 2×2 shear',
    params: {},
  },
}

const mathMessage: ChatMessage = {
  ...baseMessage,
  id: 'm4',
  content: 'Consider $x^2 + y^2 = r^2$.',
}

describe('TutorMessage', () => {
  it('renders tutor label', () => {
    render(<TutorMessage message={baseMessage} onVizClick={vi.fn()} />)
    expect(screen.getByText('Tutor')).toBeInTheDocument()
  })

  it('renders message content', () => {
    render(<TutorMessage message={baseMessage} onVizClick={vi.fn()} />)
    expect(screen.getByText(/Hello, this is a tutor message/)).toBeInTheDocument()
  })

  it('does not show streaming indicator when not streaming', () => {
    render(<TutorMessage message={baseMessage} onVizClick={vi.fn()} />)
    expect(screen.queryByText('streaming')).not.toBeInTheDocument()
  })

  it('shows streaming indicator when isStreaming is true', () => {
    render(<TutorMessage message={streamingMessage} onVizClick={vi.fn()} />)
    expect(screen.getByText('streaming')).toBeInTheDocument()
  })

  it('does not render VizChip when no vizPayload', () => {
    render(<TutorMessage message={baseMessage} onVizClick={vi.fn()} />)
    expect(screen.queryByText(/opens Visualize host/)).not.toBeInTheDocument()
  })

  it('renders VizChip when vizPayload is present', () => {
    render(<TutorMessage message={messageWithViz} onVizClick={vi.fn()} />)
    expect(screen.getByText(/Eigenvectors of a 2×2 shear/)).toBeInTheDocument()
  })

  it('calls onVizClick when VizChip is clicked', () => {
    const onVizClick = vi.fn()
    render(<TutorMessage message={messageWithViz} onVizClick={onVizClick} />)
    fireEvent.click(screen.getByText(/Eigenvectors of a 2×2 shear/))
    expect(onVizClick).toHaveBeenCalledWith(messageWithViz.vizPayload)
  })

  it('renders inline math using KaTeX', () => {
    const { container } = render(<TutorMessage message={mathMessage} onVizClick={vi.fn()} />)
    expect(container.querySelector('.katex, [class*="katex"]')).toBeTruthy()
  })
})
