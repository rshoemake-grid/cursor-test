import { useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkflowTabs, type WorkflowTabData } from '../contexts/WorkflowTabsContext'
import WorkflowBuilder, { WorkflowBuilderHandle } from './WorkflowBuilder'
import { api } from '../api/client'
import { showError } from '../utils/notifications'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { useTabRenaming } from '../hooks/useTabRenaming'
import { useExecutionManagement } from '../hooks/useExecutionManagement'
import { useTabOperations } from '../hooks/useTabOperations'
import { useMarketplacePublishing } from '../hooks/useMarketplacePublishing'
import { useTabInitialization } from '../hooks/useTabInitialization'
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from '../config/templateConstants'

interface WorkflowTabsProps {
  initialWorkflowId?: string | null
  workflowLoadKey?: number // Counter to force new tab creation (required when initialWorkflowId is set)
  onExecutionStart?: (executionId: string) => void
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
}

// Storage functions removed - now handled by WorkflowTabsContext

export default function WorkflowTabs({ 
  initialWorkflowId, 
  workflowLoadKey, 
  onExecutionStart,
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
                    onKeyDown={(event) => handleInputKeyDown(tab.id, event)}
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
                onClick={closePublishModal}
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
                onChange={(e) => handlePublishFormChange('category', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {TEMPLATE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{formatCategory(category)}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={publishForm.difficulty}
                  onChange={(e) => handlePublishFormChange('difficulty', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {TEMPLATE_DIFFICULTIES.map(diff => (
                    <option key={diff} value={diff}>
                      {formatDifficulty(diff)}
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
                onClick={closePublishModal}
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

