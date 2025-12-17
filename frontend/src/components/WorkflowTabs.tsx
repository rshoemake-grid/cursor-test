import { useState, useCallback, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import WorkflowBuilder from './WorkflowBuilder'

interface WorkflowTabData {
  id: string
  name: string
  workflowId: string | null
  isUnsaved: boolean
}

interface WorkflowTabsProps {
  initialWorkflowId?: string | null
  onExecutionStart?: (executionId: string) => void
}

export default function WorkflowTabs({ initialWorkflowId, onExecutionStart }: WorkflowTabsProps) {
  const [tabs, setTabs] = useState<WorkflowTabData[]>([
    {
      id: 'workflow-1',
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true
    }
  ])
  const [activeTabId, setActiveTabId] = useState<string>('workflow-1')

  // Handle initial workflow from marketplace
  useEffect(() => {
    if (initialWorkflowId) {
      // Check if workflow is already open
      const existingTab = tabs.find(t => t.workflowId === initialWorkflowId)
      if (existingTab) {
        setActiveTabId(existingTab.id)
      } else {
        // Create new tab for this workflow
        const newId = `workflow-${Date.now()}`
        const newTab: WorkflowTabData = {
          id: newId,
          name: 'Loading...',
          workflowId: initialWorkflowId,
          isUnsaved: false
        }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(newId)
      }
    }
  }, [initialWorkflowId]) // Note: tabs intentionally not in deps to avoid re-triggering

  const handleNewWorkflow = useCallback(() => {
    const newId = `workflow-${Date.now()}`
    const newTab: WorkflowTabData = {
      id: newId,
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true
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
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
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
            onExecutionStart={onExecutionStart}
            onWorkflowSaved={(workflowId, name) => handleWorkflowSaved(activeTab.id, workflowId, name)}
            onWorkflowModified={() => handleWorkflowModified(activeTab.id)}
            onWorkflowLoaded={(workflowId, name) => handleLoadWorkflow(activeTab.id, workflowId, name)}
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

