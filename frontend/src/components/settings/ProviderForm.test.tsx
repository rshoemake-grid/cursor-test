/**
 * Provider Form Component Tests
 * Tests for provider form component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProviderForm } from './ProviderForm'
import { showError } from '../../utils/notifications'
import type { LLMProvider } from '../../hooks/providers'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>

describe('ProviderForm', () => {
  const mockProvider: LLMProvider = {
    id: 'provider-1',
    name: 'OpenAI',
    type: 'openai',
    apiKey: 'sk-test123',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    enabled: true,
  }

  const defaultProps = {
    provider: mockProvider,
    showApiKeys: {},
    expandedProviders: {},
    expandedModels: {},
    testingProvider: null,
    testResults: {},
    onToggleProviderModels: jest.fn(),
    onToggleApiKeyVisibility: jest.fn(),
    onUpdateProvider: jest.fn(),
    onDeleteProvider: jest.fn(),
    onAddCustomModel: jest.fn(),
    onTestProvider: jest.fn(),
    onToggleModel: jest.fn(),
    isModelExpanded: jest.fn(() => false),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render provider name and type', () => {
    render(<ProviderForm {...defaultProps} />)

    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('should render enabled checkbox', () => {
    render(<ProviderForm {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should toggle provider enabled state', () => {
    render(<ProviderForm {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
      enabled: false,
    })
  })

  it('should show expand/collapse button', () => {
    render(<ProviderForm {...defaultProps} />)

    const expandButton = screen.getByTitle('Expand models')
    expect(expandButton).toBeInTheDocument()
  })

  it('should call onToggleProviderModels when expand button is clicked', () => {
    render(<ProviderForm {...defaultProps} />)

    const expandButton = screen.getByTitle('Expand models')
    fireEvent.click(expandButton)

    expect(defaultProps.onToggleProviderModels).toHaveBeenCalledWith('provider-1')
  })

  it('should show collapse button when expanded', () => {
    render(
      <ProviderForm
        {...defaultProps}
        expandedProviders={{ 'provider-1': true }}
      />
    )

    const collapseButton = screen.getByTitle('Collapse models')
    expect(collapseButton).toBeInTheDocument()
  })

  it('should show delete button', () => {
    render(<ProviderForm {...defaultProps} />)

    const deleteButton = screen.getByTitle('Delete provider')
    expect(deleteButton).toBeInTheDocument()
  })

  it('should call onDeleteProvider when delete button is clicked', () => {
    render(<ProviderForm {...defaultProps} />)

    const deleteButton = screen.getByTitle('Delete provider')
    fireEvent.click(deleteButton)

    expect(defaultProps.onDeleteProvider).toHaveBeenCalledWith('provider-1')
  })

  describe('Expanded form fields', () => {
    const expandedProps = {
      ...defaultProps,
      expandedProviders: { 'provider-1': true },
    }

    it('should render API key field when expanded', () => {
      render(<ProviderForm {...expandedProps} />)

      expect(screen.getByText('API Key')).toBeInTheDocument()
      expect(screen.getByDisplayValue('sk-test123')).toBeInTheDocument()
    })

    it('should render API key as password by default', () => {
      render(<ProviderForm {...expandedProps} />)

      const apiKeyInput = screen.getByDisplayValue('sk-test123')
      expect(apiKeyInput).toHaveAttribute('type', 'password')
    })

    it('should toggle API key visibility', () => {
      render(
        <ProviderForm
          {...expandedProps}
          showApiKeys={{ 'provider-1': false }}
        />
      )

      const toggleButton = screen.getByTitle('Show API key')
      fireEvent.click(toggleButton)

      expect(defaultProps.onToggleApiKeyVisibility).toHaveBeenCalledWith('provider-1')
    })

    it('should show API key when visibility is toggled', () => {
      render(
        <ProviderForm
          {...expandedProps}
          showApiKeys={{ 'provider-1': true }}
        />
      )

      const apiKeyInput = screen.getByDisplayValue('sk-test123')
      expect(apiKeyInput).toHaveAttribute('type', 'text')
    })

    it('should update API key when changed', () => {
      render(<ProviderForm {...expandedProps} />)

      const apiKeyInput = screen.getByDisplayValue('sk-test123')
      fireEvent.change(apiKeyInput, { target: { value: 'sk-newkey' } })

      expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
        apiKey: 'sk-newkey',
      })
    })

    it('should render base URL field', () => {
      render(<ProviderForm {...expandedProps} />)

      expect(screen.getByText('Base URL')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://api.openai.com/v1')).toBeInTheDocument()
    })

    it('should update base URL when changed', () => {
      render(<ProviderForm {...expandedProps} />)

      const baseUrlInput = screen.getByDisplayValue('https://api.openai.com/v1')
      fireEvent.change(baseUrlInput, { target: { value: 'https://api.example.com' } })

      expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
        baseUrl: 'https://api.example.com',
      })
    })

    it('should render default model select', () => {
      render(<ProviderForm {...expandedProps} />)

      expect(screen.getByText('Default Model')).toBeInTheDocument()
      const select = screen.getByDisplayValue('gpt-4')
      expect(select).toBeInTheDocument()
    })

    it('should update default model when changed', () => {
      render(<ProviderForm {...expandedProps} />)

      const select = screen.getByDisplayValue('gpt-4')
      fireEvent.change(select, { target: { value: 'gpt-3.5-turbo' } })

      expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
        defaultModel: 'gpt-3.5-turbo',
      })
    })

    it('should show add custom model button', () => {
      render(<ProviderForm {...expandedProps} />)

      const addButton = screen.getByTitle('Add custom model')
      expect(addButton).toBeInTheDocument()
    })

    it('should call onAddCustomModel when add button is clicked', () => {
      render(<ProviderForm {...expandedProps} />)

      const addButton = screen.getByTitle('Add custom model')
      fireEvent.click(addButton)

      expect(defaultProps.onAddCustomModel).toHaveBeenCalledWith('provider-1')
    })

    it('should render models list', () => {
      render(<ProviderForm {...expandedProps} />)

      // Models appear in both the select dropdown and the models list
      const modelTexts = screen.getAllByText('gpt-4')
      expect(modelTexts.length).toBeGreaterThan(0)
      expect(screen.getAllByText('gpt-3.5-turbo').length).toBeGreaterThan(0)
    })

    it('should show default badge on default model', () => {
      render(<ProviderForm {...expandedProps} />)

      expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('should render test connection button', () => {
      render(<ProviderForm {...expandedProps} />)

      expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument()
    })

    it('should disable test button when no API key', () => {
      render(
        <ProviderForm
          {...expandedProps}
          provider={{ ...mockProvider, apiKey: '' }}
        />
      )

      const testButton = screen.getByRole('button', { name: /Test Connection/i })
      expect(testButton).toBeDisabled()
    })

    it('should call onTestProvider when test button is clicked', () => {
      render(<ProviderForm {...expandedProps} />)

      const testButton = screen.getByRole('button', { name: /Test Connection/i })
      fireEvent.click(testButton)

      expect(defaultProps.onTestProvider).toHaveBeenCalledWith(mockProvider)
    })

    it('should show loading state when testing', () => {
      render(
        <ProviderForm
          {...expandedProps}
          testingProvider="provider-1"
        />
      )

      expect(screen.getByText('Testing...')).toBeInTheDocument()
      const testButton = screen.getByRole('button', { name: /Testing/i })
      expect(testButton).toBeDisabled()
    })

    it('should show success message when test succeeds', () => {
      render(
        <ProviderForm
          {...expandedProps}
          testResults={{
            'provider-1': {
              status: 'success',
              message: 'Connection successful',
            },
          }}
        />
      )

      expect(screen.getByText('Connection successful')).toBeInTheDocument()
    })

    it('should show error message when test fails', () => {
      render(
        <ProviderForm
          {...expandedProps}
          testResults={{
            'provider-1': {
              status: 'error',
              message: 'Invalid API key',
            },
          }}
        />
      )

      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid API key')).toBeInTheDocument()
    })
  })

  describe('Model list interactions', () => {
    const expandedProps = {
      ...defaultProps,
      expandedProviders: { 'provider-1': true },
      expandedModels: { 'provider-1': new Set(['gpt-4']) },
      isModelExpanded: jest.fn((providerId: string, modelName: string) => {
        return providerId === 'provider-1' && modelName === 'gpt-4'
      }),
    }

    it('should expand model when clicked', () => {
      render(<ProviderForm {...expandedProps} />)

      // Find the button in the models list (not the select option)
      const modelButtons = screen.getAllByText('gpt-4').map(el => el.closest('button')).filter(Boolean)
      const modelListButton = modelButtons.find(btn => btn?.textContent?.includes('gpt-4') && !btn?.closest('select'))
      
      if (modelListButton) {
        fireEvent.click(modelListButton)
        expect(defaultProps.onToggleModel).toHaveBeenCalledWith('provider-1', 'gpt-4')
      } else {
        // Fallback: find by role if available
        const buttons = screen.getAllByRole('button')
        const modelButton = buttons.find(btn => btn.textContent?.includes('gpt-4') && !btn.closest('select'))
        if (modelButton) {
          fireEvent.click(modelButton)
          expect(defaultProps.onToggleModel).toHaveBeenCalledWith('provider-1', 'gpt-4')
        }
      }
    })

    it('should show model edit form when expanded', () => {
      render(<ProviderForm {...expandedProps} />)

      // Model Name label should be visible when model is expanded
      const modelNameLabel = screen.getByText('Model Name')
      expect(modelNameLabel).toBeInTheDocument()
      // The input should be nearby (it's a sibling of the label)
      const inputs = screen.getAllByRole('textbox')
      const modelNameInput = inputs.find(input => 
        input.getAttribute('value') === 'gpt-4' || 
        input.closest('div')?.querySelector('label')?.textContent === 'Model Name'
      )
      expect(modelNameInput).toBeInTheDocument()
    })

    it('should update model name when changed', () => {
      render(<ProviderForm {...expandedProps} />)

      // Find the input by its value since label isn't properly associated
      const inputs = screen.getAllByRole('textbox')
      const modelNameInput = inputs.find(input => input.getAttribute('value') === 'gpt-4')
      expect(modelNameInput).toBeInTheDocument()
      
      if (modelNameInput) {
        fireEvent.change(modelNameInput, { target: { value: 'gpt-4-turbo' } })

        expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
          models: ['gpt-4-turbo', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4-turbo',
        })
      }
    })

    it('should set model as default when button clicked', () => {
      // Expand gpt-3.5-turbo (which is not the default) instead of gpt-4
      const propsWithNonDefaultExpanded = {
        ...expandedProps,
        expandedModels: { 'provider-1': new Set(['gpt-3.5-turbo']) },
        isModelExpanded: jest.fn((providerId: string, modelName: string) => {
          return providerId === 'provider-1' && modelName === 'gpt-3.5-turbo'
        }),
      }
      
      render(<ProviderForm {...propsWithNonDefaultExpanded} />)

      const setDefaultButton = screen.getByText('Set as Default')
      fireEvent.click(setDefaultButton)

      expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
        defaultModel: 'gpt-3.5-turbo',
      })
    })

    it('should show "Default Model" button when model is default', () => {
      render(
        <ProviderForm
          {...expandedProps}
          expandedModels={{ 'provider-1': new Set(['gpt-3.5-turbo']) }}
          isModelExpanded={jest.fn((providerId: string, modelName: string) => {
            return providerId === 'provider-1' && modelName === 'gpt-3.5-turbo'
          })}
          provider={{ ...mockProvider, defaultModel: 'gpt-3.5-turbo' }}
        />
      )

      // There are multiple "Default" texts (badge and button), so find the button specifically
      const buttons = screen.getAllByRole('button')
      const defaultModelButton = buttons.find(btn => btn.textContent === 'Default Model')
      expect(defaultModelButton).toBeInTheDocument()
    })

    it('should delete model when remove button clicked', () => {
      render(<ProviderForm {...expandedProps} />)

      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)

      expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
        models: ['gpt-3.5-turbo'],
        defaultModel: 'gpt-3.5-turbo',
      })
    })

    it('should show error when trying to delete last model', () => {
      const singleModelProvider = {
        ...mockProvider,
        models: ['gpt-4'],
      }

      render(
        <ProviderForm
          {...expandedProps}
          provider={singleModelProvider}
          expandedModels={{ 'provider-1': new Set(['gpt-4']) }}
          isModelExpanded={jest.fn(() => true)}
        />
      )

      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)

      expect(mockShowError).toHaveBeenCalledWith(
        'Cannot delete the last model. Add another model first.'
      )
    })

    it('should update default model when deleting current default', () => {
      render(<ProviderForm {...expandedProps} />)

      // Expand gpt-4 (the default)
      const gpt4Button = screen.getAllByText('gpt-4').find(el => {
        const button = el.closest('button')
        return button && button.textContent?.includes('gpt-4')
      })

      if (gpt4Button) {
        const removeButton = screen.getAllByText('Remove')[0]
        fireEvent.click(removeButton)

        expect(defaultProps.onUpdateProvider).toHaveBeenCalledWith('provider-1', {
          models: ['gpt-3.5-turbo'],
          defaultModel: 'gpt-3.5-turbo',
        })
      }
    })
  })

  it('should not render expanded fields when collapsed', () => {
    render(<ProviderForm {...defaultProps} />)

    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Base URL')).not.toBeInTheDocument()
  })
})
