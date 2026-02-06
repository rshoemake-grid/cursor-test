/**
 * Settings Tab Content Component Tests
 * Tests for settings tab content component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTabContent } from './SettingsTabContent'
import { SETTINGS_TABS, PROVIDER_TEMPLATES } from '../../constants/settingsConstants'
import type { LLMProvider } from '../../hooks/providers'

// Mock ProviderForm component
jest.mock('./ProviderForm', () => ({
  ProviderForm: ({ provider }: { provider: LLMProvider }) => (
    <div data-testid={`provider-form-${provider.id}`}>{provider.name}</div>
  ),
}))

describe('SettingsTabContent', () => {
  const mockProviders: LLMProvider[] = [
    {
      id: 'provider-1',
      name: 'OpenAI',
      type: 'openai',
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com',
      defaultModel: 'gpt-4',
      models: ['gpt-4', 'gpt-3.5-turbo'],
      enabled: true,
    },
  ]

  const defaultProps = {
    activeTab: SETTINGS_TABS.LLM,
    iterationLimit: 10,
    onIterationLimitChange: jest.fn(),
    defaultModel: '',
    onDefaultModelChange: jest.fn(),
    providers: mockProviders,
    showAddProvider: false,
    onShowAddProvider: jest.fn(),
    selectedTemplate: 'openai' as keyof typeof PROVIDER_TEMPLATES,
    onSelectedTemplateChange: jest.fn(),
    onAddProvider: jest.fn(),
    showApiKeys: {},
    expandedProviders: new Set<string>(),
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

  describe('Workflow Tab', () => {
    it('should render workflow tab content when activeTab is WORKFLOW', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.WORKFLOW} />)

      expect(screen.getByLabelText('Iteration limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Default Model')).toBeInTheDocument()
    })

    it('should display current iteration limit', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.WORKFLOW} iterationLimit={15} />)

      const input = screen.getByLabelText('Iteration limit') as HTMLInputElement
      expect(input.value).toBe('15')
    })

    it('should call onIterationLimitChange when iteration limit changes', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.WORKFLOW} />)

      const input = screen.getByLabelText('Iteration limit')
      fireEvent.change(input, { target: { value: '20' } })

      expect(defaultProps.onIterationLimitChange).toHaveBeenCalledWith(20)
    })

    it('should display current default model', () => {
      render(
        <SettingsTabContent
          {...defaultProps}
          activeTab={SETTINGS_TABS.WORKFLOW}
          defaultModel="gpt-4"
        />
      )

      const select = screen.getByLabelText('Default Model') as HTMLSelectElement
      expect(select.value).toBe('gpt-4')
    })

    it('should call onDefaultModelChange when default model changes', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.WORKFLOW} />)

      const select = screen.getByLabelText('Default Model')
      fireEvent.change(select, { target: { value: 'gpt-4' } })

      expect(defaultProps.onDefaultModelChange).toHaveBeenCalledWith('gpt-4')
    })

    it('should show model confirmation when defaultModel is set', () => {
      render(
        <SettingsTabContent
          {...defaultProps}
          activeTab={SETTINGS_TABS.WORKFLOW}
          defaultModel="gpt-4"
        />
      )

      expect(screen.getByText(/✓ Using: gpt-4/)).toBeInTheDocument()
    })
  })

  describe('LLM Tab', () => {
    it('should render LLM tab content when activeTab is LLM', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} />)

      expect(screen.getByText('Add LLM Provider')).toBeInTheDocument()
    })

    it('should show add provider button when showAddProvider is false', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} showAddProvider={false} />)

      expect(screen.getByText('Add LLM Provider')).toBeInTheDocument()
    })

    it('should call onShowAddProvider when add provider button is clicked', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} showAddProvider={false} />)

      const button = screen.getByText('Add LLM Provider')
      fireEvent.click(button)

      expect(defaultProps.onShowAddProvider).toHaveBeenCalledWith(true)
    })

    it('should show add provider form when showAddProvider is true', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} showAddProvider={true} />)

      expect(screen.getByText('Add New Provider')).toBeInTheDocument()
      expect(screen.getByLabelText('Select Provider Type')).toBeInTheDocument()
    })

    it('should call onAddProvider when add button is clicked', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} showAddProvider={true} />)

      const addButton = screen.getByText('Add Provider')
      fireEvent.click(addButton)

      expect(defaultProps.onAddProvider).toHaveBeenCalledTimes(1)
    })

    it('should call onShowAddProvider(false) when cancel button is clicked', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} showAddProvider={true} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(defaultProps.onShowAddProvider).toHaveBeenCalledWith(false)
    })

    it('should render provider forms for each provider', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} />)

      expect(screen.getByTestId('provider-form-provider-1')).toBeInTheDocument()
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
    })

    it('should display auto-sync message', () => {
      render(<SettingsTabContent {...defaultProps} activeTab={SETTINGS_TABS.LLM} />)

      expect(screen.getByText(/Auto-sync enabled/)).toBeInTheDocument()
    })
  })

  it('should return null for unknown tab', () => {
    const { container } = render(
      <SettingsTabContent {...defaultProps} activeTab={'unknown' as any} />
    )

    expect(container.firstChild).toBeNull()
  })
})
