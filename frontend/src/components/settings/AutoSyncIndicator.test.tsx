/**
 * Auto Sync Indicator Component Tests
 * Tests for auto-sync indicator component rendering
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { AutoSyncIndicator } from './AutoSyncIndicator'

describe('AutoSyncIndicator', () => {
  it('should render auto-sync indicator', () => {
    render(<AutoSyncIndicator />)

    expect(screen.getByText(/Auto-sync enabled/)).toBeInTheDocument()
    expect(screen.getByText(/Settings are automatically saved when you make changes/)).toBeInTheDocument()
    expect(screen.getByText(/Settings are automatically synced to the backend server when you make changes/)).toBeInTheDocument()
  })

  it('should render pulse animation indicator', () => {
    const { container } = render(<AutoSyncIndicator />)

    const indicator = container.querySelector('.animate-pulse')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass('bg-green-500', 'rounded-full')
  })

  it('should have proper styling classes', () => {
    const { container } = render(<AutoSyncIndicator />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('mt-8', 'pt-6', 'border-t', 'border-gray-200')
  })
})
