import { useState, useEffect } from 'react'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useNavigate } from 'react-router-dom'
import { Save, Plus, Trash2, CheckCircle, XCircle, Loader, ArrowLeft, Eye, EyeOff } from 'lucide-react'

interface LLMProvider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl?: string
  defaultModel: string
  models: string[]
  enabled: boolean
}

interface TestResult {
  status: 'success' | 'error'
  message: string
}

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
      // Gemini 3.0 models
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3-pro-image-preview',
      // Gemini 2.5 models
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

export default function SettingsPage() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROVIDER_TEMPLATES>('openai')
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  // Load providers from backend on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch('/api/settings/llm')
        if (response.ok) {
          const data = await response.json()
          if (data.providers && data.providers.length > 0) {
            setProviders(data.providers)
            localStorage.setItem('llm_providers', JSON.stringify(data.providers))
            return
          }
        }
      } catch (e) {
        console.log('Could not load from backend, trying localStorage')
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('llm_providers')
      if (saved) {
        try {
          setProviders(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load providers:', e)
        }
      }
    }
    
    loadProviders()
  }, [])

  const saveProviders = async (newProviders: LLMProvider[]) => {
    setProviders(newProviders)
    localStorage.setItem('llm_providers', JSON.stringify(newProviders))
    
    // Auto-save to backend
    try {
      await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: newProviders })
      })
      console.log('Settings auto-synced to backend')
    } catch (error) {
      console.error('Failed to sync settings to backend:', error)
    }
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

  const handleUpdateProvider = (id: string, updates: Partial<LLMProvider>) => {
    saveProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p))
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

  const handleTestProvider = async (provider: LLMProvider) => {
    setTestingProvider(provider.id)
    setTestResults({ ...testResults, [provider.id]: undefined as any })

    try {
      const response = await fetch('/api/settings/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: provider.type,
          api_key: provider.apiKey,
          base_url: provider.baseUrl,
          model: provider.defaultModel
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        setTestResults({ ...testResults, [provider.id]: { status: 'success', message: data.message } })
      } else {
        setTestResults({ ...testResults, [provider.id]: { status: 'error', message: data.message || 'Connection failed' } })
      }
    } catch (error: any) {
      setTestResults({ 
        ...testResults, 
        [provider.id]: { 
          status: 'error', 
          message: error.message || 'Network error - check if backend is running' 
        } 
      })
    } finally {
      setTestingProvider(null)
    }
  }

  const handleAddCustomModel = (providerId: string) => {
    const modelName = prompt('Enter custom model name:')
    if (modelName) {
      const provider = providers.find(p => p.id === providerId)
      if (provider) {
        handleUpdateProvider(providerId, {
          models: [...provider.models, modelName]
        })
      }
    }
  }

  const handleManualSync = async () => {
    try {
      const response = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers })
      })
      if (response.ok) {
        showSuccess('Settings synced to backend successfully!')
      } else {
        showError('Failed to sync settings')
      }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure LLM providers and API keys for your agentic workflows</p>
        </div>

        {/* Providers List */}
        <div className="space-y-6">
          {providers.map(provider => (
            <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={(e) => handleUpdateProvider(provider.id, { enabled: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <span className="text-sm text-gray-500 capitalize">{provider.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProvider(provider.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Delete provider"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys[provider.id] ? "text" : "password"}
                      value={provider.apiKey}
                      onChange={(e) => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
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
                    onChange={(e) => handleUpdateProvider(provider.id, { baseUrl: e.target.value })}
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
                      value={provider.defaultModel}
                      onChange={(e) => handleUpdateProvider(provider.id, { defaultModel: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {provider.models.map(model => (
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

                {/* Test Connection */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleTestProvider(provider)}
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
            </div>
          ))}
        </div>

        {/* Add Provider Button */}
        {!showAddProvider && (
          <button
            onClick={() => setShowAddProvider(true)}
            className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add LLM Provider
          </button>
        )}

        {/* Add Provider Form */}
        {showAddProvider && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

        {/* Sync Settings */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-600">
                <strong>Auto-sync enabled:</strong> Settings are automatically saved when you make changes.
              </p>
            </div>
            <button
              onClick={handleManualSync}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Sync Now
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Click "Sync Now" to manually sync your settings to the backend server.
          </p>
        </div>
      </div>
    </div>
  )
}

