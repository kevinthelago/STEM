import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VizChip } from '../VizChip'
import type { VizPayload } from '@/lib/types'

const viz: VizPayload = {
  sessionId: 's1',
  type: 'eigen_2d',
  label: 'Eigenvectors of a 2×2 shear',
  params: { a11: 2, a12: 1, a21: 1, a22: 2 },
}

describe('VizChip', () => {
  it('renders the viz label', () => {
    render(<VizChip viz={viz} onClick={vi.fn()} />)
    expect(screen.getByText('Eigenvectors of a 2×2 shear')).toBeInTheDocument()
  })

  it('renders the viz type tag', () => {
    render(<VizChip viz={viz} onClick={vi.fn()} />)
    expect(screen.getByText(/eigen_2d/)).toBeInTheDocument()
  })

  it('renders "opens Visualize host" subtitle', () => {
    render(<VizChip viz={viz} onClick={vi.fn()} />)
    expect(screen.getByText(/opens Visualize host/)).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<VizChip viz={viz} onClick={onClick} />)
    fireEvent.click(screen.getByText('Eigenvectors of a 2×2 shear'))
    expect(onClick).toHaveBeenCalled()
  })
})
