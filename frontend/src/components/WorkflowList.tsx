import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { WorkflowDefinition } from '../types/workflow'
import { Play, Trash2, Calendar, CheckSquare, Square } from 'lucide-react'

interface WorkflowListProps {
  onSelectWorkflow: (id: string) => void
}

export default function WorkflowList({ onSelectWorkflow }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      const data = await api.getWorkflows()
      setWorkflows(data)
    } catch (error: any) {
      alert('Failed to load workflows: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      await api.deleteWorkflow(id)
      setWorkflows(workflows.filter((w) => w.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (error: any) {
      alert('Failed to delete workflow: ' + error.message)
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
      alert('Please select at least one workflow to delete')
      return
    }

    const count = selectedIds.size
    if (!confirm(`Are you sure you want to delete ${count} workflow(s)?`)) return

    try {
      const ids = Array.from(selectedIds)
      const result = await api.bulkDeleteWorkflows(ids)
      
      // Remove deleted workflows from the list
      setWorkflows(workflows.filter((w) => !selectedIds.has(w.id || '')))
      setSelectedIds(new Set())
      
      if (result.failed_ids && result.failed_ids.length > 0) {
        alert(`${result.message}\nFailed IDs: ${result.failed_ids.join(', ')}`)
      } else {
        alert(`Successfully deleted ${result.deleted_count} workflow(s)`)
      }
    } catch (error: any) {
      alert('Failed to delete workflows: ' + error.message)
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
          <p className="text-gray-500 mb-4">No workflows yet</p>
          <p className="text-sm text-gray-400">Create your first workflow in the Builder</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Workflows</h2>
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
          return (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'
              }`}
              onClick={() => workflow.id && onSelectWorkflow(workflow.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      workflow.id && handleToggleSelect(workflow.id)
                    }}
                    className="mt-1"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    )}
                  </div>
                </div>
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

              <div className="flex items-center gap-4 text-sm text-gray-500">
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

