import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Bot, GitBranch, RotateCw, Play, Flag, Database, Radio, Folder, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { logger } from '../utils/logger'
import { STORAGE_KEYS } from '../config/constants'
import type { StorageAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { showSuccess, showError } from '../utils/notifications'

const workflowNodeTemplates = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-primary-600', description: 'Workflow entry point' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-purple-600', description: 'If/else branching' },
  { type: 'loop', label: 'Loop', icon: RotateCw, color: 'text-green-600', description: 'Iterate over items' },
  { type: 'end', label: 'End', icon: Flag, color: 'text-gray-600', description: 'Workflow completion' },
]

const defaultAgentNodeTemplates = [
  { type: 'agent', label: 'Agent', icon: Bot, color: 'text-blue-600', description: 'LLM-powered agent (Workflow or ADK)' },
  { type: 'agent', label: 'ADK Agent', icon: Bot, color: 'text-indigo-600', description: 'Google ADK agent (Gemini, tools)', agentType: 'adk' as const },
]

const dataNodeTemplates = [
  { type: 'gcp_bucket', label: 'GCP Bucket', icon: Database, color: 'text-orange-600', description: 'Read from Google Cloud Storage bucket' },
  { type: 'aws_s3', label: 'AWS S3', icon: Database, color: 'text-yellow-600', description: 'Read from AWS S3 bucket' },
  { type: 'gcp_pubsub', label: 'GCP Pub/Sub', icon: Radio, color: 'text-purple-600', description: 'Subscribe to GCP Pub/Sub topic' },
  { type: 'local_filesystem', label: 'Local File', icon: Folder, color: 'text-green-600', description: 'Read from local file system' },
  { type: 'database', label: 'Database', icon: Database, color: 'text-indigo-600', description: 'Connect to database and query data' },
  { type: 'firebase', label: 'Firebase', icon: Database, color: 'text-orange-600', description: 'Connect to Firebase services (Firestore, Realtime DB, Storage)' },
  { type: 'bigquery', label: 'BigQuery', icon: Database, color: 'text-blue-600', description: 'Query Google BigQuery data warehouse' },
]

interface NodePanelProps {
  // Dependency injection
  storage?: StorageAdapter | null
  logger?: typeof logger
}

