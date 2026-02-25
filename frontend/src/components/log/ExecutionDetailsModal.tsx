/**
 * Execution Details Modal Component
 * SOLID: Single Responsibility - only displays execution details
 * DRY: Reusable modal component
 * DIP: Depends on abstractions
 */

import { X, Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react'
import type { ExecutionState } from '../../types/workflow'
import { formatExecutionDuration } from '../../utils/executionFormat'
import ExecutionStatusBadge from '../ExecutionStatusBadge'

export interface ExecutionDetailsModalProps {
  execution: ExecutionState | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Execution Details Modal Component
 * Displays detailed information about an execution
 */
export default function ExecutionDetailsModal({
  execution,
  isOpen,
  onClose,
}: ExecutionDetailsModalProps) {
  if (!isOpen || !execution) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.status)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Execution Details</h2>
                <p className="text-sm text-gray-500 font-mono">{execution.execution_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Status and Workflow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <ExecutionStatusBadge status={execution.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Workflow ID</label>
                  <p className="mt-1 font-mono text-sm text-gray-900">
                    {execution.workflow_id}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Started At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(execution.started_at).toLocaleString()}
                  </p>
                </div>
                {execution.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(execution.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatExecutionDuration(execution.started_at, execution.completed_at)}
                  </p>
                </div>
              </div>

              {/* Current Node */}
              {execution.current_node && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Node</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {execution.current_node}
                  </p>
                </div>
              )}

              {/* Error */}
              {execution.error && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Error</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{execution.error}</p>
                  </div>
                </div>
              )}

              {/* Node States */}
              {execution.node_states && Object.keys(execution.node_states).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Node States
                  </label>
                  <div className="space-y-2">
                    {Object.entries(execution.node_states).map(([nodeId, nodeState]) => (
                      <div
                        key={nodeId}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {nodeId}
                          </span>
                          {nodeState?.status && (
                            <ExecutionStatusBadge status={nodeState.status} variant="light" />
                          )}
                        </div>
                        {nodeState?.output && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {String(nodeState.output)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs */}
              {execution.logs && execution.logs.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Logs</label>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
                    {execution.logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {typeof log === 'string' ? log : JSON.stringify(log)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables */}
              {execution.variables && Object.keys(execution.variables).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Variables
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(execution.variables, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
