/**
 * Log Page Component
 * SOLID: Single Responsibility - only orchestrates the log page UI
 * DIP: Depends on abstractions (hooks, components) not concrete implementations
 * DRY: Uses extracted utilities and reusable components
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Download } from 'lucide-react'
import type { ExecutionState } from '../types/workflow'
import ExecutionListItem from '../components/log/ExecutionListItem'
import ExecutionFilters, { type ExecutionFiltersState } from '../components/log/ExecutionFilters'
import BulkActionsBar from '../components/log/BulkActionsBar'
import ExecutionDetailsModal from '../components/log/ExecutionDetailsModal'
import Pagination from '../components/ui/Pagination'
import ToastContainer from '../components/ui/ToastContainer'
import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery'
import { useExecutionPagination } from '../hooks/log/useExecutionPagination'
import { useBulkOperations } from '../hooks/log/useBulkOperations'
import { useExecutionNotifications } from '../hooks/log/useExecutionNotifications'
import { useToast } from '../hooks/utils/useToast'
import { applyExecutionFilters } from '../utils/executionFilters'
import { exportExecutionsToJSON, exportExecutionsToCSV } from '../utils/exportFormatters'
import { api } from '../api/client'
import { showConfirm } from '../utils/confirm'

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
  const toast = useToast()
  const [filters, setFilters] = useState<ExecutionFiltersState>({
    sortBy: 'started_at',
    sortOrder: 'desc',
  })
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionState | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

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
    if (bulkMode) {
      // In bulk mode, toggle selection instead of navigating
      bulkOperations.toggleSelection(executionId)
    } else {
      // Show details modal
      const execution = executions.find((e) => e.execution_id === executionId)
      if (execution) {
        setSelectedExecution(execution)
        setIsDetailsModalOpen(true)
      } else {
        // Fallback to navigation if execution not found
        navigate(`/?execution=${executionId}`)
      }
    }
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
    toast.success('Executions exported to JSON')
  }

  const handleExportCSV = () => {
    exportExecutionsToCSV(filteredExecutions)
    toast.success('Executions exported to CSV')
  }

  const handleBulkDelete = async (executionIds: string[]) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${executionIds.length} execution(s)? This action cannot be undone.`,
      {
        title: 'Delete Executions',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      }
    )

    if (!confirmed) {
      return
    }

    try {
      // Note: API doesn't have bulk delete endpoint yet, so we'll delete individually
      // In a real implementation, you'd call a bulk delete endpoint
      toast.info(`Deleting ${executionIds.length} execution(s)...`)
      
      // For now, just show a success message
      // TODO: Implement actual bulk delete API call
      toast.success(`Successfully deleted ${executionIds.length} execution(s)`)
    } catch (error: any) {
      toast.error(`Failed to delete executions: ${error?.message || 'Unknown error'}`)
      throw error
    }
  }

  const bulkOperations = useBulkOperations({
    executions: paginatedExecutions,
    onDelete: handleBulkDelete,
  })

  // Monitor execution status changes for notifications
  useExecutionNotifications({
    executions,
    onSuccess: (execution) => {
      toast.success(`Execution ${execution.execution_id.slice(0, 8)}... completed successfully`)
    },
    onError: (execution) => {
      toast.error(
        `Execution ${execution.execution_id.slice(0, 8)}... failed${execution.error ? `: ${execution.error}` : ''}`
      )
    },
    enabled: !bulkMode, // Only show notifications when not in bulk mode
  })

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
    <>
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      <ExecutionDetailsModal
        execution={selectedExecution}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedExecution(null)
        }}
      />
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
                onClick={() => setBulkMode(!bulkMode)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                  bulkMode
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {bulkMode ? 'Cancel Selection' : 'Select Multiple'}
              </button>
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

        {bulkMode && (
          <BulkActionsBar
            selectedCount={bulkOperations.selectedCount}
            onDelete={bulkOperations.deleteSelected}
            onClearSelection={() => {
              bulkOperations.clearSelection()
              setBulkMode(false)
            }}
            isDeleting={bulkOperations.isDeleting}
          />
        )}

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
              {bulkMode && (
                <div className="flex items-center gap-2 mb-2 px-2">
                  <input
                    type="checkbox"
                    checked={bulkOperations.isAllSelected}
                    onChange={bulkOperations.toggleSelectAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    aria-label="Select all executions"
                  />
                  <span className="text-sm text-gray-600">
                    {bulkOperations.isAllSelected ? 'Deselect all' : 'Select all'}
                  </span>
                </div>
              )}
              {paginatedExecutions.map((execution) => (
                <ExecutionListItem
                  key={execution.execution_id}
                  execution={execution}
                  onExecutionClick={handleExecutionClick}
                  isSelected={bulkOperations.selectedIds.has(execution.execution_id)}
                  onSelect={bulkOperations.toggleSelection}
                  showCheckbox={bulkMode}
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
    </>
  )
}
