import { useState, useMemo } from 'react'
import { showConfirm } from '../utils/confirm'
import { useAuth } from '../contexts/AuthContext'
import type { StorageAdapter, HttpClient, ConsoleAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
// Domain-based imports - Phase 7
import { useLLMProviders, useProviderManagement, type LLMProvider } from '../hooks/providers'
import { SettingsService } from '../services/SettingsService'
import { useSettingsSync } from '../hooks/settings/useSettingsSync'
import { useModelExpansion } from '../hooks/settings/useModelExpansion'
import { useSettingsStateSync } from '../hooks/settings/useSettingsStateSync'
import { SettingsTabs } from '../components/settings/SettingsTabs'
import { SettingsTabContent } from '../components/settings/SettingsTabContent'
import { SettingsHeader } from '../components/settings/SettingsHeader'
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
  const { isAuthenticated, token } = useAuth()
  
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

  const handleDeleteProvider = async (id: string): Promise<void> => {
    const confirmed = await showConfirm(
      'Delete this provider?',
      { title: 'Delete Provider', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (confirmed) {
      await saveProviders(providers.filter(p => p.id !== id))
    }
  }

  const handleAddCustomModel = (providerId: string) => {
    const modelName = prompt('Enter custom model name:')
    if (modelName) {
      addCustomModel(providerId, modelName)
    }
  }

  const handleTestProvider = (provider: LLMProvider) => {
    testProvider(provider)
  }


  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <SettingsHeader onSyncClick={handleManualSync} />

        <div className="flex gap-8">
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="flex-1 space-y-6">
            <SettingsTabContent
              activeTab={activeTab}
              iterationLimit={iterationLimit}
              onIterationLimitChange={setIterationLimit}
              defaultModel={defaultModel}
              onDefaultModelChange={setDefaultModel}
              providers={providers}
              showAddProvider={showAddProvider}
              onShowAddProvider={setShowAddProvider}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
              onAddProvider={handleAddProvider}
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
              onTestProvider={handleTestProvider}
              onToggleModel={toggleModel}
              isModelExpanded={isModelExpanded}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
