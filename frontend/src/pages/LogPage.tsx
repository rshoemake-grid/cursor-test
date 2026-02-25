/**
 * Log Page Component
 * SOLID: Single Responsibility - only orchestrates the log page UI
 * DIP: Depends on abstractions (hooks, components) not concrete implementations
 * DRY: Uses extracted utilities and reusable components
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Download } from 'lucide-react'
import ExecutionListItem from '../components/log/ExecutionListItem'
import ExecutionFilters, { type ExecutionFiltersState } from '../components/log/ExecutionFilters'
import Pagination from '../components/ui/Pagination'
import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery'
import { useExecutionPagination } from '../hooks/log/useExecutionPagination'
import { applyExecutionFilters } from '../utils/executionFilters'
import { exportExecutionsToJSON, exportExecutionsToCSV } from '../utils/exportFormatters'
import { api } from '../api/client'

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
  const [filters, setFilters] = useState<ExecutionFiltersState>({
    sortBy: 'started_at',
    sortOrder: 'desc',
  })

  const { data: executions = [], isLoading: loading, error } = useExecutionListQuery({
    apiClient: injectedApiClient || api,
    refetchInterval: 5000,
    filters: filters.status
      ? {
          status: filters.status.join(','),
          workflow_id: filters.workflowId,
          limit: 100,
        }
      : filters.workflowId
      ? { workflow_id: filters.workflowId, limit: 100 }
      : { limit: 100 },
  })

  const handleExecutionClick = (executionId: string) => {
    navigate(`/?execution=${executionId}`)
  }

  // Apply client-side filters (search, sorting)
  const filteredExecutions = useMemo(() => {
    return applyExecutionFilters(executions, filters)
  }, [executions, filters])

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedExecutions,
    setCurrentPage,
    setItemsPerPage,
    itemsPerPage,
    totalItems,
  } = useExecutionPagination({
    executions: filteredExecutions,
    itemsPerPage: 25,
  })

  const handleExportJSON = () => {
    exportExecutionsToJSON(filteredExecutions)
  }

  const handleExportCSV = () => {
    exportExecutionsToCSV(filteredExecutions)
  }

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
            <div className="text-red-500">Error: {error?.message || String(error)}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Execution Log</h1>
            <p className="text-gray-600">
              {totalItems} execution{totalItems !== 1 ? 's' : ''}
              {totalItems !== executions.length && ` of ${executions.length} total`}
            </p>
          </div>
          {filteredExecutions.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          )}
        </div>

        <ExecutionFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        {filteredExecutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">No executions yet</p>
            <p className="text-sm text-gray-600">Execute a workflow to see execution logs here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {paginatedExecutions.map((execution) => (
                <ExecutionListItem
                  key={execution.execution_id}
                  execution={execution}
                  onExecutionClick={handleExecutionClick}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
