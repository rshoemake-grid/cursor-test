import { useState, useEffect } from 'react'
import { X, Upload, Bot, Workflow } from 'lucide-react'
import { showSuccess, showError } from '../utils/notifications'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface MarketplaceDialogProps {
  isOpen: boolean
  onClose: () => void
  node?: any
  workflowId?: string | null
  workflowName?: string
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
}

type TabType = 'agents' | 'workflows'

import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from '../config/templateConstants'

export default function MarketplaceDialog({ 
  isOpen, 
  onClose, 
  node,
  workflowId,
  workflowName,
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient: _httpClient = defaultAdapters.createHttpClient()
}: MarketplaceDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('agents')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishForm, setPublishForm] = useState({
    category: 'automation',
    tags: '',
    difficulty: 'beginner',
    estimated_time: '',
    name: '',
    description: ''
  })
  const { isAuthenticated, user } = useAuth()

  // Update form when dialog opens or node changes
  useEffect(() => {
    if (isOpen && node) {
      setPublishForm({
        category: 'automation',
        tags: '',
        difficulty: 'beginner',
        estimated_time: '',
        name: node.data?.label || node.data?.name || 'Untitled Agent',
        description: node.data?.description || ''
      })
    }
  }, [isOpen, node])

  if (!isOpen) return null

  const handlePublishAgent = async () => {
    if (!node || node.type !== 'agent') {
      showError('Invalid agent node')
      return
    }

    if (!isAuthenticated) {
      showError('Please sign in to publish to the marketplace')
      return
    }

    setIsPublishing(true)
    try {
      // TODO: Implement agent publishing API endpoint
      // For now, we'll save to localStorage as a custom agent template
      const agentTemplate = {
        id: `agent_${Date.now()}`,
        name: publishForm.name,
        label: publishForm.name, // Also store as label for consistency
        description: publishForm.description,
        category: publishForm.category,
        tags: publishForm.tags.split(',').map(t => t.trim()).filter(t => t),
        difficulty: publishForm.difficulty,
        estimated_time: publishForm.estimated_time || '5 min',
        agent_config: node.data.agent_config || {},
        type: 'agent',
        published_at: new Date().toISOString(),
        author_id: user?.id || null,
        author_name: user?.username || user?.email || null
      }

      // Save to storage for now (until backend API is ready)
      if (!storage) {
        throw new Error('Storage not available')
      }

      const publishedAgents = storage.getItem('publishedAgents')
      const agents = publishedAgents ? JSON.parse(publishedAgents) : []
      agents.push(agentTemplate)
      storage.setItem('publishedAgents', JSON.stringify(agents))

      showSuccess('Agent published to marketplace successfully!')
      onClose()
    } catch (error: any) {
      showError('Failed to publish agent: ' + (error.message || 'Unknown error'))
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublishWorkflow = async () => {
    if (!workflowId) {
      showError('No workflow selected')
      return
    }

    if (!isAuthenticated) {
      showError('Please sign in to publish to the marketplace')
      return
    }

    setIsPublishing(true)
    try {
      await api.publishWorkflow(workflowId, {
        category: publishForm.category,
        tags: publishForm.tags.split(',').map(t => t.trim()).filter(t => t),
        difficulty: publishForm.difficulty,
        estimated_time: publishForm.estimated_time || undefined
      })
      showSuccess('Workflow published to marketplace successfully!')
      onClose()
    } catch (error: any) {
      showError('Failed to publish workflow: ' + (error.message || 'Unknown error'))
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublish = () => {
    if (activeTab === 'agents') {
      handlePublishAgent()
    } else {
      handlePublishWorkflow()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Send to Marketplace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'agents'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Bot className="w-5 h-5" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'workflows'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Workflow className="w-5 h-5" />
            Workflows
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'agents' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={publishForm.name}
                  onChange={(e) => setPublishForm({ ...publishForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe what this agent does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={publishForm.category}
                  onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {formatCategory(cat).split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={publishForm.tags}
                  onChange={(e) => setPublishForm({ ...publishForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., llm, automation, ai"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={publishForm.difficulty}
                    onChange={(e) => setPublishForm({ ...publishForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {TEMPLATE_DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>
                        {formatDifficulty(diff)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    value={publishForm.estimated_time}
                    onChange={(e) => setPublishForm({ ...publishForm, estimated_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 5 min"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Workflow name cannot be changed when publishing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={publishForm.category}
                  onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {formatCategory(cat).split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={publishForm.tags}
                  onChange={(e) => setPublishForm({ ...publishForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., automation, workflow, template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={publishForm.difficulty}
                    onChange={(e) => setPublishForm({ ...publishForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {TEMPLATE_DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>
                        {formatDifficulty(diff)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    value={publishForm.estimated_time}
                    onChange={(e) => setPublishForm({ ...publishForm, estimated_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 10 min"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || (activeTab === 'agents' && !publishForm.name)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publish to Marketplace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

