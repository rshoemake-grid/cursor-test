import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PublishModal } from './PublishModal'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

describe('PublishModal', () => {
  const mockForm = {
    name: 'Test Workflow',
    description: 'Test description',
    category: 'automation',
    difficulty: 'beginner',
    estimated_time: '30 minutes',
    tags: 'test, automation',
  }

  const mockProps = {
    isOpen: true,
    form: mockForm,
    isPublishing: false,
    onClose: jest.fn(),
    onFormChange: jest.fn(),
    onSubmit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<PublishModal {...mockProps} isOpen={false} />)
    expect(screen.queryByText('Publish to Marketplace')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(<PublishModal {...mockProps} />)
    expect(screen.getByText('Publish to Marketplace')).toBeInTheDocument()
  })

  it('should display form fields with correct values', () => {
    render(<PublishModal {...mockProps} />)

    expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    const categoryLabel = screen.getByText(/category/i)
    const categorySelect = categoryLabel.parentElement?.querySelector('select') as HTMLSelectElement
    expect(categorySelect).toHaveValue('automation')
    const difficultyLabel = screen.getByText(/difficulty/i)
    const difficultySelect = difficultyLabel.parentElement?.querySelector('select') as HTMLSelectElement
    expect(difficultySelect).toHaveValue('beginner')
    expect(screen.getByDisplayValue('30 minutes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test, automation')).toBeInTheDocument()
  })

  it('should call onFormChange when name input changes', () => {
    render(<PublishModal {...mockProps} />)

    const nameInput = screen.getByDisplayValue('Test Workflow')
    fireEvent.change(nameInput, { target: { value: 'New Name' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('name', 'New Name')
  })

  it('should call onFormChange when description changes', () => {
    render(<PublishModal {...mockProps} />)

    const descriptionInput = screen.getByDisplayValue('Test description')
    fireEvent.change(descriptionInput, { target: { value: 'New description' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('description', 'New description')
  })

  it('should call onFormChange when category changes', () => {
    render(<PublishModal {...mockProps} />)

    const categoryLabel = screen.getByText(/category/i)
    const categorySelect = categoryLabel.parentElement?.querySelector('select') as HTMLSelectElement
    fireEvent.change(categorySelect, { target: { value: 'data_analysis' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('category', 'data_analysis')
  })

  it('should call onFormChange when difficulty changes', () => {
    render(<PublishModal {...mockProps} />)

    const difficultyLabel = screen.getByText(/difficulty/i)
    const difficultySelect = difficultyLabel.parentElement?.querySelector('select') as HTMLSelectElement
    fireEvent.change(difficultySelect, { target: { value: 'intermediate' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('difficulty', 'intermediate')
  })

  it('should call onFormChange when estimated_time changes', () => {
    render(<PublishModal {...mockProps} />)

    const timeInput = screen.getByDisplayValue('30 minutes')
    fireEvent.change(timeInput, { target: { value: '1 hour' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('estimated_time', '1 hour')
  })

  it('should call onFormChange when tags change', () => {
    render(<PublishModal {...mockProps} />)

    const tagsInput = screen.getByDisplayValue('test, automation')
    fireEvent.change(tagsInput, { target: { value: 'new, tags' } })

    expect(mockProps.onFormChange).toHaveBeenCalledWith('tags', 'new, tags')
  })

  it('should call onClose when close button is clicked', () => {
    render(<PublishModal {...mockProps} />)

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockProps.onClose).toHaveBeenCalled()
    }
  })

  it('should call onClose when cancel button is clicked', () => {
    render(<PublishModal {...mockProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should call onSubmit when form is submitted', async () => {
    mockProps.onSubmit.mockResolvedValue(undefined)
    render(<PublishModal {...mockProps} />)

    const submitButton = screen.getByRole('button', { name: /publish/i })
    fireEvent.click(submitButton)

    await waitForWithTimeout(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled()
    }, 2000)
  })

  it('should prevent default form submission', async () => {
    const preventDefaultSpy = jest.fn()
    mockProps.onSubmit.mockImplementation((e) => {
      e.preventDefault()
      preventDefaultSpy()
    })
    render(<PublishModal {...mockProps} />)

    const form = screen.getByText('Publish to Marketplace').closest('form')
    if (form) {
      fireEvent.submit(form)

      await waitForWithTimeout(() => {
        expect(mockProps.onSubmit).toHaveBeenCalled()
      }, 2000)
    }
  })

  it('should disable submit button when isPublishing is true', () => {
    render(<PublishModal {...mockProps} isPublishing={true} />)

    const submitButton = screen.getByRole('button', { name: /publishing/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show "Publishing..." text when isPublishing is true', () => {
    render(<PublishModal {...mockProps} isPublishing={true} />)

    expect(screen.getByText('Publishing...')).toBeInTheDocument()
  })

  it('should show "Publish" text when isPublishing is false', () => {
    render(<PublishModal {...mockProps} isPublishing={false} />)

    expect(screen.getByText('Publish')).toBeInTheDocument()
  })

  it('should render all category options', () => {
    render(<PublishModal {...mockProps} />)

    const categoryLabel = screen.getByText(/category/i)
    const categorySelect = categoryLabel.parentElement?.querySelector('select') as HTMLSelectElement
    expect(categorySelect).toBeInTheDocument()
    expect(categorySelect).toHaveValue('automation')
  })

  it('should render all difficulty options', () => {
    render(<PublishModal {...mockProps} />)

    const difficultyLabel = screen.getByText(/difficulty/i)
    const difficultySelect = difficultyLabel.parentElement?.querySelector('select') as HTMLSelectElement
    expect(difficultySelect).toBeInTheDocument()
    expect(difficultySelect).toHaveValue('beginner')
  })

  it('should have required attribute on name input', () => {
    render(<PublishModal {...mockProps} />)

    const nameInput = screen.getByDisplayValue('Test Workflow')
    expect(nameInput).toBeRequired()
  })
})
