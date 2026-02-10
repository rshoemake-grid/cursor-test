/**
 * Provider Form Component
 * Extracted from SettingsPage to improve SRP compliance and reusability
 * Single Responsibility: Only handles provider form rendering and interactions
 */

import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight, Plus, Loader, CheckCircle, XCircle } from 'lucide-react'
import { showError } from '../../utils/notifications'
import type { LLMProvider } from '../../hooks/providers'

export interface ProviderFormProps {
  provider: LLMProvider
  showApiKeys: Record<string, boolean>
  expandedProviders: Record<string, boolean>
  expandedModels: Record<string, Set<string>>
  testingProvider: string | null
  testResults: Record<string, { status: 'success' | 'error'; message: string }>
  onToggleProviderModels: (providerId: string) => void
  onToggleApiKeyVisibility: (providerId: string) => void
  onUpdateProvider: (id: string, updates: Partial<LLMProvider>) => void
  onDeleteProvider: (id: string) => Promise<void>
  onAddCustomModel: (providerId: string) => void
  onTestProvider: (provider: LLMProvider) => void
  onToggleModel: (providerId: string, modelName: string) => void
  isModelExpanded: (providerId: string, modelName: string) => boolean
}

/**
 * Provider Form Component
 * DRY: Reusable form for all providers
 */
export function ProviderForm({
  provider,
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
}: ProviderFormProps) {
  const isExpanded = expandedProviders[provider.id] || false
  const isTesting = testingProvider === provider.id
  const testResult = testResults[provider.id]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) => onUpdateProvider(provider.id, { enabled: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
            <span className="text-sm text-gray-500 capitalize">{provider.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleProviderModels(provider.id)}
            className="text-gray-600 hover:text-gray-700 p-2"
            title={isExpanded ? "Collapse models" : "Expand models"}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onDeleteProvider(provider.id)}
            className="text-red-600 hover:text-red-700 p-2"
            title="Delete provider"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKeys[provider.id] ? "text" : "password"}
                value={provider.apiKey || ''}
                onChange={(e) => onUpdateProvider(provider.id, { apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => onToggleApiKeyVisibility(provider.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                title={showApiKeys[provider.id] ? "Hide API key" : "Show API key"}
              >
                {showApiKeys[provider.id] ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="text"
              value={provider.baseUrl || ''}
              onChange={(e) => onUpdateProvider(provider.id, { baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Model
            </label>
            <div className="flex gap-2">
              <select
                value={provider.defaultModel || ''}
                onChange={(e) => onUpdateProvider(provider.id, { defaultModel: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {(provider.models || []).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button
                onClick={() => onAddCustomModel(provider.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                title="Add custom model"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Models List */}
          <ModelList
            provider={provider}
            expandedModels={expandedModels}
            onUpdateProvider={onUpdateProvider}
            onToggleModel={onToggleModel}
            isModelExpanded={isModelExpanded}
          />

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onTestProvider(provider)}
              disabled={!provider.apiKey || isTesting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
            {testResult?.status === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>{testResult.message}</span>
              </div>
            )}
            {testResult?.status === 'error' && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Connection failed</span>
                </div>
                <p className="text-sm text-red-700 ml-7">{testResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Model List Component
 * Extracted for better reusability and SRP compliance
 */
interface ModelListProps {
  provider: LLMProvider
  expandedModels: Record<string, Set<string>>
  onUpdateProvider: (id: string, updates: Partial<LLMProvider>) => void
  onToggleModel: (providerId: string, modelName: string) => void
  isModelExpanded: (providerId: string, modelName: string) => boolean
}

function ModelList({
  provider,
  onUpdateProvider,
  onToggleModel,
  isModelExpanded,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  expandedModels: _expandedModels // Unused but part of interface - prefix with underscore to indicate intentionally unused
}: ModelListProps) {
  const handleDeleteModel = (model: string) => {
    if ((provider.models || []).length > 1) {
      const newModels = (provider.models || []).filter(m => m !== model)
      const newDefaultModel = provider.defaultModel === model 
        ? (newModels[0] || '')
        : provider.defaultModel
      onUpdateProvider(provider.id, {
        models: newModels,
        defaultModel: newDefaultModel
      })
      // Remove from expanded state if it was expanded
      if (isModelExpanded(provider.id, model)) {
        onToggleModel(provider.id, model)
      }
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Models
      </label>
      <div className="space-y-1">
        {(provider.models || []).map((model, index) => {
          const modelKey = `${provider.id}-${model}-${index}`
          const isExpanded = isModelExpanded(provider.id, model)
          return (
            <div key={modelKey} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleModel(provider.id, model)
                }}
                className="w-full flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors py-2 text-left"
              >
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-600 font-bold">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </span>
                <span className="font-medium">{model}</span>
                {model === provider.defaultModel && (
                  <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                    Default
                  </span>
                )}
              </button>
              {isExpanded && (
                <div className="ml-6 mt-2 mb-2 space-y-3 pb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => {
                        const newModels = (provider.models || []).map(m => m === model ? e.target.value : m)
                        const newDefaultModel = provider.defaultModel === model ? e.target.value : provider.defaultModel
                        onUpdateProvider(provider.id, {
                          models: newModels,
                          defaultModel: newDefaultModel
                        })
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (provider.defaultModel !== model) {
                          onUpdateProvider(provider.id, { defaultModel: model })
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded ${
                        model === provider.defaultModel
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {model === provider.defaultModel ? 'Default Model' : 'Set as Default'}
                    </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if ((provider.models || []).length > 1) {
                            handleDeleteModel(model)
                          } else {
                            showError('Cannot delete the last model. Add another model first.')
                          }
                        }}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
