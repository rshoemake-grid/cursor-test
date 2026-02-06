/**
 * Settings Tab Content Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles tab content rendering
 */

import React from 'react'
import { ProviderForm } from './ProviderForm'
import { WorkflowSettingsTab } from './WorkflowSettingsTab'
import { AddProviderForm } from './AddProviderForm'
import { AutoSyncIndicator } from './AutoSyncIndicator'
import { SETTINGS_TABS, PROVIDER_TEMPLATES } from '../../constants/settingsConstants'
import type { LLMProvider } from '../../hooks/providers'

export interface SettingsTabContentProps {
  activeTab: typeof SETTINGS_TABS.LLM | typeof SETTINGS_TABS.WORKFLOW
  
  // Workflow tab props
  iterationLimit: number
  onIterationLimitChange: (limit: number) => void
  defaultModel: string
  onDefaultModelChange: (model: string) => void
  providers: LLMProvider[]
  
  // LLM tab props
  showAddProvider: boolean
  onShowAddProvider: (show: boolean) => void
  selectedTemplate: keyof typeof PROVIDER_TEMPLATES
  onSelectedTemplateChange: (template: keyof typeof PROVIDER_TEMPLATES) => void
  onAddProvider: () => void
  showApiKeys: Record<string, boolean>
  expandedProviders: Record<string, boolean>
  expandedModels: Record<string, Set<string>>
  testingProvider: string | null
  testResults: Record<string, { status: 'success' | 'error'; message: string }>
  onToggleProviderModels: (providerId: string) => void
  onToggleApiKeyVisibility: (id: string) => void
  onUpdateProvider: (id: string, updates: Partial<LLMProvider>) => void
  onDeleteProvider: (id: string) => Promise<void>
  onAddCustomModel: (providerId: string) => void
  onTestProvider: (provider: LLMProvider) => void
  onToggleModel: (providerId: string, model: string) => void
  isModelExpanded: (providerId: string, model: string) => boolean
}

/**
 * Settings Tab Content Component
 * DRY: Centralized tab content rendering
 */
export function SettingsTabContent({
  activeTab,
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  providers,
  showAddProvider,
  onShowAddProvider,
  selectedTemplate,
  onSelectedTemplateChange,
  onAddProvider,
  showApiKeys,
  expandedProviders,
  expandedModels,
  testingProvider,
  testResults,
  onToggleProviderModels,
  onToggleApiKeyVisibility,
  onUpdateProvider,
  onDeleteProvider,
  onAddCustomModel,
  onTestProvider,
  onToggleModel,
  isModelExpanded,
}: SettingsTabContentProps) {
  if (activeTab === SETTINGS_TABS.WORKFLOW) {
    return (
      <WorkflowSettingsTab
        iterationLimit={iterationLimit}
        onIterationLimitChange={onIterationLimitChange}
        defaultModel={defaultModel}
        onDefaultModelChange={onDefaultModelChange}
        providers={providers}
      />
    )
  }

  if (activeTab === SETTINGS_TABS.LLM) {
    return (
      <div className="space-y-6">
        <AddProviderForm
          showAddProvider={showAddProvider}
          onShowAddProvider={onShowAddProvider}
          selectedTemplate={selectedTemplate}
          onSelectedTemplateChange={onSelectedTemplateChange}
          onAddProvider={onAddProvider}
        />

        {providers.map(provider => (
          <ProviderForm
            key={provider.id}
            provider={provider}
            showApiKeys={showApiKeys}
            expandedProviders={expandedProviders}
            expandedModels={expandedModels}
            testingProvider={testingProvider}
            testResults={testResults}
            onToggleProviderModels={onToggleProviderModels}
            onToggleApiKeyVisibility={onToggleApiKeyVisibility}
            onUpdateProvider={onUpdateProvider}
            onDeleteProvider={onDeleteProvider}
            onAddCustomModel={onAddCustomModel}
            onTestProvider={onTestProvider}
            onToggleModel={onToggleModel}
            isModelExpanded={isModelExpanded}
          />
        ))}

        <AutoSyncIndicator />
      </div>
    )
  }

  return null
}
