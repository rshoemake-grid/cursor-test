/**
 * Tests for ErrorBoundary Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'
import { logger } from '../utils/logger'

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry/)).toBeInTheDocument()
  })

  it('should log error when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(logger.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('should call onError callback when provided', () => {
    const mockOnError = jest.fn()

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Error Details:/)).toBeInTheDocument()
    expect(screen.getByText(/Test error/)).toBeInTheDocument()
  })

  it('should show stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const details = screen.getByText('Stack Trace')
    expect(details).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should have Try Again button that can be clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Verify Try Again button exists and can be clicked
    const tryAgainButton = screen.getByText('Try Again')
    expect(tryAgainButton).toBeInTheDocument()
    
    // Click should not throw an error
    expect(() => {
      fireEvent.click(tryAgainButton)
    }).not.toThrow()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should have Go Home button', () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { href: '' } as any

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const goHomeButton = screen.getByText('Go Home')
    expect(goHomeButton).toBeInTheDocument()

    fireEvent.click(goHomeButton)

    window.location = originalLocation
  })
})
