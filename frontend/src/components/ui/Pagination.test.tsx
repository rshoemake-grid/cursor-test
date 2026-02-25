/**
 * Tests for Pagination Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from './Pagination'

describe('Pagination', () => {
  const mockOnPageChange = jest.fn()
  const mockOnItemsPerPageChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render pagination controls', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
  })

  it('should display correct item range', () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    expect(container.textContent).toContain('Showing')
    expect(container.textContent).toContain('21')
    expect(container.textContent).toContain('40')
    expect(container.textContent).toContain('100')
  })

  it('should call onPageChange when next is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange when previous is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByLabelText('Previous page')
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(1)
  })

  it('should disable previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByLabelText('Previous page')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    expect(nextButton).toBeDisabled()
  })

  it('should call onPageChange when page number is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const page3Button = screen.getByLabelText('Go to page 3')
    fireEvent.click(page3Button)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should highlight current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    )

    const page3Button = screen.getByLabelText('Go to page 3')
    expect(page3Button).toHaveAttribute('aria-current', 'page')
  })

  it('should show items per page selector when onItemsPerPageChange is provided', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    expect(screen.getByLabelText('Per page:')).toBeInTheDocument()
  })

  it('should call onItemsPerPageChange when items per page changes', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
        onItemsPerPageChange={mockOnItemsPerPageChange}
      />
    )

    const select = screen.getByLabelText('Per page:')
    fireEvent.change(select, { target: { value: '50' } })

    expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(50)
  })

  it('should not render when totalPages is 1 and no items per page selector', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={10}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should show ellipsis for many pages', () => {
    const { container } = render(
      <Pagination
        currentPage={5}
        totalPages={10}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // Should show ellipsis (there may be multiple, so check container)
    expect(container.textContent).toContain('...')
  })
})
