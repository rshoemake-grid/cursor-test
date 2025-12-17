import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import WorkflowBuilder from './WorkflowBuilder'
import { api } from '../api/client'

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
}

// Module-level storage for tabs to persist across remounts
let globalTabs: WorkflowTabData[] = [
  {
    id: 'workflow-1',
    name: 'Untitled Workflow',
    workflowId: null,
    isUnsaved: true,
    executions: [],
    activeExecutionId: null
  }
]

export default function WorkflowTabs({ initialWorkflowId, workflowLoadKey, onExecutionStart }: WorkflowTabsProps) {
  // Initialize from global tabs (persists across remounts)
  const [tabs, setTabs] = useState<WorkflowTabData[]>(() => {
    return [...globalTabs] // Create a copy
  })
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || 'workflow-1')
  const processedKeys = useRef<Set<string>>(new Set()) // Track processed workflowId+loadKey combinations
  const tabsRef = useRef<WorkflowTabData[]>(tabs) // Keep ref in sync with tabs state

  // Sync tabsRef and globalTabs with tabs state
  useEffect(() => {
    tabsRef.current = tabs
    globalTabs = [...tabs] // Update global storage
  }, [tabs])
  

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
      const confirm = window.confirm('This workflow has unsaved changes. Close anyway?')
      if (!confirm) return
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

    const newExecution: Execution = {
      id: executionId,
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: []
    }

    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId
        ? { 
            ...tab, 
            executions: [newExecution, ...tab.executions],
            activeExecutionId: executionId
          }
        : tab
    ))

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [tabs, activeTabId, onExecutionStart])

  // Handle closing workflow executions
  const handleCloseWorkflow = useCallback((workflowId: string) => {
    // This is handled by handleCloseTab, but keeping for ExecutionConsole compatibility
  }, [])

  // Handle clearing executions for a workflow
  const handleClearExecutions = useCallback((workflowId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? { ...tab, executions: [], activeExecutionId: null }
        : tab
    ))
  }, [])

  // Poll for execution updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Use ref to get current tabs without causing effect re-run
      const currentTabs = tabsRef.current
      const runningExecutions = currentTabs.flatMap(tab => 
        tab.executions.filter(e => e.status === 'running')
      )
      
      if (runningExecutions.length === 0) return

      console.log(`[WorkflowTabs] Polling ${runningExecutions.length} running execution(s)...`)

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
              console.log(`[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} → ${newStatus}`)
            }
            
            return {
              id: exec.id,
              status: newStatus,
              startedAt: exec.startedAt,
              completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
              nodes: execution.node_states || {},
              logs: execution.logs || []
            }
          } catch (error) {
            console.error(`[WorkflowTabs] Failed to fetch execution ${exec.id}:`, error)
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
                {tab.name}
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

        {/* New Workflow Button */}
        <button
          onClick={handleNewWorkflow}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 transition-colors ml-2"
          title="New workflow"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New</span>
        </button>
      </div>

      {/* Active Workflow Content */}
      {activeTab && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkflowBuilder
            key={activeTab.id}
            tabId={activeTab.id}
            workflowId={activeTab.workflowId}
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
          />
        </div>
      )}

      {/* No tabs state */}
      {tabs.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No workflows open</p>
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
    </div>
  )
}

