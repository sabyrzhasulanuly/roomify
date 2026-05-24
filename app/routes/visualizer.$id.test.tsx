import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VisualizerId from './visualizer.$id'

describe('VisualizerId', () => {
  it('renders without crashing', () => {
    render(<VisualizerId />)
  })

  it('renders a div with text "Visualizer Id"', () => {
    render(<VisualizerId />)
    expect(screen.getByText('Visualizer Id')).toBeInTheDocument()
  })

  it('renders a single container element', () => {
    const { container } = render(<VisualizerId />)
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
  })

  it('renders exactly the expected text content', () => {
    const { container } = render(<VisualizerId />)
    expect(container.textContent).toBe('Visualizer Id')
  })
})