import { useState, useEffect, useMemo } from 'react'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Save, Plus, Trash2, CheckCircle, XCircle, Loader, ArrowLeft, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'
import type { StorageAdapter, HttpClient, ConsoleAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
// Domain-based imports - Phase 7
import { useLLMProviders, useProviderManagement, type LLMProvider } from '../hooks/providers'
import { SettingsService } from '../services/SettingsService'
import { useAutoSave } from '../hooks/storage'

const PROVIDER_TEMPLATES = {
  openai: {
    name: 'OpenAI',
    type: 'openai' as const,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini']
  },
  anthropic: {
    name: 'Anthropic',
    type: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  gemini: {
    name: 'Google Gemini',
    type: 'gemini' as const,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3-pro-image-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-image',
      'gemini-2.5-flash-preview-09-2025'
    ]
  },
  custom: {
    name: 'Custom Provider',
    type: 'custom' as const,
    baseUrl: '',
    defaultModel: '',
    models: []
  }
}

interface SettingsPageProps {
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
  consoleAdapter?: ConsoleAdapter
}

export default function SettingsPage({
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = '/api',
  consoleAdapter = defaultAdapters.createConsoleAdapter()
}: SettingsPageProps = {}) {
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()
  
  // Create settings service (memoized to avoid recreating on each render)
  const settingsService = useMemo(
    () => new SettingsService(httpClient, storage, apiBaseUrl),
    [httpClient, storage, apiBaseUrl]
  )
  
  // Load LLM providers using centralized hook
  const { providers: loadedProviders, iterationLimit: loadedIterationLimit, defaultModel: loadedDefaultModel } = useLLMProviders({
    storage,
    isAuthenticated,
    onLoadComplete: (settings) => {
      // Sync state when hook loads settings
      setProviders(settings.providers || [])
      if (typeof settings.iteration_limit === 'number') {
        setIterationLimit(settings.iteration_limit)
      }
      if (settings.default_model) {
        setDefaultModel(settings.default_model)
      }
      setSettingsLoaded(true)
    }
  })
  
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROVIDER_TEMPLATES>('openai')
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [expandedModels, setExpandedModels] = useState<Record<string, Set<string>>>({})
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})
  const [iterationLimit, setIterationLimit] = useState(10)
  const [defaultModel, setDefaultModel] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'llm' | 'workflow'>('llm')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Provider management hook
  const {
    saveProviders,
    updateProvider,
    testProvider,
    addCustomModel,
    testingProvider,
    testResults,
  } = useProviderManagement({
    service: settingsService,
    providers,
    setProviders,
    iterationLimit,
    defaultModel,
    token,
  })

  // Sync hook-loaded values to local state when they change
  useEffect(() => {
    if (loadedProviders.length > 0 && providers.length === 0) {
      setProviders(loadedProviders)
    }
  }, [loadedProviders, providers.length])
  
  useEffect(() => {
    if (typeof loadedIterationLimit === 'number' && iterationLimit === 10) {
      setIterationLimit(loadedIterationLimit)
    }
  }, [loadedIterationLimit, iterationLimit])
  
  useEffect(() => {
    if (loadedDefaultModel && !defaultModel) {
      setDefaultModel(loadedDefaultModel)
    }
  }, [loadedDefaultModel, defaultModel])

  // Auto-save settings when they change (after initial load)
  const autoSaveSettings = useMemo(() => async () => {
    if (!isAuthenticated || !token || !settingsLoaded) return
    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel,
      }, token)
      consoleAdapter.log('Settings auto-saved to backend')
    } catch (error) {
      consoleAdapter.error('Failed to auto-save settings:', error)
    }
  }, [settingsService, providers, iterationLimit, defaultModel, isAuthenticated, token, settingsLoaded, consoleAdapter])

  useAutoSave(
    { providers, iterationLimit, defaultModel },
    autoSaveSettings,
    500,
    !!(isAuthenticated && token && settingsLoaded)
  )

  const toggleProviderModels = (providerId: string) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const toggleModel = (providerId: string, modelName: string) => {
    setExpandedModels(prev => {
      const providerModels = prev[providerId] || new Set()
      const newSet = new Set(providerModels)
      if (newSet.has(modelName)) {
        newSet.delete(modelName)
      } else {
        newSet.add(modelName)
      }
      return {
        ...prev,
        [providerId]: newSet
      }
    })
  }

  const isModelExpanded = (providerId: string, modelName: string) => {
    const providerSet = expandedModels[providerId]
    if (!providerSet) {
      return false
    }
    return providerSet.has(modelName)
  }

  const handleAddProvider = () => {
    const template = PROVIDER_TEMPLATES[selectedTemplate]
    const newProvider: LLMProvider = {
      id: `provider_${Date.now()}`,
      name: template.name,
      type: template.type,
      apiKey: '',
      baseUrl: template.baseUrl,
      defaultModel: template.defaultModel,
      models: [...template.models],
      enabled: true
    }
    saveProviders([...providers, newProvider])
    setShowAddProvider(false)
  }

  const handleDeleteProvider = async (id: string) => {
    const confirmed = await showConfirm(
      'Delete this provider?',
      { title: 'Delete Provider', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (confirmed) {
      saveProviders(providers.filter(p => p.id !== id))
    }
  }

  const handleAddCustomModel = (providerId: string) => {
    const modelName = prompt('Enter custom model name:')
    if (modelName) {
      addCustomModel(providerId, modelName)
    }
  }

  const handleManualSync = async () => {
    if (!isAuthenticated) {
      showError('Sign in to sync your LLM settings with the server.')
      return
    }

    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel,
      }, token)
      showSuccess('Settings synced to backend successfully!')
    } catch (error) {
      showError('Error syncing settings: ' + error)
    }
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Main</span>
          </button>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <button
              onClick={handleManualSync}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Sync Now
            </button>
          </div>
          <p className="text-gray-600">Configure LLM providers and workflow generation limits</p>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              {isAuthenticated
                ? `Signed in as ${user?.username || user?.email || 'your account'}`
                : 'Login to sync your LLM providers across devices.'}
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col gap-2 min-w-[170px]">
            <button
              onClick={() => setActiveTab('llm')}
              className={`text-left px-4 py-3 rounded-lg border transition ${
                activeTab === 'llm'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700'
              }`}
            >
              LLM Providers
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`text-left px-4 py-3 rounded-lg border transition ${
                activeTab === 'workflow'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700'
              }`}
            >
              Workflow Generation
            </button>
          </div>
          <div className="flex-1 space-y-6">
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700">Iteration limit</label>
                  <input
                    type="number"
                    min={1}
                    value={iterationLimit}
                    onChange={(e) => setIterationLimit(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500">
                    Number of tool-LLM cycles allowed when using "Chat with LLM".
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700">Default Model</label>
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a model...</option>
                    {providers
                      .filter(p => p.enabled && p.models && p.models.length > 0)
                      .flatMap(provider => 
                        (provider.models || []).map(model => ({
                          value: model,
                          label: `${model} (${provider.name})`
                        }))
                      )
                      .map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Select the default model to use for workflow generation. Only models from enabled providers are shown.
                  </p>
                  {defaultModel && (
                    <p className="text-xs text-green-600">
                      ✓ Using: {defaultModel}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'llm' && (
              <div className="space-y-6">
                {!showAddProvider && (
                  <button
                    onClick={() => setShowAddProvider(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add LLM Provider
                  </button>
                )}

                {showAddProvider && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Provider</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Provider Type
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value as keyof typeof PROVIDER_TEMPLATES)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="openai">OpenAI (GPT-4, GPT-3.5, etc.)</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="gemini">Google Gemini</option>
                          <option value="custom">Custom Provider</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAddProvider}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Add Provider
                        </button>
                        <button
                          onClick={() => setShowAddProvider(false)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {providers.map(provider => (
                  <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={provider.enabled}
                          onChange={(e) => updateProvider(provider.id, { enabled: e.target.checked })}
                          className="w-5 h-5 text-primary-600 rounded"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                          <span className="text-sm text-gray-500 capitalize">{provider.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProviderModels(provider.id)}
                          className="text-gray-600 hover:text-gray-700 p-2"
                          title={expandedProviders[provider.id] ? "Collapse models" : "Expand models"}
                        >
                          {expandedProviders[provider.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Delete provider"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedProviders[provider.id] && (
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
                              onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                              placeholder="sk-..."
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
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
                            onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
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
                              onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              {(provider.models || []).map(model => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAddCustomModel(provider.id)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                              title="Add custom model"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Models List with Accordion */}
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
                                      toggleModel(provider.id, model)
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
                                            updateProvider(provider.id, {
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
                                              updateProvider(provider.id, { defaultModel: model })
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
                                              const newModels = (provider.models || []).filter(m => m !== model)
                                              const newDefaultModel = provider.defaultModel === model 
                                                ? (newModels[0] || '')
                                                : provider.defaultModel
                                              updateProvider(provider.id, {
                                                models: newModels,
                                                defaultModel: newDefaultModel
                                              })
                                              // Remove from expanded state if it was expanded
                                              if (isModelExpanded(provider.id, model)) {
                                                toggleModel(provider.id, model)
                                              }
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
                      </div>
                    )}

                    {/* Test Connection */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => testProvider(provider)}
                        disabled={!provider.apiKey || testingProvider === provider.id}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {testingProvider === provider.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </button>
                      {testResults[provider.id]?.status === 'success' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span>{testResults[provider.id].message}</span>
                        </div>
                      )}
                      {testResults[provider.id]?.status === 'error' && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            <span className="font-medium">Connection failed</span>
                          </div>
                          <p className="text-sm text-red-700 ml-7">{testResults[provider.id].message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-gray-600">
                      <strong>Auto-sync enabled:</strong> Settings are automatically saved when you make changes.
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Settings are automatically synced to the backend server when you make changes.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
