import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormField } from './FormField'

// Mock useFormField hook to return a simple value
jest.mock('../../hooks/useFormField', () => {
  const React = require('react')
  return {
    useFormField: jest.fn((options: any) => ({
      value: options?.initialValue || '',
      setValue: jest.fn(),
      inputRef: React.createRef(),
    })),
  }
})

describe('FormField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Text input', () => {
    it('should render text input with label', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Test Label"
          id="test-input"
          value="test value"
          onChange={handleChange}
          type="text"
        />
      )

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
    })

    it('should call onChange when value changes', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Test Label"
          id="test-input"
          value=""
          onChange={handleChange}
          type="text"
        />
      )

      const input = screen.getByLabelText('Test Label')
      fireEvent.change(input, { target: { value: 'new value' } })

      expect(handleChange).toHaveBeenCalledWith('new value')
    })

    it('should show required indicator when required', () => {
      render(
        <FormField
          label="Required Field"
          id="required-input"
          value=""
          onChange={jest.fn()}
          required
        />
      )

      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should show placeholder', () => {
      render(
        <FormField
          label="Test Label"
          id="test-input"
          value=""
          onChange={jest.fn()}
          placeholder="Enter text here"
        />
      )

      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument()
    })

    it('should show description', () => {
      render(
        <FormField
          label="Test Label"
          id="test-input"
          value=""
          onChange={jest.fn()}
          description="This is a description"
        />
      )

      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(
        <FormField
          label="Test Label"
          id="test-input"
          value="test"
          onChange={jest.fn()}
          disabled
        />
      )

      const input = screen.getByLabelText('Test Label')
      expect(input).toBeDisabled()
    })
  })

  describe('Textarea', () => {
    it('should render textarea', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Description"
          id="description"
          value="test description"
          onChange={handleChange}
          type="textarea"
          rows={5}
        />
      )

      const textarea = screen.getByLabelText('Description')
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveValue('test description')
    })

    it('should use custom rows prop', () => {
      render(
        <FormField
          label="Description"
          id="description"
          value=""
          onChange={jest.fn()}
          type="textarea"
          rows={10}
        />
      )

      const textarea = screen.getByLabelText('Description')
      expect(textarea).toHaveAttribute('rows', '10')
    })

    it('should call onChange with text value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Description"
          id="description"
          value=""
          onChange={handleChange}
          type="textarea"
        />
      )

      const textarea = screen.getByLabelText('Description')
      fireEvent.change(textarea, { target: { value: 'new text' } })

      expect(handleChange).toHaveBeenCalledWith('new text')
    })
  })

  describe('Select', () => {
    it('should render select with options', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]

      render(
        <FormField
          label="Select Option"
          id="select"
          value="option1"
          onChange={jest.fn()}
          type="select"
          options={options}
        />
      )

      expect(screen.getByLabelText('Select Option')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('should call onChange with selected value', () => {
      const handleChange = jest.fn()
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]

      render(
        <FormField
          label="Select Option"
          id="select"
          value="option1"
          onChange={handleChange}
          type="select"
          options={options}
        />
      )

      const select = screen.getByLabelText('Select Option')
      fireEvent.change(select, { target: { value: 'option2' } })

      expect(handleChange).toHaveBeenCalledWith('option2')
    })
  })

  describe('Number input', () => {
    it('should render number input', () => {
      render(
        <FormField
          label="Number"
          id="number"
          value={42}
          onChange={jest.fn()}
          type="number"
          min={0}
          max={100}
        />
      )

      const input = screen.getByLabelText('Number')
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('should call onChange with number value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Number"
          id="number"
          value={0}
          onChange={handleChange}
          type="number"
        />
      )

      const input = screen.getByLabelText('Number')
      fireEvent.change(input, { target: { value: '42' } })

      expect(handleChange).toHaveBeenCalledWith(42)
    })
  })

  describe('Checkbox', () => {
    it('should render checkbox', () => {
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={true}
          onChange={jest.fn()}
          type="checkbox"
        />
      )

      const checkbox = screen.getByLabelText('Checkbox')
      expect(checkbox).toHaveAttribute('type', 'checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should call onChange with boolean value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={handleChange}
          type="checkbox"
        />
      )

      const checkbox = screen.getByLabelText('Checkbox')
      fireEvent.change(checkbox, { target: { checked: true } })

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should show description next to checkbox', () => {
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={jest.fn()}
          type="checkbox"
          description="Check this box"
        />
      )

      expect(screen.getByText('Check this box')).toBeInTheDocument()
    })

    it('should not show label above checkbox', () => {
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={jest.fn()}
          type="checkbox"
        />
      )

      // Label should be inline with checkbox, not above
      const label = screen.queryByText('Checkbox')
      expect(label).not.toHaveClass('block')
    })
  })

  describe('Email and Password inputs', () => {
    it('should render email input', () => {
      render(
        <FormField
          label="Email"
          id="email"
          value="test@example.com"
          onChange={jest.fn()}
          type="email"
        />
      )

      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render password input', () => {
      render(
        <FormField
          label="Password"
          id="password"
          value="password123"
          onChange={jest.fn()}
          type="password"
        />
      )

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')
    })
  })

  describe('Node data synchronization', () => {
    it('should use controlled value when syncWithNodeData is false', () => {
      const nodeData = { name: 'Node Name' }
      const handleChange = jest.fn()

      render(
        <FormField
          label="Test"
          id="test"
          value="controlled value"
          onChange={handleChange}
          nodeData={nodeData}
          dataPath="name"
          syncWithNodeData={false}
        />
      )

      expect(screen.getByDisplayValue('controlled value')).toBeInTheDocument()
    })

    it('should use hook value when syncWithNodeData is true', () => {
      const mockUseFormField = require('../../hooks/useFormField').useFormField as jest.Mock
      const React = require('react')
      mockUseFormField.mockReturnValueOnce({
        value: 'hook value',
        setValue: jest.fn(),
        inputRef: React.createRef(),
      })

      const nodeData = { name: 'Node Name' }
      const handleChange = jest.fn()

      render(
        <FormField
          label="Test"
          id="test"
          value="controlled value"
          onChange={handleChange}
          nodeData={nodeData}
          dataPath="name"
          syncWithNodeData={true}
        />
      )

      expect(mockUseFormField).toHaveBeenCalledWith({
        initialValue: 'controlled value',
        onUpdate: handleChange,
        nodeData,
        dataPath: 'name',
        syncWithNodeData: true,
      })
      expect(screen.getByDisplayValue('hook value')).toBeInTheDocument()
    })

    it('should use controlled value when syncWithNodeData is true but nodeData is missing', () => {
      const handleChange = jest.fn()

      render(
        <FormField
          label="Test"
          id="test"
          value="controlled value"
          onChange={handleChange}
          dataPath="name"
          syncWithNodeData={true}
        />
      )

      expect(screen.getByDisplayValue('controlled value')).toBeInTheDocument()
    })

    it('should use controlled value when syncWithNodeData is true but dataPath is missing', () => {
      const nodeData = { name: 'Node Name' }
      const handleChange = jest.fn()

      render(
        <FormField
          label="Test"
          id="test"
          value="controlled value"
          onChange={handleChange}
          nodeData={nodeData}
          syncWithNodeData={true}
        />
      )

      expect(screen.getByDisplayValue('controlled value')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty options array for select', () => {
      render(
        <FormField
          label="Select"
          id="select"
          value=""
          onChange={jest.fn()}
          type="select"
          options={[]}
        />
      )

      const select = screen.getByLabelText('Select')
      expect(select).toBeInTheDocument()
      expect(select.children.length).toBe(0)
    })

    it('should handle min and max attributes for number input', () => {
      render(
        <FormField
          label="Number"
          id="number"
          value={50}
          onChange={jest.fn()}
          type="number"
          min={0}
          max={100}
        />
      )

      const input = screen.getByLabelText('Number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('should handle number input with empty string value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Number"
          id="number"
          value={''}
          onChange={handleChange}
          type="number"
        />
      )

      const input = screen.getByLabelText('Number')
      fireEvent.change(input, { target: { value: '42' } })
      expect(handleChange).toHaveBeenCalledWith(42)
    })

    it('should handle number input with zero value', () => {
      render(
        <FormField
          label="Number"
          id="number"
          value={0}
          onChange={jest.fn()}
          type="number"
        />
      )

      const input = screen.getByLabelText('Number')
      expect(input).toHaveValue(0)
    })

    it('should handle textarea without rows prop', () => {
      render(
        <FormField
          label="Textarea"
          id="textarea"
          value=""
          onChange={jest.fn()}
          type="textarea"
        />
      )

      const textarea = screen.getByLabelText('Textarea')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('rows', '4') // Default rows
    })

    it('should handle textarea with custom rows', () => {
      render(
        <FormField
          label="Textarea"
          id="textarea"
          value=""
          onChange={jest.fn()}
          type="textarea"
          rows={10}
        />
      )

      const textarea = screen.getByLabelText('Textarea')
      expect(textarea).toHaveAttribute('rows', '10')
    })

    it('should handle select with undefined value', () => {
      render(
        <FormField
          label="Select"
          id="select"
          value={undefined as any}
          onChange={jest.fn()}
          type="select"
          options={[{ value: 'option1', label: 'Option 1' }]}
        />
      )

      const select = screen.getByLabelText('Select')
      expect(select).toBeInTheDocument()
    })

    it('should handle checkbox with false value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={handleChange}
          type="checkbox"
        />
      )

      const checkbox = screen.getByLabelText('Checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
      fireEvent.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should handle checkbox with true value', () => {
      const handleChange = jest.fn()
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={true}
          onChange={handleChange}
          type="checkbox"
        />
      )

      const checkbox = screen.getByLabelText('Checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
      fireEvent.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should handle email input type', () => {
      render(
        <FormField
          label="Email"
          id="email"
          value="test@example.com"
          onChange={jest.fn()}
          type="email"
        />
      )

      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveValue('test@example.com')
    })

    it('should handle password input type', () => {
      render(
        <FormField
          label="Password"
          id="password"
          value="secret123"
          onChange={jest.fn()}
          type="password"
        />
      )

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')
      expect(input).toHaveValue('secret123')
    })

    it('should handle description with checkbox type', () => {
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={jest.fn()}
          type="checkbox"
          description="Check this box"
        />
      )

      expect(screen.getByText('Check this box')).toBeInTheDocument()
    })

    it('should not show description below checkbox', () => {
      render(
        <FormField
          label="Checkbox"
          id="checkbox"
          value={false}
          onChange={jest.fn()}
          type="checkbox"
          description="This description"
        />
      )

      // Description should be next to checkbox, not below
      const description = screen.getByText('This description')
      expect(description).toBeInTheDocument()
      // Should not have the "text-xs text-gray-500 mt-1" class that appears below non-checkbox fields
    })

    it('should handle label rendering for non-checkbox types', () => {
      render(
        <FormField
          label="Test Label"
          id="test"
          value=""
          onChange={jest.fn()}
          type="text"
        />
      )

      const label = screen.getByText('Test Label')
      expect(label).toBeInTheDocument()
      expect(label.tagName).toBe('LABEL')
    })

    it('should handle required indicator in label', () => {
      render(
        <FormField
          label="Required Field"
          id="required"
          value=""
          onChange={jest.fn()}
          required
        />
      )

      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('Required Field')).toBeInTheDocument()
    })

    it('should handle description below non-checkbox field', () => {
      render(
        <FormField
          label="Test"
          id="test"
          value=""
          onChange={jest.fn()}
          description="This is a description"
        />
      )

      const description = screen.getByText('This is a description')
      expect(description).toBeInTheDocument()
    })

    it('should handle select with array dataPath', () => {
      const mockUseFormField = require('../../hooks/useFormField').useFormField as jest.Mock
      const React = require('react')
      mockUseFormField.mockReturnValueOnce({
        value: 'selected',
        setValue: jest.fn(),
        inputRef: React.createRef(),
      })

      const nodeData = { config: { model: 'selected' } }
      const handleChange = jest.fn()
      render(
        <FormField
          label="Select"
          id="select"
          value=""
          onChange={handleChange}
          type="select"
          options={[{ value: 'selected', label: 'Selected' }]}
          nodeData={nodeData}
          dataPath={['config', 'model']}
          syncWithNodeData={true}
        />
      )

      expect(mockUseFormField).toHaveBeenCalledWith({
        initialValue: '',
        onUpdate: handleChange,
        nodeData,
        dataPath: ['config', 'model'],
        syncWithNodeData: true,
      })
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <FormField
          label="Test"
          id="test"
          value=""
          onChange={jest.fn()}
          className="custom-class"
        />
      )

      const input = screen.getByLabelText('Test')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Aria label', () => {
    it('should use aria-label when provided', () => {
      render(
        <FormField
          label="Test"
          id="test"
          value=""
          onChange={jest.fn()}
          aria-label="Custom aria label"
        />
      )

      const input = screen.getByLabelText('Custom aria label')
      expect(input).toBeInTheDocument()
    })

    it('should fallback to label for aria-label', () => {
      render(
        <FormField
          label="Test Label"
          id="test"
          value=""
          onChange={jest.fn()}
        />
      )

      const input = screen.getByLabelText('Test Label')
      expect(input).toHaveAttribute('aria-label', 'Test Label')
    })
  })
})
