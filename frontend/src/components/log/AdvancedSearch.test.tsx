/**
 * Tests for AdvancedSearch Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AdvancedSearch from './AdvancedSearch'

describe('AdvancedSearch', () => {
  const mockOnSearch = jest.fn()
  const mockOnClear = jest.fn()
  const mockOnToggleAdvanced = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search input', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByPlaceholderText('Search executions...')).toBeInTheDocument()
  })

  it('should call onSearch when input changes', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByPlaceholderText('Search executions...')
    fireEvent.change(input, { target: { value: 'test query' } })

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should display clear button when value is not empty', () => {
    render(
      <AdvancedSearch
        value="test"
        onSearch={mockOnSearch}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('should not display clear button when value is empty', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
      />
    )

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', () => {
    render(
      <AdvancedSearch
        value="test"
        onSearch={mockOnSearch}
        onClear={mockOnClear}
      />
    )

    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)

    expect(mockOnClear).toHaveBeenCalled()
  })

  it('should display toggle advanced button when onToggleAdvanced is provided', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        onToggleAdvanced={mockOnToggleAdvanced}
      />
    )

    expect(screen.getByText(/Show Advanced Filters/i)).toBeInTheDocument()
  })

  it('should call onToggleAdvanced when toggle button is clicked', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        onToggleAdvanced={mockOnToggleAdvanced}
      />
    )

    const toggleButton = screen.getByText(/Show Advanced Filters/i)
    fireEvent.click(toggleButton)

    expect(mockOnToggleAdvanced).toHaveBeenCalled()
  })

  it('should show "Hide" text when showAdvanced is true', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        showAdvanced={true}
        onToggleAdvanced={mockOnToggleAdvanced}
      />
    )

    expect(screen.getByText(/Hide Advanced Filters/i)).toBeInTheDocument()
  })

  it('should accept custom placeholder', () => {
    render(
      <AdvancedSearch
        value=""
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        placeholder="Custom placeholder"
      />
    )

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })
})
