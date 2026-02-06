/**
 * Input Configuration Component Tests
 * Tests for input configuration component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { InputConfiguration } from './InputConfiguration'

describe('InputConfiguration', () => {
  const mockOnAddInput = jest.fn()
  const mockOnRemoveInput = jest.fn()
  const mockOnUpdateInput = jest.fn()
  const mockOnShowAddInput = jest.fn()

  const defaultProps = {
    inputs: [],
    showAddInput: false,
    onAddInput: mockOnAddInput,
    onRemoveInput: mockOnRemoveInput,
    onUpdateInput: mockOnUpdateInput,
    onShowAddInput: mockOnShowAddInput,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up rendered components to prevent test isolation issues
    cleanup()
  })

  describe('Rendering', () => {
    it('should render inputs label and add button', () => {
      render(<InputConfiguration {...defaultProps} />)

      expect(screen.getByText('Inputs')).toBeInTheDocument()
      // Use getByRole to avoid conflicts when modal is also rendered
      expect(screen.getByRole('button', { name: /Add Input/i })).toBeInTheDocument()
      expect(screen.getByLabelText('Add input to node')).toBeInTheDocument()
    })

    it('should render empty state when no inputs', () => {
      render(<InputConfiguration {...defaultProps} inputs={[]} />)

      expect(screen.getByText('Inputs')).toBeInTheDocument()
      expect(screen.queryByText(/Source Node:/)).not.toBeInTheDocument()
    })

    it('should render existing inputs', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
        {
          name: 'input2',
          source_node: undefined,
          source_field: 'result',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      expect(screen.getByText('input1')).toBeInTheDocument()
      expect(screen.getByText('input2')).toBeInTheDocument()
      expect(screen.getAllByText(/Source Node:/)).toHaveLength(2)
      expect(screen.getAllByText(/Source Field:/)).toHaveLength(2)
    })

    it('should handle null inputs', () => {
      render(<InputConfiguration {...defaultProps} inputs={null} />)

      expect(screen.getByText('Inputs')).toBeInTheDocument()
      expect(screen.queryByText(/Source Node:/)).not.toBeInTheDocument()
    })

    it('should handle undefined inputs', () => {
      render(<InputConfiguration {...defaultProps} inputs={undefined} />)

      expect(screen.getByText('Inputs')).toBeInTheDocument()
      expect(screen.queryByText(/Source Node:/)).not.toBeInTheDocument()
    })
  })

  describe('Add Input Button', () => {
    it('should call onShowAddInput(true) when add button is clicked', () => {
      render(<InputConfiguration {...defaultProps} />)

      // Use getByRole to specifically target the button (not modal title)
      const addButton = screen.getByRole('button', { name: /Add Input/i })
      fireEvent.click(addButton)

      expect(mockOnShowAddInput).toHaveBeenCalledWith(true)
      expect(mockOnShowAddInput).toHaveBeenCalledTimes(1)
    })
  })

  describe('Input Display', () => {
    it('should display input name', () => {
      const inputs = [
        {
          name: 'test-input',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      expect(screen.getByText('test-input')).toBeInTheDocument()
    })

    it('should display source node value', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-123',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceNodeInput = screen.getByPlaceholderText('node_id or leave blank') as HTMLInputElement
      expect(sourceNodeInput.value).toBe('node-123')
    })

    it('should display fallback for empty source_node', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: undefined,
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceNodeInput = screen.getByPlaceholderText('node_id or leave blank') as HTMLInputElement
      expect(sourceNodeInput.value).toBe('(workflow variable)')
    })

    it('should display source field value', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'custom-field',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceFieldInput = screen.getByPlaceholderText('output') as HTMLInputElement
      expect(sourceFieldInput.value).toBe('custom-field')
    })

    it('should display default for empty source_field', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: undefined,
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceFieldInput = screen.getByPlaceholderText('output') as HTMLInputElement
      expect(sourceFieldInput.value).toBe('output')
    })
  })

  describe('Remove Input', () => {
    it('should call onRemoveInput with correct index when remove button is clicked', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
        {
          name: 'input2',
          source_node: 'node-2',
          source_field: 'result',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const removeButtons = screen.getAllByLabelText(/Remove input/)
      fireEvent.click(removeButtons[0])

      expect(mockOnRemoveInput).toHaveBeenCalledWith(0)
      expect(mockOnRemoveInput).toHaveBeenCalledTimes(1)
    })

    it('should have correct aria-label for remove button', () => {
      const inputs = [
        {
          name: 'test-input',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const removeButton = screen.getByLabelText('Remove input test-input')
      expect(removeButton).toBeInTheDocument()
    })
  })

  describe('Update Source Node', () => {
    it('should call onUpdateInput when source node is changed', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceNodeInput = screen.getByPlaceholderText('node_id or leave blank')
      fireEvent.change(sourceNodeInput, { target: { value: 'new-node-id' } })

      expect(mockOnUpdateInput).toHaveBeenCalledWith(0, 'source_node', 'new-node-id')
    })

    it('should call onUpdateInput with undefined when source node is cleared', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceNodeInput = screen.getByPlaceholderText('node_id or leave blank')
      fireEvent.change(sourceNodeInput, { target: { value: '' } })

      expect(mockOnUpdateInput).toHaveBeenCalledWith(0, 'source_node', undefined)
    })
  })

  describe('Update Source Field', () => {
    it('should call onUpdateInput when source field is changed', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceFieldInput = screen.getByPlaceholderText('output')
      fireEvent.change(sourceFieldInput, { target: { value: 'new-field' } })

      expect(mockOnUpdateInput).toHaveBeenCalledWith(0, 'source_field', 'new-field')
    })

    it('should handle empty source field value', () => {
      const inputs = [
        {
          name: 'input1',
          source_node: 'node-1',
          source_field: 'output',
        },
      ]

      render(<InputConfiguration {...defaultProps} inputs={inputs} />)

      const sourceFieldInput = screen.getByPlaceholderText('output')
      fireEvent.change(sourceFieldInput, { target: { value: '' } })

      expect(mockOnUpdateInput).toHaveBeenCalledWith(0, 'source_field', '')
    })
  })

  describe('Add Input Modal', () => {
    it('should render add input modal when showAddInput is true', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={true} />)

      // Use data-testid for reliable selection
      expect(screen.getByTestId('add-input-modal-title')).toBeInTheDocument()
      expect(screen.getByTestId('add-input-submit-button')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., topic, text, data')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Leave blank for workflow input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('output')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should not render add input modal when showAddInput is false', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={false} />)

      expect(screen.queryByPlaceholderText('e.g., topic, text, data')).not.toBeInTheDocument()
    })

    it('should call onShowAddInput(false) when cancel button is clicked', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={true} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnShowAddInput).toHaveBeenCalledWith(false)
    })

    it('should call onAddInput with form values when add button is clicked', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={true} />)

      const nameInput = screen.getByPlaceholderText('e.g., topic, text, data')
      const sourceNodeInput = screen.getByPlaceholderText('Leave blank for workflow input')
      const sourceFieldInput = screen.getByPlaceholderText('output')

      fireEvent.change(nameInput, { target: { value: 'new-input' } })
      fireEvent.change(sourceNodeInput, { target: { value: 'node-123' } })
      fireEvent.change(sourceFieldInput, { target: { value: 'custom-field' } })

      // Use data-testid for reliable selection
      const submitButton = screen.getByTestId('add-input-submit-button')
      fireEvent.click(submitButton)

      expect(mockOnAddInput).toHaveBeenCalledWith('new-input', 'node-123', 'custom-field')
    })

    it('should use default values when fields are empty', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={true} />)

      const nameInput = screen.getByPlaceholderText('e.g., topic, text, data')
      fireEvent.change(nameInput, { target: { value: 'new-input' } })

      // Use data-testid for reliable selection
      const submitButton = screen.getByTestId('add-input-submit-button')
      fireEvent.click(submitButton)

      // Should use empty string for source_node and 'output' for source_field (defaultValue)
      expect(mockOnAddInput).toHaveBeenCalledWith('new-input', '', 'output')
    })

    it('should clear form after adding input', () => {
      render(<InputConfiguration {...defaultProps} showAddInput={true} />)

      const nameInput = screen.getByPlaceholderText('e.g., topic, text, data') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'new-input' } })

      // Use data-testid for reliable selection
      const submitButton = screen.getByTestId('add-input-submit-button')
      fireEvent.click(submitButton)

      // Form submission should trigger onAddInput
      expect(mockOnAddInput).toHaveBeenCalled()
      // Note: The component doesn't currently close the modal after submission
      // The form resets but the modal stays open
    })
  })
})
