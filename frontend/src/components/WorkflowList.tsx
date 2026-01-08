import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { WorkflowDefinition } from '../types/workflow'
import { Play, Trash2, Calendar, CheckSquare, Square, ArrowLeft, Copy } from 'lucide-react'
import { showError, showSuccess, showWarning } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface WorkflowListProps {
  onSelectWorkflow: (id: string) => void
  onBack?: () => void
}

export default function WorkflowList({ onSelectWorkflow, onBack }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      const data = await api.getWorkflows()
      setWorkflows(data)
    } catch (error: any) {
      showError('Failed to load workflows: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this workflow?',
      { title: 'Delete Workflow', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (!confirmed) return

    try {
      await api.deleteWorkflow(id)
      setWorkflows(workflows.filter((w) => w.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      showSuccess('Workflow deleted successfully')
    } catch (error: any) {
      showError('Failed to delete workflow: ' + error.message)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await api.duplicateWorkflow(id)
      // Reload workflows to show the new duplicate
      await loadWorkflows()
      showSuccess(`Workflow duplicated as "${duplicated.name}"`)
    } catch (error: any) {
      showError('Failed to duplicate workflow: ' + error.message)
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === workflows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(workflows.map(w => w.id).filter(Boolean) as string[]))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      showWarning('Please select at least one workflow to delete')
      return
    }

    const count = selectedIds.size
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${count} workflow(s)?`,
      { title: 'Delete Workflows', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    )
    if (!confirmed) return

    try {
      const ids = Array.from(selectedIds)
      const result = await api.bulkDeleteWorkflows(ids)
      
      // Remove deleted workflows from the list
      setWorkflows(workflows.filter((w) => !selectedIds.has(w.id || '')))
      setSelectedIds(new Set())
      
      if (result.failed_ids && result.failed_ids.length > 0) {
        showError(`${result.message}\nFailed IDs: ${result.failed_ids.join(', ')}`)
      } else {
        showSuccess(`Successfully deleted ${result.deleted_count} workflow(s)`)
      }
    } catch (error: any) {
      showError('Failed to delete workflows: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          {!isAuthenticated ? (
            <>
              <p className="text-gray-500 mb-2">Showing anonymous workflows only</p>
              <p className="text-sm text-gray-400 mb-4">Log in to see your workflows</p>
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No workflows yet</p>
              <p className="text-sm text-gray-400">Create your first workflow in the Builder</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to builder"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Workflows</h2>
              {!isAuthenticated && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing anonymous workflows only. <button onClick={() => navigate('/auth')} className="text-primary-600 hover:text-primary-700 underline">Log in</button> to see your workflows.
                </p>
              )}
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          )}
        </div>

        {workflows.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {selectedIds.size === workflows.length ? (
                <CheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span>{selectedIds.size === workflows.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        {workflows.map((workflow) => {
          const isSelected = workflow.id && selectedIds.has(workflow.id)
          const hasSelection = selectedIds.size > 0
          return (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'
              } ${hasSelection ? '' : 'cursor-pointer'}`}
              onClick={(e) => {
                // Only navigate if clicking on the card itself, not on interactive elements
                // If any workflows are selected, don't navigate (selection mode)
                if (!hasSelection && e.target === e.currentTarget || 
                    (e.target as HTMLElement).closest('.workflow-content')) {
                  workflow.id && onSelectWorkflow(workflow.id)
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      workflow.id && handleToggleSelect(workflow.id)
                    }}
                    className="mt-1 flex-shrink-0"
                    title={isSelected ? 'Deselect workflow' : 'Select workflow'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 workflow-content" onClick={(e) => {
                    // Prevent navigation when clicking on content if in selection mode
                    if (hasSelection) {
                      e.stopPropagation()
                    }
                  }}>
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      workflow.id && handleDuplicate(workflow.id)
                    }}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                    title="Duplicate workflow"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      workflow.id && handleDelete(workflow.id)
                    }}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div 
                className="flex items-center gap-4 text-sm text-gray-500 workflow-content"
                onClick={(e) => {
                  // Prevent navigation when clicking on metadata if in selection mode
                  if (hasSelection) {
                    e.stopPropagation()
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {workflow.nodes?.length || 0} nodes
                </div>
                {workflow.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

