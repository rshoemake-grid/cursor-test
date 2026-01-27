import { useEffect, useState } from 'react'
import type { ExecutionState, NodeState } from '../types/workflow'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
// import ExecutionStatusBadge from './ExecutionStatusBadge' // Unused
import { getExecutionStatusColorLight } from '../utils/executionStatus'
import { logger } from '../utils/logger'
import { useWorkflowAPI } from '../hooks/useWorkflowAPI'

interface ExecutionViewerProps {
  executionId: string
}

export default function ExecutionViewer({ executionId }: ExecutionViewerProps) {
  const [execution, setExecution] = useState<ExecutionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const { getExecution } = useWorkflowAPI()

  useEffect(() => {
    loadExecution()
    // Poll for updates every 2 seconds if still running
    const interval = setInterval(() => {
      if (execution?.status === 'running' || execution?.status === 'pending') {
        setIsPolling(true)
        loadExecution()
      } else {
        setIsPolling(false)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [executionId, execution?.status, getExecution])

  const loadExecution = async () => {
    try {
      const data = await getExecution(executionId)
      setExecution(data)
      setIsPolling(data.status === 'running' || data.status === 'pending')
    } catch (error: any) {
      logger.error('Failed to load execution:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading execution...</div>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Execution not found</div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  // Use utility function instead of local function
  const getStatusColor = (status: string) => getExecutionStatusColorLight(status)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Real-time monitoring banner */}
        {isPolling && (execution.status === 'running' || execution.status === 'pending') && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 animate-spin" />
                <div>
                  <div className="font-semibold text-lg">Workflow Running...</div>
                  <div className="text-sm text-blue-100">Monitoring in real-time • Updates every 2 seconds</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Execution Details</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)}
              {execution.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Execution ID:</span>
              <span className="ml-2 font-mono text-gray-900">{execution.execution_id}</span>
            </div>
            <div>
              <span className="text-gray-600">Workflow ID:</span>
              <span className="ml-2 font-mono text-gray-900">{execution.workflow_id}</span>
            </div>
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 text-gray-900">
                {new Date(execution.started_at).toLocaleString()}
              </span>
            </div>
            {execution.completed_at && (
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(execution.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {execution.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {execution.error}
              </p>
            </div>
          )}
        </div>

        {/* Node States */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Node Execution</h3>
            {execution.node_states && Object.keys(execution.node_states).length > 0 && (
              <div className="text-sm text-gray-600">
                {Object.values(execution.node_states).filter((n: any) => n.status === 'completed').length} / {Object.keys(execution.node_states).length} nodes completed
              </div>
            )}
          </div>

          {/* Progress bar */}
          {execution.node_states && Object.keys(execution.node_states).length > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(Object.values(execution.node_states).filter((n: any) => n.status === 'completed').length / Object.keys(execution.node_states).length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {Object.entries(execution.node_states).map(([nodeId, nodeState]: [string, NodeState]) => (
              <div
                key={nodeId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(nodeState.status)}
                    <span className="font-medium text-gray-900">{nodeId}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeState.status)}`}>
                    {nodeState.status}
                  </span>
                </div>

                {nodeState.input && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Input:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(nodeState.input, null, 2)}
                    </pre>
                  </div>
                )}

                {nodeState.output && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <span>Agent Response:</span>
                      {nodeState.status === 'completed' && (
                        <span className="text-green-600">✓</span>
                      )}
                    </p>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {typeof nodeState.output === 'string'
                          ? nodeState.output
                          : JSON.stringify(nodeState.output, null, 2)}
                      </div>
                    </div>
                  </div>
                )}

                {nodeState.error && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-600 mb-1">Error:</p>
                    <p className="text-xs text-red-700 bg-red-50 p-2 rounded">{nodeState.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Execution Logs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Logs</h3>
          
          <div className="space-y-1 font-mono text-xs">
            {execution.logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  log.level === 'ERROR'
                    ? 'bg-red-50 text-red-900'
                    : log.level === 'WARNING'
                    ? 'bg-yellow-50 text-yellow-900'
                    : 'bg-gray-50 text-gray-900'
                }`}
              >
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {' '}
                <span className={`font-semibold ${
                  log.level === 'ERROR' ? 'text-red-600' : 
                  log.level === 'WARNING' ? 'text-yellow-600' : 
                  'text-blue-600'
                }`}>
                  {log.level}
                </span>
                {log.node_id && <span className="text-gray-600"> [{log.node_id}]</span>}
                {' '}
                {log.message}
              </div>
            ))}
          </div>
        </div>

        {/* Final Result */}
        {execution.result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Result</h3>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
              {typeof execution.result === 'string'
                ? execution.result
                : JSON.stringify(execution.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

