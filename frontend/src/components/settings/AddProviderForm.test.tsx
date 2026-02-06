/**
 * Add Provider Form Component Tests
 * Tests for add provider form component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddProviderForm } from './AddProviderForm'
import { PROVIDER_TEMPLATES } from '../../constants/settingsConstants'

describe('AddProviderForm', () => {
  const mockOnShowAddProvider = jest.fn()
  const mockOnSelectedTemplateChange = jest.fn()
  const mockOnAddProvider = jest.fn()

  const defaultProps = {
    showAddProvider: false,
    onShowAddProvider: mockOnShowAddProvider,
    selectedTemplate: 'openai' as keyof typeof PROVIDER_TEMPLATES,
    onSelectedTemplateChange: mockOnSelectedTemplateChange,
    onAddProvider: mockOnAddProvider,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when showAddProvider is false', () => {
    it('should render add provider button', () => {
      render(<AddProviderForm {...defaultProps} />)

      const button = screen.getByText('Add LLM Provider')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('border-dashed', 'border-gray-300')
    })

    it('should call onShowAddProvider(true) when button is clicked', () => {
      render(<AddProviderForm {...defaultProps} />)

      const button = screen.getByText('Add LLM Provider')
      fireEvent.click(button)

      expect(mockOnShowAddProvider).toHaveBeenCalledWith(true)
      expect(mockOnShowAddProvider).toHaveBeenCalledTimes(1)
    })

    it('should have hover styles on button', () => {
      const { container } = render(<AddProviderForm {...defaultProps} />)

      const button = container.querySelector('button')
      expect(button).toHaveClass('hover:border-primary-500', 'hover:text-primary-600')
    })
  })

  describe('when showAddProvider is true', () => {
    it('should render add provider form', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      expect(screen.getByText('Add New Provider')).toBeInTheDocument()
      expect(screen.getByLabelText('Select Provider Type')).toBeInTheDocument()
      expect(screen.getByText('Add Provider')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should render all provider type options', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      const select = screen.getByLabelText('Select Provider Type') as HTMLSelectElement
      expect(select.options[0].text).toBe('OpenAI (GPT-4, GPT-3.5, etc.)')
      expect(select.options[1].text).toBe('Anthropic (Claude)')
      expect(select.options[2].text).toBe('Google Gemini')
      expect(select.options[3].text).toBe('Custom Provider')
    })

    it('should display selected template value', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} selectedTemplate="anthropic" />)

      const select = screen.getByLabelText('Select Provider Type') as HTMLSelectElement
      expect(select.value).toBe('anthropic')
    })

    it('should call onSelectedTemplateChange when template is changed', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      const select = screen.getByLabelText('Select Provider Type')
      fireEvent.change(select, { target: { value: 'gemini' } })

      expect(mockOnSelectedTemplateChange).toHaveBeenCalledWith('gemini')
      expect(mockOnSelectedTemplateChange).toHaveBeenCalledTimes(1)
    })

    it('should call onAddProvider when add button is clicked', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      const addButton = screen.getByText('Add Provider')
      fireEvent.click(addButton)

      expect(mockOnAddProvider).toHaveBeenCalledTimes(1)
    })

    it('should call onShowAddProvider(false) when cancel button is clicked', () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnShowAddProvider).toHaveBeenCalledWith(false)
      expect(mockOnShowAddProvider).toHaveBeenCalledTimes(1)
    })

    it('should have proper form styling', () => {
      const { container } = render(<AddProviderForm {...defaultProps} showAddProvider={true} />)

      const form = container.querySelector('.bg-white')
      expect(form).toBeInTheDocument()
      expect(form).toHaveClass('rounded-lg', 'shadow-sm', 'border', 'border-gray-200', 'p-6')
    })
  })
})
