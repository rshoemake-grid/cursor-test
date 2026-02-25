/**
 * Tests for AdvancedFiltersPanel Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AdvancedFiltersPanel from './AdvancedFiltersPanel'
import type { AdvancedFilterOptions } from '../../hooks/log/useAdvancedFilters'

describe('AdvancedFiltersPanel', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render filter panel', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
  })

  it('should render date range inputs', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Start Date')).toBeInTheDocument()
    expect(screen.getByText('End Date')).toBeInTheDocument()
  })

  it('should render duration inputs', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Duration (seconds)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument()
  })

  it('should render error status select', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Error Status')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All')).toBeInTheDocument()
  })

  it('should call onFiltersChange when date is changed', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })

    expect(mockOnFiltersChange).toHaveBeenCalled()
  })

  it('should call onFiltersChange when duration is changed', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const minInput = screen.getByPlaceholderText('Min')
    fireEvent.change(minInput, { target: { value: '10' } })

    expect(mockOnFiltersChange).toHaveBeenCalled()
  })

  it('should call onFiltersChange when error status is changed', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const select = screen.getByDisplayValue('All')
    fireEvent.change(select, { target: { value: 'with-error' } })

    expect(mockOnFiltersChange).toHaveBeenCalled()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByLabelText('Close filters')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should display clear buttons when filters are set', () => {
    render(
      <AdvancedFiltersPanel
        filters={{
          dateRange: { start: new Date('2024-01-01') },
        }}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Clear date range')).toBeInTheDocument()
  })

  it('should render workflow filter when workflows are provided', () => {
    const workflows = [
      { id: 'workflow-1', name: 'Workflow 1' },
      { id: 'workflow-2', name: 'Workflow 2' },
    ]

    render(
      <AdvancedFiltersPanel
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        availableWorkflows={workflows}
      />
    )

    expect(screen.getByText('Workflows')).toBeInTheDocument()
    // Check that workflow options are rendered in the select
    const select = screen.getByText('Workflows').closest('div')?.querySelector('select')
    expect(select).toBeInTheDocument()
    if (select) {
      expect(select.textContent).toContain('Workflow 1')
    }
  })
})
