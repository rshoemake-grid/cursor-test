// Jest globals - no import needed
import { render, screen } from '@testing-library/react'
import ExecutionStatusBadge from './ExecutionStatusBadge'
import { isValidExecutionStatus } from '../utils/executionStatus'

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

  describe('edge cases', () => {
    it('should handle variant being undefined', () => {
      render(<ExecutionStatusBadge status="running" />)
      
      const badge = screen.getByText('running')
      expect(badge).toBeInTheDocument()
      // Should use default 'dark' variant
      expect(badge.className).toContain('bg-')
    })

    it('should handle variant being "light"', () => {
      render(<ExecutionStatusBadge status="running" variant="light" />)
      
      const badge = screen.getByText('running')
      expect(badge).toBeInTheDocument()
      // Should use light variant colors
      expect(badge.className).toContain('bg-')
    })

    it('should handle variant being "dark"', () => {
      render(<ExecutionStatusBadge status="running" variant="dark" />)
      
      const badge = screen.getByText('running')
      expect(badge).toBeInTheDocument()
      // Should use dark variant colors
      expect(badge.className).toContain('bg-')
    })

    it('should handle className being empty string', () => {
      render(<ExecutionStatusBadge status="running" className="" />)
      
      const badge = screen.getByText('running')
      expect(badge).toBeInTheDocument()
    })

    it('should handle className being provided', () => {
      render(<ExecutionStatusBadge status="running" className="custom-class" />)
      
      const badge = screen.getByText('running')
      expect(badge.className).toContain('custom-class')
    })

    it('should handle variant === "light" check', () => {
      // Test both branches of variant === 'light' ? getExecutionStatusColorLight : getExecutionStatusColor
      const { unmount: unmount1 } = render(<ExecutionStatusBadge status="running" variant="light" />)
      const badge1 = screen.getByText('running')
      expect(badge1).toBeInTheDocument()
      unmount1()
      document.body.innerHTML = ''
      
      const { unmount: unmount2 } = render(<ExecutionStatusBadge status="running" variant="dark" />)
      const badge2 = screen.getByText('running')
      expect(badge2).toBeInTheDocument()
      unmount2()
    })

    it('should handle isValidExecutionStatus check for all statuses', () => {
      const statuses = ['running', 'completed', 'failed', 'pending', 'paused', 'INVALID']
      
      for (const status of statuses) {
        const { unmount } = render(<ExecutionStatusBadge status={status} />)
        
        const badge = screen.getByText(isValidExecutionStatus(status) ? status : 'pending')
        expect(badge).toBeInTheDocument()
        
        unmount()
        document.body.innerHTML = ''
      }
    })

    it('should handle all variant values', () => {
      const variants: Array<'dark' | 'light'> = ['dark', 'light']
      
      for (const variant of variants) {
        const { unmount } = render(<ExecutionStatusBadge status="running" variant={variant} />)
        
        const badge = screen.getByText('running')
        expect(badge).toBeInTheDocument()
        
        unmount()
      }
    })
  })
})

