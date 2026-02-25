/**
 * Log Page Component
 * SOLID: Single Responsibility - only orchestrates the log page UI
 * DIP: Depends on abstractions (hooks, components) not concrete implementations
 * DRY: Uses extracted utilities and reusable components
 */

import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import ExecutionListItem from '../components/log/ExecutionListItem'
import { useExecutionList } from '../hooks/log/useExecutionList'
import { sortExecutionsByStartTime } from '../utils/executionFormat'
import { apiClient } from '../api/client'

export interface LogPageProps {
  apiClient?: {
    listExecutions(params?: {
      workflow_id?: string
      status?: string
      limit?: number
      offset?: number
    }): Promise<any[]>
  }
}

export default function LogPage({ apiClient: injectedApiClient }: LogPageProps = {}) {
  const navigate = useNavigate()
  const { executions, loading, error } = useExecutionList({
    apiClient: injectedApiClient || apiClient,
    pollInterval: 5000,
    limit: 100,
  })

  const handleExecutionClick = (executionId: string) => {
    navigate(`/?execution=${executionId}`)
  }

  // Sort executions by start time (newest first)
  const sortedExecutions = sortExecutionsByStartTime(executions)

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading executions...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full overflow-auto bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Execution Log</h1>
          <p className="text-gray-600">
            {sortedExecutions.length} execution{sortedExecutions.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {sortedExecutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">No executions yet</p>
            <p className="text-sm text-gray-600">Execute a workflow to see execution logs here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExecutions.map((execution) => (
              <ExecutionListItem
                key={execution.execution_id}
                execution={execution}
                onExecutionClick={handleExecutionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
