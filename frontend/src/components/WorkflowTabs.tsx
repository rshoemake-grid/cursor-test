import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkflowTabs, type WorkflowTabData } from '../contexts/WorkflowTabsContext'
import WorkflowBuilder, { WorkflowBuilderHandle } from './WorkflowBuilder'
import { api } from '../api/client'
import { showError } from '../utils/notifications'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
// Domain-based imports - Phase 7
import { useTabRenaming, useTabOperations, useTabInitialization } from '../hooks/tabs'
import { useExecutionManagement } from '../hooks/execution'
import { useMarketplacePublishing } from '../hooks/marketplace'
import { TabBar } from './TabBar'
import { PublishModal } from './PublishModal'

interface WorkflowTabsProps {
  initialWorkflowId?: string | null
  workflowLoadKey?: number // Counter to force new tab creation (required when initialWorkflowId is set)
  onExecutionStart?: (executionId: string) => void
  // Dependency injection
  // Note: storage is now handled by WorkflowTabsContext, but kept for API compatibility
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
}

// Storage functions removed - now handled by WorkflowTabsContext

export default function WorkflowTabs({ 
  initialWorkflowId, 
  workflowLoadKey, 
  onExecutionStart,
  // storage is now handled by WorkflowTabsContext, but kept for API compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  storage: _storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = 'http://localhost:8000/api'
}: WorkflowTabsProps) {
  // Use context for tabs state management (replaces module-level globalTabs)
  const { tabs, setTabs, activeTabId, setActiveTabId, processedKeys } = useWorkflowTabs()
  
  // Keep ref in sync with tabs state for polling logic
  const tabsRef = useRef<WorkflowTabData[]>(tabs)
  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])
  
  const builderRef = useRef<WorkflowBuilderHandle | null>(null)
  const { token } = useAuth()

  // Tab initialization hook
  useTabInitialization({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
    tabsRef,
    initialWorkflowId,
    workflowLoadKey,
    processedKeys,
  })

  // Tab operations hook
  const tabOperations = useTabOperations({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
  })
  const {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  } = tabOperations

  // Execution management hook
  const executionManagement = useExecutionManagement({
    tabs,
    activeTabId,
    setTabs,
    tabsRef,
    onExecutionStart,
  })
  const {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate,
  } = executionManagement


  const activeTab = tabs.find(t => t.id === activeTabId)

  // Marketplace publishing hook
  const marketplacePublishing = useMarketplacePublishing({
    activeTab: activeTab ? { id: activeTab.id, workflowId: activeTab.workflowId, name: activeTab.name } : undefined,
    token,
    httpClient,
    apiBaseUrl,
  })
  const {
    showPublishModal,
    isPublishing,
    publishForm,
    openPublishModal,
    closePublishModal,
    handlePublishFormChange,
    handlePublish,
  } = marketplacePublishing

  // Tab renaming hook
  const tabRenaming = useTabRenaming({
    tabs,
    onRename: async (tabId: string, newName: string, previousName: string) => {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name: newName } : t))

      try {
        const tab = tabs.find(t => t.id === tabId)
        if (tab?.workflowId) {
          // Fetch current workflow to get all required fields
          const currentWorkflow = await api.getWorkflow(tab.workflowId)
          // Update with new name but keep all existing data
          await api.updateWorkflow(tab.workflowId, {
            name: newName,
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
        throw error // Re-throw so hook can handle it
      }
    },
  })
  const {
    editingTabId,
    editingName,
    editingInputRef,
    setEditingName,
    startEditing: startEditingTabName,
    handleInputBlur,
    handleInputKeyDown,
  } = tabRenaming

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        editingTabId={editingTabId}
        editingName={editingName}
        editingInputRef={editingInputRef}
        setEditingName={setEditingName}
        onTabClick={setActiveTabId}
        onTabDoubleClick={startEditingTabName}
        onCloseTab={handleCloseTab}
        onInputBlur={handleInputBlur}
        onInputKeyDown={handleInputKeyDown}
        onNewWorkflow={handleNewWorkflow}
        onSave={() => void builderRef.current?.saveWorkflow()}
        onExecute={() => builderRef.current?.executeWorkflow()}
        onPublish={openPublishModal}
        onExport={() => builderRef.current?.exportWorkflow()}
      />

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

      <PublishModal
        isOpen={showPublishModal}
        form={publishForm}
        isPublishing={isPublishing}
        onClose={closePublishModal}
        onFormChange={handlePublishFormChange}
        onSubmit={handlePublish}
      />
    </div>
  )
}