export default function NodePanel({
  storage = defaultAdapters.createLocalStorageAdapter(),
  logger: injectedLogger = logger
}: NodePanelProps = {}) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    workflowNodes: false,
    agentNodes: true, // Expanded by default so users see Agent and ADK Agent options
    dataNodes: false,
  })
  const [customAgentNodes, setCustomAgentNodes] = useState<any[]>([])
  
  // Use refs to avoid stale closures in event handlers
  const storageRef = useRef(storage)
  const loggerRef = useRef(injectedLogger)
  
  // Update refs when props change
  useEffect(() => {
    storageRef.current = storage
    loggerRef.current = injectedLogger
  }, [storage, injectedLogger])

  useEffect(() => {
    // Load custom agent nodes from storage
    const loadAgentNodes = () => {
      const currentStorage = storageRef.current
      if (!currentStorage) return
      
      try {
        const savedAgentNodes = currentStorage.getItem('customAgentNodes')
        if (savedAgentNodes) {
          const parsed = JSON.parse(savedAgentNodes)
          if (Array.isArray(parsed)) {
            setCustomAgentNodes(parsed)
          }
        }
      } catch (error) {
        loggerRef.current.error('Failed to load custom agent nodes:', error)
      }
    }

    // Initial load
    loadAgentNodes()

    // Listen for storage changes to update when agent nodes are added
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.CUSTOM_AGENT_NODES) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : []
          if (Array.isArray(parsed)) {
            setCustomAgentNodes(parsed)
          }
        } catch (error) {
          loggerRef.current.error('Failed to parse custom agent nodes:', error)
        }
      }
    }

    // Always use window.addEventListener for storage events (browser API)
    // StorageAdapter is only for getItem/setItem operations
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }
    
    // Also listen for custom event for same-window updates
    const handleCustomStorageChange = () => {
      loadAgentNodes()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('customAgentNodesUpdated', handleCustomStorageChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('customAgentNodesUpdated', handleCustomStorageChange)
      }
    }
  }, []) // Only run once on mount

  const agentNodeTemplates = useMemo(() => {
    return [...defaultAgentNodeTemplates, ...customAgentNodes.map(node => ({
      type: 'agent',
      label: node.label || 'Custom Agent',
      icon: Bot,
      color: 'text-blue-600',
      description: node.description || 'Custom LLM-powered agent',
      customData: node
    } as any))]
  }, [customAgentNodes])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportAgent = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    const currentStorage = storageRef.current
    if (!currentStorage) {
      showError('Storage not available')
      return
    }

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })
      const parsed = JSON.parse(text)

      // Support multiple formats: { label, description, agent_config } or { data: { ... } }
      let agentConfig = parsed.agent_config ?? parsed.data?.agent_config
      let label = parsed.label ?? parsed.name ?? parsed.data?.label ?? parsed.data?.name
      let description = parsed.description ?? parsed.data?.description ?? ''

      if (!agentConfig || typeof agentConfig !== 'object') {
        showError('Invalid agent config: missing agent_config')
        return
      }

      const agentTemplate = {
        id: `agent_${Date.now()}`,
        label: label || 'Imported Agent',
        description: description || '',
        agent_config: agentConfig,
        type: 'agent',
      }

      const savedAgentNodes = currentStorage.getItem(STORAGE_KEYS.CUSTOM_AGENT_NODES)
      const agentNodes = savedAgentNodes ? JSON.parse(savedAgentNodes) : []
      agentNodes.push(agentTemplate)
      currentStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(agentNodes))

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('customAgentNodesUpdated'))
      }
      setCustomAgentNodes(agentNodes)
      showSuccess(`Agent "${agentTemplate.label}" imported. Drag from palette to add to canvas.`)
    } catch (err) {
      loggerRef.current.error('Failed to import agent config:', err)
      showError(err instanceof Error ? err.message : 'Failed to import agent config')
    }
  }, [])

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, customData?: any, templateData?: { agentType?: string; label?: string }) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    if (customData) {
      event.dataTransfer.setData('application/custom-agent', JSON.stringify(customData))
    } else if (templateData?.agentType) {
      event.dataTransfer.setData('application/custom-agent', JSON.stringify({
        label: templateData.label,
        agent_config: { agent_type: templateData.agentType, adk_config: { name: 'adk_agent' } },
      }))
    }
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Palette</h3>
      <p className="text-sm text-gray-600 mb-4">Drag nodes onto the canvas</p>
      
      {/* Workflow Nodes Category */}
      <div className="space-y-2">
        <button
          onClick={() => toggleCategory('workflowNodes')}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-gray-700 transition-colors"
        >
          <span>Workflow Nodes</span>
          {expandedCategories.workflowNodes ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {expandedCategories.workflowNodes && (
          <div className="space-y-2">
            {workflowNodeTemplates.map((template) => {
              const Icon = template.icon
              return (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type)}
                  className="p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${template.color}`} />
                    <span className="font-medium text-sm text-gray-900">{template.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Agent Nodes Category */}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => toggleCategory('agentNodes')}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 hover:text-gray-900 transition-colors"
        >
          <span>Agent Nodes</span>
          {expandedCategories.agentNodes ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {expandedCategories.agentNodes && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportAgent}
              className="hidden"
              aria-hidden="true"
              data-testid="import-agent-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              title="Import agent config from JSON file"
            >
              <Upload className="w-4 h-4" />
              Import Agent
            </button>
            {agentNodeTemplates.map((template, index) => {
              const Icon = template.icon
              const key = (template as any).customData ? `custom-${(template as any).customData.id}` : `${template.type}-${index}`
              const templateData = (template as any).agentType ? { agentType: (template as any).agentType, label: template.label } : undefined
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type, (template as any).customData, templateData)}
                  className="p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${template.color}`} />
                    <span className="font-medium text-sm text-gray-900">{template.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Data Nodes Category */}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => toggleCategory('dataNodes')}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 hover:text-gray-900 transition-colors"
        >
          <span>Data Nodes</span>
          {expandedCategories.dataNodes ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {expandedCategories.dataNodes && (
          <div className="space-y-2">
            {dataNodeTemplates.map((template) => {
              const Icon = template.icon
              return (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type)}
                  className="p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${template.color}`} />
                    <span className="font-medium text-sm text-gray-900">{template.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-xs font-semibold text-blue-900 mb-1">💡 Tip</h4>
        <p className="text-xs text-blue-700">
          Connect nodes by dragging from the circles (handles) on each node.
        </p>
      </div>
    </div>
  )
}

