/**
 * Tests for BulkActionsBar Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import BulkActionsBar from './BulkActionsBar'

describe('BulkActionsBar', () => {
  const mockOnDelete = jest.fn()
  const mockOnClearSelection = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when selectedCount is 0', () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={0}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render when selectedCount is greater than 0', () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText(/3 execution.*selected/)).toBeInTheDocument()
  })

  it('should display correct count for single execution', () => {
    render(
      <BulkActionsBar
        selectedCount={1}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText(/1 execution selected/)).toBeInTheDocument()
  })

  it('should call onDelete when delete button is clicked', () => {
    render(
      <BulkActionsBar
        selectedCount={2}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('should call onClearSelection when clear button is clicked', () => {
    render(
      <BulkActionsBar
        selectedCount={2}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    const clearButton = screen.getByLabelText('Clear selection')
    fireEvent.click(clearButton)

    expect(mockOnClearSelection).toHaveBeenCalledTimes(1)
  })

  it('should disable delete button when isDeleting is true', () => {
    render(
      <BulkActionsBar
        selectedCount={2}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
        isDeleting={true}
      />
    )

    const deleteButton = screen.getByText('Deleting...')
    expect(deleteButton).toBeDisabled()
  })

  it('should show "Deleting..." text when isDeleting is true', () => {
    render(
      <BulkActionsBar
        selectedCount={2}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
        isDeleting={true}
      />
    )

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
  })

  it('should have correct styling', () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={1}
        onDelete={mockOnDelete}
        onClearSelection={mockOnClearSelection}
      />
    )

    const bar = container.firstChild as HTMLElement
    expect(bar).toHaveClass('bg-primary-600', 'text-white')
  })
})
