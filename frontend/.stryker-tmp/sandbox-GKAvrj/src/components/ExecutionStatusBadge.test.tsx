// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExecutionStatusBadge from './ExecutionStatusBadge'

describe('ExecutionStatusBadge', () => {
  it('should render completed status', () => {
    render(<ExecutionStatusBadge status="completed" />)
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('should render failed status', () => {
    render(<ExecutionStatusBadge status="failed" />)
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('should render running status', () => {
    render(<ExecutionStatusBadge status="running" />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('should render pending status', () => {
    render(<ExecutionStatusBadge status="pending" />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('should render paused status', () => {
    render(<ExecutionStatusBadge status="paused" />)
    expect(screen.getByText('paused')).toBeInTheDocument()
    // Verify the exact status string to kill mutants
    const badge = screen.getByText('paused')
    expect(badge.textContent).toBe('paused')
  })

  it('should apply correct classes for paused status', () => {
    const { container } = render(<ExecutionStatusBadge status="paused" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-gray-900')
    expect(badge.className).toContain('text-gray-200')
  })

  it('should use dark variant by default', () => {
    const { container } = render(<ExecutionStatusBadge status="completed" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-green-900')
  })

  it('should use light variant when specified', () => {
    const { container } = render(<ExecutionStatusBadge status="completed" variant="light" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-green-100')
  })

  it('should normalize invalid status to pending', () => {
    render(<ExecutionStatusBadge status="invalid-status" />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<ExecutionStatusBadge status="completed" className="custom-class" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('custom-class')
  })
})

