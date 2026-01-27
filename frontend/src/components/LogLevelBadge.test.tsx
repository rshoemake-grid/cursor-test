// Jest globals - no import needed
import { render, screen } from '@testing-library/react'
import LogLevelBadge from './LogLevelBadge'
import { isValidLogLevel } from '../utils/logLevel'

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

  describe('edge cases', () => {
    it('should handle showBackground being false', () => {
      render(<LogLevelBadge level="INFO" showBackground={false} />)
      
      const badge = screen.getByText('INFO')
      expect(badge).toBeInTheDocument()
      // Should not have background color classes
      expect(badge.className).not.toContain('bg-')
    })

    it('should handle showBackground being undefined', () => {
      render(<LogLevelBadge level="INFO" />)
      
      const badge = screen.getByText('INFO')
      expect(badge).toBeInTheDocument()
      // Should have background (default is true)
      expect(badge.className).toContain('bg-')
    })

    it('should handle className being empty string', () => {
      render(<LogLevelBadge level="INFO" className="" />)
      
      const badge = screen.getByText('INFO')
      expect(badge).toBeInTheDocument()
    })

    it('should handle className being provided', () => {
      render(<LogLevelBadge level="INFO" className="custom-class" />)
      
      const badge = screen.getByText('INFO')
      expect(badge.className).toContain('custom-class')
    })

    it('should handle showBackground true with className', () => {
      render(<LogLevelBadge level="INFO" showBackground={true} className="test-class" />)
      
      const badge = screen.getByText('INFO')
      expect(badge.className).toContain('test-class')
      expect(badge.className).toContain('bg-')
    })

    it('should handle showBackground false with className', () => {
      render(<LogLevelBadge level="INFO" showBackground={false} className="test-class" />)
      
      const badge = screen.getByText('INFO')
      expect(badge.className).toContain('test-class')
      expect(badge.className).not.toContain('bg-')
    })

    it('should handle ternary operator for showBackground', () => {
      // Test both branches of showBackground ? getLogLevelColor : ''
      const { unmount: unmount1 } = render(<LogLevelBadge level="INFO" showBackground={true} />)
      const badge1 = screen.getByText('INFO')
      expect(badge1.className).toContain('bg-')
      unmount1()
      document.body.innerHTML = ''
      
      const { unmount: unmount2 } = render(<LogLevelBadge level="INFO" showBackground={false} />)
      const badge2 = screen.getByText('INFO')
      expect(badge2.className).not.toContain('bg-')
      unmount2()
    })

    it('should handle isValidLogLevel check for all levels', () => {
      const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 'INVALID']
      
      for (const level of levels) {
        const { unmount } = render(<LogLevelBadge level={level} />)
        
        const badge = screen.getByText(isValidLogLevel(level) ? level : 'INFO')
        expect(badge).toBeInTheDocument()
        
        unmount()
        // Clean up DOM between renders
        document.body.innerHTML = ''
      }
    })

    it('should handle all valid log levels with background', () => {
      const validLevels: Array<'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'> = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
      
      for (const level of validLevels) {
        const { unmount, container } = render(<LogLevelBadge level={level} showBackground={true} />)
        const badge = container.firstChild as HTMLElement
        
        expect(badge.textContent).toBe(level)
        expect(badge.className).toContain('bg-')
        
        unmount()
        document.body.innerHTML = ''
      }
    })

    it('should handle all valid log levels without background', () => {
      const validLevels: Array<'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'> = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
      
      for (const level of validLevels) {
        const { unmount, container } = render(<LogLevelBadge level={level} showBackground={false} />)
        const badge = container.firstChild as HTMLElement
        
        expect(badge.textContent).toBe(level)
        expect(badge.className).not.toContain('bg-')
        expect(badge.className).toContain('text-')
        
        unmount()
        document.body.innerHTML = ''
      }
    })

    it('should handle className concatenation correctly', () => {
      const { container } = render(<LogLevelBadge level="ERROR" className="custom-class another-class" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge.className).toContain('custom-class')
      expect(badge.className).toContain('another-class')
      expect(badge.className).toContain('font-semibold')
    })

    it('should handle empty level string', () => {
      render(<LogLevelBadge level="" />)
      // Should normalize to INFO
      expect(screen.getByText('INFO')).toBeInTheDocument()
    })

    it('should handle level with whitespace', () => {
      render(<LogLevelBadge level="  ERROR  " />)
      // Should normalize to INFO (trimmed but still invalid)
      expect(screen.getByText('INFO')).toBeInTheDocument()
    })
  })
})

