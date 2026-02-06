/**
 * Workflow Settings Tab Component Tests
 * Tests for workflow settings tab component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowSettingsTab } from './WorkflowSettingsTab'
import type { LLMProvider } from '../../hooks/providers'

describe('WorkflowSettingsTab', () => {
  const mockOnIterationLimitChange = jest.fn()
  const mockOnDefaultModelChange = jest.fn()

  const defaultProviders: LLMProvider[] = [
    {
      id: 'provider-1',
      name: 'OpenAI',
      type: 'openai',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4',
      models: ['gpt-4', 'gpt-3.5-turbo'],
      enabled: true,
    },
    {
      id: 'provider-2',
      name: 'Anthropic',
      type: 'anthropic',
      apiKey: 'sk-test',
      defaultModel: 'claude-3',
      models: ['claude-3-opus', 'claude-3-sonnet'],
      enabled: true,
    },
    {
      id: 'provider-3',
      name: 'Disabled Provider',
      type: 'openai',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4',
      models: ['gpt-4'],
      enabled: false,
    },
  ]

  const defaultProps = {
    iterationLimit: 10,
    onIterationLimitChange: mockOnIterationLimitChange,
    defaultModel: '',
    onDefaultModelChange: mockOnDefaultModelChange,
    providers: defaultProviders,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render iteration limit input', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const input = screen.getByLabelText('Iteration limit') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('number')
    expect(input.value).toBe('10')
    expect(input.min).toBe('1')
  })

  it('should display current iteration limit', () => {
    render(<WorkflowSettingsTab {...defaultProps} iterationLimit={15} />)

    const input = screen.getByLabelText('Iteration limit') as HTMLInputElement
    expect(input.value).toBe('15')
  })

  it('should call onIterationLimitChange when iteration limit changes', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const input = screen.getByLabelText('Iteration limit')
    fireEvent.change(input, { target: { value: '20' } })

    expect(mockOnIterationLimitChange).toHaveBeenCalledWith(20)
  })

  it('should enforce minimum value of 1', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const input = screen.getByLabelText('Iteration limit')
    fireEvent.change(input, { target: { value: '0' } })

    expect(mockOnIterationLimitChange).toHaveBeenCalledWith(1)
  })

  it('should handle invalid input by defaulting to 1', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const input = screen.getByLabelText('Iteration limit')
    fireEvent.change(input, { target: { value: 'abc' } })

    expect(mockOnIterationLimitChange).toHaveBeenCalledWith(1)
  })

  it('should render default model select', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('')
  })

  it('should display current default model', () => {
    render(<WorkflowSettingsTab {...defaultProps} defaultModel="gpt-4" />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    expect(select.value).toBe('gpt-4')
  })

  it('should render model options from enabled providers only', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    const options = Array.from(select.options).map(opt => opt.value)

    // Should include placeholder and models from enabled providers only
    expect(options).toContain('')
    expect(options).toContain('gpt-4')
    expect(options).toContain('gpt-3.5-turbo')
    expect(options).toContain('claude-3-opus')
    expect(options).toContain('claude-3-sonnet')
    // Should NOT include models from disabled provider
    expect(options.filter(opt => opt.includes('Disabled'))).toHaveLength(0)
  })

  it('should format model options with provider name', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    const gpt4Option = Array.from(select.options).find(opt => opt.value === 'gpt-4')
    
    expect(gpt4Option?.text).toBe('gpt-4 (OpenAI)')
  })

  it('should call onDefaultModelChange when model is selected', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    const select = screen.getByLabelText('Default Model')
    fireEvent.change(select, { target: { value: 'gpt-4' } })

    expect(mockOnDefaultModelChange).toHaveBeenCalledWith('gpt-4')
  })

  it('should show model confirmation when defaultModel is set', () => {
    render(<WorkflowSettingsTab {...defaultProps} defaultModel="gpt-4" />)

    expect(screen.getByText(/✓ Using: gpt-4/)).toBeInTheDocument()
  })

  it('should not show model confirmation when defaultModel is empty', () => {
    render(<WorkflowSettingsTab {...defaultProps} defaultModel="" />)

    expect(screen.queryByText(/✓ Using:/)).not.toBeInTheDocument()
  })

  it('should handle providers with no models', () => {
    const providersWithoutModels: LLMProvider[] = [
      {
        id: 'provider-1',
        name: 'OpenAI',
        type: 'openai',
        apiKey: 'sk-test',
        defaultModel: '',
        models: [],
        enabled: true,
      },
    ]

    render(<WorkflowSettingsTab {...defaultProps} providers={providersWithoutModels} />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    // Should only have placeholder option
    expect(select.options.length).toBe(1)
    expect(select.options[0].value).toBe('')
  })

  it('should handle providers with null/undefined models', () => {
    const providersWithNullModels: LLMProvider[] = [
      {
        id: 'provider-1',
        name: 'OpenAI',
        type: 'openai',
        apiKey: 'sk-test',
        defaultModel: '',
        models: undefined as any,
        enabled: true,
      },
    ]

    render(<WorkflowSettingsTab {...defaultProps} providers={providersWithNullModels} />)

    const select = screen.getByLabelText('Default Model') as HTMLSelectElement
    // Should only have placeholder option
    expect(select.options.length).toBe(1)
  })

  it('should render help text for iteration limit', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    expect(screen.getByText(/Number of tool-LLM cycles allowed when using "Chat with LLM"/)).toBeInTheDocument()
  })

  it('should render help text for default model', () => {
    render(<WorkflowSettingsTab {...defaultProps} />)

    expect(screen.getByText(/Select the default model to use for workflow generation/)).toBeInTheDocument()
    expect(screen.getByText(/Only models from enabled providers are shown/)).toBeInTheDocument()
  })
})
