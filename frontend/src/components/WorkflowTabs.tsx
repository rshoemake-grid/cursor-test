import { useState, useCallback, useEffect, useRef, MouseEvent, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import WorkflowBuilder, { WorkflowBuilderHandle } from './WorkflowBuilder'
import { api } from '../api/client'
import { showConfirm } from '../utils/confirm'
import { showError, showSuccess } from '../utils/notifications'
import { useLocalStorage, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../hooks/useLocalStorage'
import { logger } from '../utils/logger'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface Execution {
  id: string
  status: string
  startedAt: Date
  nodes: Record<string, any>
  logs: any[]
}

interface WorkflowTabData {
  id: string
  name: string
  workflowId: string | null
  isUnsaved: boolean
  executions: Execution[]
  activeExecutionId: string | null
}

interface WorkflowTabsProps {
  initialWorkflowId?: string | null
  workflowLoadKey?: number // Counter to force new tab creation (required when initialWorkflowId is set)
  onExecutionStart?: (executionId: string) => void
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
}

const WORKFLOW_TABS_STORAGE_KEY = 'workflowTabs'
const ACTIVE_TAB_STORAGE_KEY = 'activeWorkflowTabId'

// Use utility functions instead of direct localStorage access (DIP compliance)
const loadTabsFromStorage = (): WorkflowTabData[] => {
  const tabs = getLocalStorageItem<WorkflowTabData[]>(WORKFLOW_TABS_STORAGE_KEY, [])
  return Array.isArray(tabs) ? tabs : []
}

const loadActiveTabFromStorage = (tabs: WorkflowTabData[]): string | null => {
  const saved = getLocalStorageItem<string | null>(ACTIVE_TAB_STORAGE_KEY, null)
  if (saved && tabs.some(tab => tab.id === saved)) {
    return saved
  }
  return null
}

const saveActiveTabToStorage = (activeTabId: string | null) => {
  if (activeTabId) {
    // Store as JSON string for consistency
    setLocalStorageItem(ACTIVE_TAB_STORAGE_KEY, activeTabId)
  } else {
    // Remove if null
    removeLocalStorageItem(ACTIVE_TAB_STORAGE_KEY)
  }
}

const emptyTabState: WorkflowTabData = {
  id: 'workflow-1',
  name: 'Untitled Workflow',
  workflowId: null,
  isUnsaved: true,
  executions: [],
  activeExecutionId: null
}

// Module-level storage for tabs to persist across remounts
const storedTabs = loadTabsFromStorage()
let globalTabs: WorkflowTabData[] = storedTabs.length > 0 ? storedTabs : [emptyTabState]

const saveTabsToStorage = (tabs: WorkflowTabData[], storage?: StorageAdapter | null) => {
  if (!storage) {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(WORKFLOW_TABS_STORAGE_KEY, JSON.stringify(tabs))
      } catch {
        // ignore quota errors
      }
    }
    return
  }
  
  try {
    storage.setItem(WORKFLOW_TABS_STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // ignore quota errors
  }
}

export default function WorkflowTabs({ 
  initialWorkflowId, 
  workflowLoadKey, 
  onExecutionStart,
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = 'http://localhost:8000/api'
}: WorkflowTabsProps) {
  // Initialize from global tabs (persists across remounts)
  const [tabs, setTabs] = useState<WorkflowTabData[]>(() => {
    return [...globalTabs] // Create a copy
  })
  
  // Load active tab from storage, fallback to first tab
  const initialActiveTabId = loadActiveTabFromStorage(tabs) || tabs[0]?.id || 'workflow-1'
  const [activeTabId, setActiveTabId] = useState<string>(initialActiveTabId)
  
  // Save active tab to storage whenever it changes
  useEffect(() => {
    saveActiveTabToStorage(activeTabId)
  }, [activeTabId])
  
  // Validate that activeTabId still exists in tabs, reset if not
  useEffect(() => {
    if (activeTabId && !tabs.some(tab => tab.id === activeTabId)) {
      // Active tab no longer exists, switch to first tab or create new one
      if (tabs.length > 0) {
        setActiveTabId(tabs[0].id)
      } else {
        // No tabs left, create a new one
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Untitled Workflow',
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null
        }
        setTabs([newTab])
        setActiveTabId(newId)
      }
    }
  }, [tabs, activeTabId])
  
  const processedKeys = useRef<Set<string>>(new Set()) // Track processed workflowId+loadKey combinations
  const tabsRef = useRef<WorkflowTabData[]>(tabs) // Keep ref in sync with tabs state
  const builderRef = useRef<WorkflowBuilderHandle | null>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editingInputRef = useRef<HTMLInputElement | null>(null)
  const renameInFlightRef = useRef(false)
  const { token } = useAuth()
  const templateCategories = [
    'content_creation',
    'data_analysis',
    'customer_service',
    'research',
    'automation',
    'education',
    'marketing',
    'other'
  ]
  const templateDifficulties = ['beginner', 'intermediate', 'advanced']
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishForm, setPublishForm] = useState({
    name: '',
    description: '',
    category: 'automation',
    tags: '',
    difficulty: 'beginner',
    estimated_time: ''
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [storageToastShown, setStorageToastShown] = useState(false)
  const isInitialStoragePresent = storedTabs.length > 0

  // Sync tabsRef and globalTabs with tabs state
  useEffect(() => {
    tabsRef.current = tabs
    globalTabs = [...tabs] // Update global storage
    saveTabsToStorage(tabs, storage)
  }, [tabs])

  useEffect(() => {
    if (isInitialStoragePresent && !storageToastShown) {
      showSuccess('Restored open workflow tabs from your previous session.')
      setStorageToastShown(true)
    }
  }, [isInitialStoragePresent, storageToastShown])

  useEffect(() => {
    if (editingTabId && editingInputRef.current) {
      editingInputRef.current.focus()
      editingInputRef.current.select()
    }
  }, [editingTabId])
  

  // Handle initial workflow from marketplace - ALWAYS create new tab
  // workflowLoadKey increments each time, ensuring new tab even for same workflowId
  useEffect(() => {
    if (initialWorkflowId && workflowLoadKey !== undefined) {
      // Create unique key from workflowId + loadKey
      const uniqueKey = `${initialWorkflowId}-${workflowLoadKey}`
      
      // Only process if we haven't seen this exact combination before
      if (!processedKeys.current.has(uniqueKey)) {
        // Mark this combination as processed IMMEDIATELY to prevent duplicates
        processedKeys.current.add(uniqueKey)
        
        // Always create a new tab, even if workflow is already open in another tab
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Loading...',
          workflowId: initialWorkflowId,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null
        }
        
        setTabs(prev => {
          // Use globalTabs as source of truth if prev seems stale
          const currentTabs = prev.length === 1 && globalTabs.length > 1 ? globalTabs : prev
          
          // Double-check we're not adding a duplicate
          const existingTab = currentTabs.find(t => t.id === newId)
          if (existingTab) {
            return currentTabs
          }
          const newTabs = [...currentTabs, newTab]
          globalTabs = [...newTabs] // Update global storage immediately
          tabsRef.current = newTabs // Update ref immediately
          return newTabs
        })
        setActiveTabId(newId)
      }
    }
  }, [initialWorkflowId, workflowLoadKey])

  const handleNewWorkflow = useCallback(() => {
    const newId = `workflow-${Date.now()}`
    const newTab: WorkflowTabData = {
      id: newId,
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true,
      executions: [],
      activeExecutionId: null
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newId)
  }, [])

  const handleCloseTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const tabToClose = tabs.find(t => t.id === tabId)
    if (tabToClose?.isUnsaved) {
      showConfirm(
        'This workflow has unsaved changes. Close anyway?',
        { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
      ).then((confirmed) => {
        if (!confirmed) return
        setTabs(prev => {
          const filtered = prev.filter(t => t.id !== tabId)
          // If closing active tab, switch to the last tab
          if (tabId === activeTabId && filtered.length > 0) {
            setActiveTabId(filtered[filtered.length - 1].id)
          } else if (tabId === activeTabId) {
            setActiveTabId(null)
          }
          return filtered
        })
      })
      return
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId)
      // If closing active tab, switch to the last tab
      if (tabId === activeTabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      }
      return filtered
    })
  }, [tabs, activeTabId])

  const handleLoadWorkflow = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, workflowId, name, isUnsaved: false }
        : tab
    ))
  }, [])

  const handleWorkflowSaved = useCallback((tabId: string, workflowId: string, name: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, workflowId, name, isUnsaved: false }
        : tab
    ))
  }, [])

  const handleWorkflowModified = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, isUnsaved: true }
        : tab
    ))
  }, [])

  // Handle execution start - add to active tab's executions
  const handleExecutionStart = useCallback((executionId: string) => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (!activeTab) return

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      
      // If this is a real execution ID (not pending), try to replace the oldest pending execution
      // This ensures we replace them in creation order, even if API responses come back out of order
      if (!executionId.startsWith('pending-')) {
        // Find all pending executions
        const pendingExecutions = tab.executions
          .map((exec, idx) => ({ exec, idx }))
          .filter(({ exec }) => exec.id.startsWith('pending-'))
        
        if (pendingExecutions.length > 0) {
          // Replace the oldest pending execution (last in array since new ones are prepended)
          const oldestPending = pendingExecutions[pendingExecutions.length - 1]
          
          return {
            ...tab,
            executions: tab.executions.map((exec, idx) =>
              idx === oldestPending.idx
                ? {
                    ...exec,
                    id: executionId
                  }
                : exec
            ),
            activeExecutionId: executionId
          }
        }
      }
      
      // Check if execution already exists (might have been created by a previous call)
      const existingExecution = tab.executions.find(exec => exec.id === executionId)
      if (existingExecution) {
        // Execution already exists, just update activeExecutionId
        return {
          ...tab,
          activeExecutionId: executionId
        }
      }
      
      // Create new execution (either pending or real)
      const newExecution: Execution = {
        id: executionId,
        status: 'running',
        startedAt: new Date(),
        nodes: {},
        logs: []
      }
      
      return {
        ...tab,
        executions: [newExecution, ...tab.executions],
        activeExecutionId: executionId
      }
    }))

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [tabs, activeTabId, onExecutionStart])

  // Handle closing workflow executions
  const handleCloseWorkflow = useCallback((workflowId: string) => {
    // Find the tab by workflowId and close it
    const tabToClose = tabs.find(t => t.workflowId === workflowId)
    if (!tabToClose) return
    
    // Check for unsaved changes
    if (tabToClose.isUnsaved) {
      showConfirm(
        'This workflow has unsaved changes. Close anyway?',
        { title: 'Unsaved Changes', confirmText: 'Close', cancelText: 'Cancel', type: 'warning' }
      ).then((confirmed) => {
        if (!confirmed) return
        setTabs(prev => {
          const filtered = prev.filter(t => t.id !== tabToClose.id)
          // If closing active tab, switch to the last tab
          if (tabToClose.id === activeTabId && filtered.length > 0) {
            setActiveTabId(filtered[filtered.length - 1].id)
          } else if (tabToClose.id === activeTabId) {
            setActiveTabId(null)
          }
          return filtered
        })
      })
      return
    }
    
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabToClose.id)
      // If closing active tab, switch to the last tab
      if (tabToClose.id === activeTabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      } else if (filtered.length === 0) {
        // If no tabs left, create a new untitled tab
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Untitled Workflow',
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null
        }
        setActiveTabId(newId)
        return [newTab]
      }
      return filtered
    })
  }, [tabs, activeTabId])

  // Handle clearing executions for a workflow
  const handleClearExecutions = useCallback((workflowId: string) => {
    logger.debug('handleClearExecutions called for workflowId:', workflowId)
    setTabs(prev => {
      const updated = prev.map(tab => 
        tab.workflowId === workflowId
          ? { ...tab, executions: [], activeExecutionId: null }
          : tab
      )
      logger.debug('Updated tabs:', updated)
      return updated
    })
  }, [])

  // Handle removing a single execution
  const handleRemoveExecution = useCallback((workflowId: string, executionId: string) => {
    logger.debug('handleRemoveExecution called for workflowId:', workflowId, 'executionId:', executionId)
    setTabs(prev => prev.map(tab => {
      if (tab.workflowId !== workflowId) return tab
      
      const updatedExecutions = tab.executions.filter(exec => exec.id !== executionId)
      const newActiveExecutionId = tab.activeExecutionId === executionId 
        ? (updatedExecutions.length > 0 ? updatedExecutions[0].id : null)
        : tab.activeExecutionId
      
      return {
        ...tab,
        executions: updatedExecutions,
        activeExecutionId: newActiveExecutionId
      }
    }))
  }, [])

  // Handle real-time log updates from WebSocket
  const handleExecutionLogUpdate = useCallback((workflowId: string, executionId: string, log: any) => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    logs: [...exec.logs, log]
                  }
                : exec
            )
          }
        : tab
    ))
  }, [])

  // Handle execution status updates from WebSocket
  const handleExecutionStatusUpdate = useCallback((workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    status,
                    completedAt: (status === 'completed' || status === 'failed') ? new Date() : exec.completedAt
                  }
                : exec
            )
          }
        : tab
    ))
  }, [])

  // Handle node state updates from WebSocket
  const handleExecutionNodeUpdate = useCallback((workflowId: string, executionId: string, nodeId: string, nodeState: any) => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? {
            ...tab,
            executions: tab.executions.map(exec =>
              exec.id === executionId
                ? {
                    ...exec,
                    nodes: {
                      ...exec.nodes,
                      [nodeId]: nodeState
                    }
                  }
                : exec
            )
          }
        : tab
    ))
  }, [])

  // Poll for execution updates (fallback when WebSocket not available)
  // Reduced frequency since WebSocket handles real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      const runningExecutions = currentTabs.flatMap(tab => 
        tab.executions.filter(e => e.status === 'running' && !e.id.startsWith('pending-'))
      )
      
      if (runningExecutions.length === 0) return

      // Only poll occasionally as fallback - WebSocket handles real-time updates
      logger.debug(`[WorkflowTabs] Polling ${runningExecutions.length} running execution(s) (fallback)...`)

      // Update all running executions
      const updates = await Promise.all(
        runningExecutions.map(async (exec) => {
          try {
            const execution = await api.getExecution(exec.id)
            const newStatus = execution.status === 'completed' ? 'completed' as const :
                             execution.status === 'failed' ? 'failed' as const :
                             execution.status === 'paused' ? 'running' as const : // Keep as running if paused
                             'running' as const
            
            if (exec.status !== newStatus) {
              logger.debug(`[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} → ${newStatus}`)
            }
            
            return {
              id: exec.id,
              status: newStatus,
              startedAt: exec.startedAt,
              completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
              nodes: execution.node_states || {},
              logs: execution.logs || []
            }
          } catch (error: any) {
            // If execution not found (404), it might be a temp execution that failed
            // Don't log errors for pending executions
            if (!exec.id.startsWith('pending-')) {
              logger.error(`[WorkflowTabs] Failed to fetch execution ${exec.id}:`, error)
            }
            return null
          }
        })
      )

      // Apply updates to tabs
      setTabs(prev => {
        const updated = prev.map(tab => ({
          ...tab,
          executions: tab.executions.map(exec => {
            const update = updates.find(u => u && u.id === exec.id)
            return update || exec
          })
        }))
        
        // Update global storage
        globalTabs = [...updated]
        return updated
      })
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, []) // Empty dependency array - interval runs consistently

  const activeTab = tabs.find(t => t.id === activeTabId)

  const startEditingTabName = useCallback((tab: WorkflowTabData, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setEditingTabId(tab.id)
    setEditingName(tab.name)
  }, [])

  const commitTabRename = useCallback(async (tabId: string, requestedName: string) => {
    if (renameInFlightRef.current) return

    const tab = tabs.find(t => t.id === tabId)
    if (!tab) {
      setEditingTabId(null)
      setEditingName('')
      return
    }

    const trimmedName = requestedName.trim()
    if (trimmedName === '') {
      showError('Workflow name cannot be empty.')
      return
    }

    if (trimmedName === tab.name) {
      setEditingTabId(null)
      setEditingName('')
      return
    }

    renameInFlightRef.current = true
    setEditingTabId(null)
    setEditingName('')

    const previousName = tab.name
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name: trimmedName } : t))

    try {
      if (tab.workflowId) {
        // Fetch current workflow to get all required fields
        const currentWorkflow = await api.getWorkflow(tab.workflowId)
        // Update with new name but keep all existing data
        await api.updateWorkflow(tab.workflowId, {
          name: trimmedName,
          description: currentWorkflow.description,
          nodes: currentWorkflow.nodes,
          edges: currentWorkflow.edges,
          variables: currentWorkflow.variables || {},
        })
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail ?? error?.message ?? 'Unknown error'
      showError(`Failed to rename workflow: ${detail}`)
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name: previousName } : t))
    } finally {
      renameInFlightRef.current = false
    }
  }, [tabs])

  const handleInputBlur = useCallback((tabId: string) => {
    if (renameInFlightRef.current) return
    if (editingTabId !== tabId) return
    void commitTabRename(tabId, editingName)
  }, [commitTabRename, editingName, editingTabId])

  const openPublishModal = useCallback(() => {
    if (!activeTab) {
      showError('Select a workflow tab before publishing.')
      return
    }
    setPublishForm({
      name: activeTab.name,
      description: '',
      category: 'automation',
      tags: '',
      difficulty: 'beginner',
      estimated_time: ''
    })
    setShowPublishModal(true)
  }, [activeTab])

  const handlePublishFormChange = (field: keyof typeof publishForm, value: string) => {
    setPublishForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeTab || !activeTab.workflowId) {
      showError('Save the workflow before publishing to the marketplace.')
      return
    }

    setIsPublishing(true)
    try {
      const tagsArray = publishForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      const response = await httpClient.post(
        `${apiBaseUrl}/workflows/${activeTab.workflowId}/publish`,
        {
          category: publishForm.category,
          tags: tagsArray,
          difficulty: publishForm.difficulty,
          estimated_time: publishForm.estimated_time || undefined
        },
        headers
      )

      if (response.ok) {
        const published = await response.json()
        showSuccess(`Published "${published.name}" to the marketplace.`)
        setShowPublishModal(false)
      } else {
        const errorText = await response.text()
        showError(`Failed to publish: ${errorText}`)
      }
    } catch (error: any) {
      showError('Failed to publish workflow: ' + (error.message || 'Unknown error'))
    } finally {
      setIsPublishing(false)
    }
  }
  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 border-b border-gray-300 px-2">
        {/* Workflow Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={(event) => startEditingTabName(tab, event)}
              className={`
                flex items-center gap-2 px-4 py-2 border-r border-gray-300 
                transition-colors relative group
                ${tab.id === activeTabId 
                  ? 'bg-white text-gray-900 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {tab.isUnsaved && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unsaved changes" />
              )}
              <span className="text-sm whitespace-nowrap">
                {editingTabId === tab.id ? (
                  <input
                    ref={editingInputRef}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => handleInputBlur(tab.id)}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void commitTabRename(tab.id, editingName)
                      } else if (event.key === 'Escape') {
                        setEditingTabId(null)
                        setEditingName('')
                      }
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full text-sm bg-transparent border-b border-blue-400 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  tab.name
                )}
              </span>
              {tabs.length > 1 && (
                <div
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity cursor-pointer"
                  title="Close tab"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCloseTab(tab.id, e as any)
                    }
                  }}
                >
                  <X className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void builderRef.current?.saveWorkflow()}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            title="Save workflow"
          >
            Save
          </button>
          <button
            onClick={() => builderRef.current?.executeWorkflow()}
            className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            title="Execute workflow"
          >
            Execute
          </button>
          <button
            onClick={openPublishModal}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="Publish workflow"
          >
            Publish
          </button>
          <button
            onClick={() => builderRef.current?.exportWorkflow()}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            title="Export workflow"
          >
            Export
          </button>
          <button
            onClick={handleNewWorkflow}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 transition-colors"
            title="New workflow"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New</span>
          </button>
        </div>
      </div>

      {/* Active Workflow Content */}
      {activeTab && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkflowBuilder
            ref={builderRef}
            tabId={activeTab.id}
            workflowId={activeTab.workflowId}
            tabName={activeTab.name}
            tabIsUnsaved={activeTab.isUnsaved}
            workflowTabs={tabs
              .filter(tab => tab.workflowId !== null)
              .map(tab => ({
                workflowId: tab.workflowId!,
                workflowName: tab.name,
                executions: tab.executions,
                activeExecutionId: tab.activeExecutionId
              }))}
            onExecutionStart={handleExecutionStart}
            onWorkflowSaved={(workflowId, name) => handleWorkflowSaved(activeTab.id, workflowId, name)}
            onWorkflowModified={() => handleWorkflowModified(activeTab.id)}
            onWorkflowLoaded={(workflowId, name) => handleLoadWorkflow(activeTab.id, workflowId, name)}
            onCloseWorkflow={handleCloseWorkflow}
            onClearExecutions={handleClearExecutions}
            onExecutionLogUpdate={handleExecutionLogUpdate}
            onExecutionStatusUpdate={handleExecutionStatusUpdate}
            onExecutionNodeUpdate={handleExecutionNodeUpdate}
            onRemoveExecution={handleRemoveExecution}
          />
        </div>
      )}

      {/* No tabs state */}
      {tabs.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No executions</p>
            <button
              onClick={handleNewWorkflow}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form
            onSubmit={handlePublish}
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Publish to Marketplace</h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
              <input
                type="text"
                value={publishForm.name}
                onChange={(e) => handlePublishFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={publishForm.description}
                onChange={(e) => handlePublishFormChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={publishForm.category}
                onChange={(e) => handlePublishFormChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {templateCategories.map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={publishForm.difficulty}
                  onChange={(e) => handlePublishFormChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {templateDifficulties.map(diff => (
                    <option key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                <input
                  type="text"
                  value={publishForm.estimated_time}
                  onChange={(e) => handlePublishFormChange('estimated_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 30 minutes"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={publishForm.tags}
                onChange={(e) => handlePublishFormChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="automation, ai, ... "
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

