import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { WorkflowDefinition } from '../types/workflow'
import { Play, Trash2, Calendar } from 'lucide-react'

interface WorkflowListProps {
  onSelectWorkflow: (id: string) => void
}

export default function WorkflowList({ onSelectWorkflow }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [loading, setLoading] = useState(true)

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
    } catch (error: any) {
      alert('Failed to delete workflow: ' + error.message)
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
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Workflows</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => workflow.id && onSelectWorkflow(workflow.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                {workflow.description && (
                  <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  workflow.id && handleDelete(workflow.id)
                }}
                className="text-red-600 hover:bg-red-50 p-1 rounded"
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
        ))}
      </div>
    </div>
  )
}

