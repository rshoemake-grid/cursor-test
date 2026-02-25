/**
 * Tests for ExecutionFilters Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ExecutionFilters from './ExecutionFilters'
import type { ExecutionFiltersState } from './ExecutionFilters'

describe('ExecutionFilters', () => {
  const mockOnFiltersChange = jest.fn()

  const defaultFilters: ExecutionFiltersState = {
    sortBy: 'started_at',
    sortOrder: 'desc',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render filter controls', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search by execution ID/)).toBeInTheDocument()
  })

  it('should update search query', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    const searchInput = screen.getByPlaceholderText(/Search by execution ID/)
    fireEvent.change(searchInput, { target: { value: 'test query' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      searchQuery: 'test query',
    })
  })

  it('should toggle status filter', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    const completedCheckbox = screen.getByLabelText('Completed')
    fireEvent.click(completedCheckbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: ['completed'],
    })
  })

  it('should toggle multiple status filters', () => {
    const filtersWithStatus: ExecutionFiltersState = {
      ...defaultFilters,
      status: ['completed'],
    }

    render(
      <ExecutionFilters filters={filtersWithStatus} onFiltersChange={mockOnFiltersChange} />
    )

    const runningCheckbox = screen.getByLabelText('Running')
    fireEvent.click(runningCheckbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: ['completed', 'running'],
    })
  })

  it('should remove status when unchecked', () => {
    const filtersWithStatus: ExecutionFiltersState = {
      ...defaultFilters,
      status: ['completed', 'running'],
    }

    render(
      <ExecutionFilters filters={filtersWithStatus} onFiltersChange={mockOnFiltersChange} />
    )

    const completedCheckbox = screen.getByLabelText('Completed')
    fireEvent.click(completedCheckbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: ['running'],
    })
  })

  it('should update workflow filter', () => {
    const workflows = [
      { id: 'workflow-1', name: 'Workflow 1' },
      { id: 'workflow-2', name: 'Workflow 2' },
    ]

    render(
      <ExecutionFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        availableWorkflows={workflows}
      />
    )

    const workflowSelect = screen.getByLabelText('Workflow').closest('select') || screen.getByRole('combobox', { name: /workflow/i })
    fireEvent.change(workflowSelect, { target: { value: 'workflow-1' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      workflowId: 'workflow-1',
    })
  })

  it('should update sort by', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    const sortSelect = screen.getByLabelText('Sort By').closest('select') || screen.getByRole('combobox', { name: /sort by/i })
    fireEvent.change(sortSelect, { target: { value: 'duration' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: 'duration',
    })
  })

  it('should update sort order', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    const orderSelect = screen.getByLabelText('Order').closest('select') || screen.getByRole('combobox', { name: /order/i })
    fireEvent.change(orderSelect, { target: { value: 'asc' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortOrder: 'asc',
    })
  })

  it('should show clear filters button when filters are active', () => {
    const filtersWithStatus: ExecutionFiltersState = {
      ...defaultFilters,
      status: ['completed'],
    }

    render(
      <ExecutionFilters filters={filtersWithStatus} onFiltersChange={mockOnFiltersChange} />
    )

    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('should not show clear filters button when no filters are active', () => {
    render(
      <ExecutionFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
    )

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument()
  })

  it('should clear filters except search query when clear is clicked', () => {
    const filtersWithAll: ExecutionFiltersState = {
      ...defaultFilters,
      status: ['completed'],
      workflowId: 'workflow-1',
      searchQuery: 'test',
    }

    render(
      <ExecutionFilters filters={filtersWithAll} onFiltersChange={mockOnFiltersChange} />
    )

    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: 'test',
    })
  })
})
