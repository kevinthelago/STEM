import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock VizHost to avoid ResizeObserver / WebGL setup in unit tests
vi.mock('../VizHost', () => ({
  VizHost: ({ payload, className }: { payload: { type: string; params: Record<string, unknown> }; className?: string }) => (
    <div
      data-testid="viz-host-mock"
      data-viz-type={payload.type}
      className={className}
    >
      VizHost:{payload.type}
    </div>
  ),
}))

import { VisualizeMode } from '../VisualizeMode'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VisualizeMode — sidebar', () => {
  it('renders the sidebar', () => {
    render(<VisualizeMode />)
    expect(screen.getByTestId('viz-sidebar')).toBeTruthy()
  })

  it('shows all six viz type labels in the sidebar', () => {
    render(<VisualizeMode />)
    expect(screen.getAllByText('3D Vectors').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Matrix Transform').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Function Plot').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Distribution').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Gradient Descent').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Physics Simulation').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking a sidebar item switches the active viz type', () => {
    render(<VisualizeMode initialVizType="vector3d" />)
    fireEvent.click(screen.getByRole('button', { name: /function plot/i }))
    const host = screen.getByTestId('viz-host-mock')
    expect(host.getAttribute('data-viz-type')).toBe('function_plot')
  })

  it('marks the active item with aria-pressed="true"', () => {
    render(<VisualizeMode initialVizType="distribution" />)
    const buttons = screen.getAllByRole('button')
    const distributionBtn = buttons.find(
      (b) => b.textContent?.includes('Distribution') && b.getAttribute('aria-pressed') === 'true'
    )
    expect(distributionBtn).toBeTruthy()
  })
})

describe('VisualizeMode — canvas header', () => {
  it('shows the active viz label in the header', () => {
    render(<VisualizeMode initialVizType="gradient_descent" />)
    const headings = screen.getAllByText('Gradient Descent')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('shows the viz type slug in monospace in the header', () => {
    render(<VisualizeMode initialVizType="physics_sim" />)
    expect(screen.getByText('physics_sim')).toBeTruthy()
  })

  it('shows the live indicator', () => {
    render(<VisualizeMode />)
    expect(screen.getByText('live')).toBeTruthy()
  })
})

describe('VisualizeMode — VizHost wiring', () => {
  it('passes the first viz type to VizHost by default', () => {
    render(<VisualizeMode />)
    expect(screen.getByTestId('viz-host-mock').getAttribute('data-viz-type')).toBe('vector3d')
  })

  it('passes initialVizType to VizHost', () => {
    render(<VisualizeMode initialVizType="matrix_transform" />)
    expect(screen.getByTestId('viz-host-mock').getAttribute('data-viz-type')).toBe('matrix_transform')
  })

  it('switches VizHost type when sidebar item clicked', () => {
    render(<VisualizeMode initialVizType="vector3d" />)
    fireEvent.click(screen.getByRole('button', { name: /gradient descent/i }))
    expect(screen.getByTestId('viz-host-mock').getAttribute('data-viz-type')).toBe('gradient_descent')
  })
})

describe('VisualizeMode — Back to Learn', () => {
  it('shows Back to Learn button when onBackToLearn is provided', () => {
    render(<VisualizeMode onBackToLearn={vi.fn()} />)
    expect(screen.getByText(/back to learn/i)).toBeTruthy()
  })

  it('does not show Back to Learn button when prop is omitted', () => {
    render(<VisualizeMode />)
    expect(screen.queryByText(/back to learn/i)).toBeNull()
  })

  it('calls onBackToLearn when the button is clicked', () => {
    const onBackToLearn = vi.fn()
    render(<VisualizeMode onBackToLearn={onBackToLearn} />)
    fireEvent.click(screen.getByText(/back to learn/i))
    expect(onBackToLearn).toHaveBeenCalledTimes(1)
  })
})

describe('VisualizeMode — parameter controls', () => {
  it('shows controls panel for distribution (has sliceable params)', () => {
    render(<VisualizeMode initialVizType="distribution" />)
    expect(screen.getByTestId('viz-controls')).toBeTruthy()
    expect(screen.getByText('Parameters')).toBeTruthy()
  })

  it('shows distribution param sliders', () => {
    render(<VisualizeMode initialVizType="distribution" />)
    expect(screen.getByLabelText(/μ \(mean\)/i)).toBeTruthy()
    expect(screen.getByLabelText(/σ \(std dev\)/i)).toBeTruthy()
  })

  it('shows controls for gradient_descent', () => {
    render(<VisualizeMode initialVizType="gradient_descent" />)
    expect(screen.getByTestId('viz-controls')).toBeTruthy()
    expect(screen.getByLabelText(/learning rate/i)).toBeTruthy()
  })

  it('does not show controls panel for vector3d (no param defs)', () => {
    render(<VisualizeMode initialVizType="vector3d" />)
    expect(screen.queryByTestId('viz-controls')).toBeNull()
  })

  it('does not show controls panel for function_plot', () => {
    render(<VisualizeMode initialVizType="function_plot" />)
    expect(screen.queryByTestId('viz-controls')).toBeNull()
  })

  it('updating a slider changes the displayed value', () => {
    render(<VisualizeMode initialVizType="distribution" />)
    const slider = screen.getByLabelText(/μ \(mean\)/i)
    fireEvent.change(slider, { target: { value: '2.5' } })
    expect(screen.getByText('2.50')).toBeTruthy()
  })

  it('controls panel disappears when switching to a type with no param defs', () => {
    render(<VisualizeMode initialVizType="distribution" />)
    expect(screen.getByTestId('viz-controls')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /3d vectors/i }))
    expect(screen.queryByTestId('viz-controls')).toBeNull()
  })
})
