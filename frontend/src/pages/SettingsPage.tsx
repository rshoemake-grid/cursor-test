import { useState, useEffect, useMemo } from 'react'
import { showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Save, Plus, ArrowLeft } from 'lucide-react'
import type { StorageAdapter, HttpClient, ConsoleAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
// Domain-based imports - Phase 7
import { useLLMProviders, useProviderManagement, type LLMProvider } from '../hooks/providers'
import { SettingsService } from '../services/SettingsService'
import { useSettingsSync } from '../hooks/settings/useSettingsSync'
import { useModelExpansion } from '../hooks/settings/useModelExpansion'
import { useSettingsStateSync } from '../hooks/settings/useSettingsStateSync'
import { ProviderForm } from '../components/settings/ProviderForm'
import { 
  PROVIDER_TEMPLATES, 
  SETTINGS_TABS, 
  DEFAULT_PROVIDER_TEMPLATE 
} from '../constants/settingsConstants'

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
  })
  
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROVIDER_TEMPLATES>(DEFAULT_PROVIDER_TEMPLATE)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [iterationLimit, setIterationLimit] = useState(10)
  const [defaultModel, setDefaultModel] = useState<string>('')
  const [activeTab, setActiveTab] = useState<typeof SETTINGS_TABS.LLM | typeof SETTINGS_TABS.WORKFLOW>(SETTINGS_TABS.LLM)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Model expansion hook (extracted)
  const modelExpansion = useModelExpansion()
  const {
    expandedModels,
    expandedProviders,
    toggleProviderModels,
    toggleModel,
    isModelExpanded,
  } = modelExpansion

  // Settings state sync hook (extracted)
  useSettingsStateSync({
    loadedProviders,
    loadedIterationLimit,
    loadedDefaultModel,
    providers,
    iterationLimit,
    defaultModel,
    settingsLoaded,
    setProviders,
    setIterationLimit,
    setDefaultModel,
    setSettingsLoaded,
    onLoadComplete: (settings) => {
      // Hook handles syncing internally, this is just for notification
      // Mark as loaded when providers are available
      if (settings.providers && settings.providers.length > 0) {
        setSettingsLoaded(true)
      }
    },
  })

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

  // Settings sync hook (extracted)
  const { handleManualSync } = useSettingsSync({
    isAuthenticated,
    token: token || null,
    providers,
    iterationLimit,
    defaultModel,
    settingsService,
    settingsLoaded,
    consoleAdapter,
  })


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
            <SettingsTabButton
              label="LLM Providers"
              isActive={activeTab === SETTINGS_TABS.LLM}
              onClick={() => setActiveTab(SETTINGS_TABS.LLM)}
            />
            <SettingsTabButton
              label="Workflow Generation"
              isActive={activeTab === SETTINGS_TABS.WORKFLOW}
              onClick={() => setActiveTab(SETTINGS_TABS.WORKFLOW)}
            />
          </div>
          <div className="flex-1 space-y-6">
            {activeTab === SETTINGS_TABS.WORKFLOW && (
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

            {activeTab === SETTINGS_TABS.LLM && (
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
                  <ProviderForm
                    key={provider.id}
                    provider={provider}
                    showApiKeys={showApiKeys}
                    expandedProviders={expandedProviders}
                    expandedModels={expandedModels}
                    testingProvider={testingProvider}
                    testResults={testResults}
                    onToggleProviderModels={toggleProviderModels}
                    onToggleApiKeyVisibility={(id) => setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }))}
                    onUpdateProvider={updateProvider}
                    onDeleteProvider={handleDeleteProvider}
                    onAddCustomModel={handleAddCustomModel}
                    onTestProvider={testProvider}
                    onToggleModel={toggleModel}
                    isModelExpanded={isModelExpanded}
                  />
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
