// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LogLevelBadge from './LogLevelBadge'

describe('LogLevelBadge', () => {
  it('should render ERROR level', () => {
    render(<LogLevelBadge level="ERROR" />)
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('should render WARNING level', () => {
    render(<LogLevelBadge level="WARNING" />)
    expect(screen.getByText('WARNING')).toBeInTheDocument()
  })

  it('should render INFO level', () => {
    render(<LogLevelBadge level="INFO" />)
    const badge = screen.getByText('INFO')
    expect(badge).toBeInTheDocument()
    // Verify the exact level string to kill mutants
    expect(badge.textContent).toBe('INFO')
  })

  it('should apply correct classes for INFO level', () => {
    const { container } = render(<LogLevelBadge level="INFO" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-gray-800')
    expect(badge.className).toContain('text-gray-300')
  })

  it('should apply correct text color for INFO level without background', () => {
    const { container } = render(<LogLevelBadge level="INFO" showBackground={false} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('text-gray-300')
  })

  it('should render DEBUG level', () => {
    render(<LogLevelBadge level="DEBUG" />)
    expect(screen.getByText('DEBUG')).toBeInTheDocument()
  })

  it('should show background by default', () => {
    const { container } = render(<LogLevelBadge level="ERROR" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-red-900/30')
  })

  it('should hide background when showBackground is false', () => {
    const { container } = render(<LogLevelBadge level="ERROR" showBackground={false} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).not.toContain('bg-red-900/30')
    expect(badge.className).toContain('text-red-400')
  })

  it('should normalize invalid level to INFO', () => {
    render(<LogLevelBadge level="invalid-level" />)
    expect(screen.getByText('INFO')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<LogLevelBadge level="ERROR" className="custom-class" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('custom-class')
  })
})

