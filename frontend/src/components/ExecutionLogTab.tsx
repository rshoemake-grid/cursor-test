import { Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react'
import ExecutionStatusBadge from './ExecutionStatusBadge'
import type { Execution } from '../contexts/WorkflowTabsContext'

interface ExecutionLogTabProps {
  executions: Execution[]
  onExecutionClick?: (executionId: string) => void
}

export default function ExecutionLogTab({ 
  executions, 
  onExecutionClick 
}: ExecutionLogTabProps) {
  // Sort executions by start time (newest first)
  const sortedExecutions = [...executions].sort((a, b) => {
    const aTime = new Date(a.startedAt).getTime()
    const bTime = new Date(b.startedAt).getTime()
    return bTime - aTime
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getCurrentNode = (execution: Execution): string | null => {
    // Try to find the currently running node from node states
    if (execution.nodes && typeof execution.nodes === 'object') {
      const nodeEntries = Object.entries(execution.nodes)
      
      // Find running node first
      for (const [nodeId, state] of nodeEntries) {
        if (state && typeof state === 'object' && 'status' in state) {
          const nodeState = state as { status?: string; completed_at?: string }
          if (nodeState.status === 'running') {
            return nodeId
          }
        }
      }
      
      // If no running node, find the last completed node
      const completedNodes = nodeEntries
        .filter(([_, state]) => {
          if (state && typeof state === 'object' && 'status' in state) {
            return (state as { status?: string }).status === 'completed'
          }
          return false
        })
        .sort(([_, a], [__, b]) => {
          const aState = a as { completed_at?: string }
          const bState = b as { completed_at?: string }
          const aTime = aState?.completed_at ? new Date(aState.completed_at).getTime() : 0
          const bTime = bState?.completed_at ? new Date(bState.completed_at).getTime() : 0
          return bTime - aTime
        })
      
      if (completedNodes.length > 0) {
        return completedNodes[0][0]
      }
    }
    return null
  }

  const formatDuration = (startedAt: Date | string, completedAt?: Date | string): string => {
    const start = new Date(startedAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() : Date.now()
    const duration = Math.floor((end - start) / 1000) // seconds
    
    if (duration < 60) {
      return `${duration}s`
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}m ${seconds}s`
    } else {
      const hours = Math.floor(duration / 3600)
      const minutes = Math.floor((duration % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  if (sortedExecutions.length === 0) {
    return (
      <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
        <div className="text-gray-400 text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No executions yet</p>
          <p className="text-sm">Execute a workflow to see execution logs here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-gray-100">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Execution Log</h3>
          <p className="text-sm text-gray-400">
            {sortedExecutions.length} execution{sortedExecutions.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="space-y-2">
          {sortedExecutions.map((execution) => {
            const currentNode = getCurrentNode(execution)
            const isActive = execution.status === 'running' || execution.status === 'pending'
            
            return (
              <div
                key={execution.id}
                onClick={() => onExecutionClick?.(execution.id)}
                className={`
                  bg-gray-800 rounded-lg p-4 border transition-all cursor-pointer
                  ${isActive ? 'border-blue-500 hover:border-blue-400' : 'border-gray-700 hover:border-gray-600'}
                  hover:bg-gray-700
                `}
                title={`Click to view execution ${execution.id.slice(0, 8)}...`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Execution info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-mono text-sm text-gray-300">
                        {execution.id.slice(0, 8)}...
                      </span>
                      <ExecutionStatusBadge status={execution.status} variant="light" />
                    </div>

                    {/* Current Node */}
                    {currentNode && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">Current Node:</span>
                        <span className="text-sm font-medium text-gray-300">
                          {currentNode}
                        </span>
                      </div>
                    )}

                    {/* Progress indicator for running executions */}
                    {execution.status === 'running' && execution.nodes && typeof execution.nodes === 'object' && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Progress:</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            {(() => {
                              const nodeEntries = Object.entries(execution.nodes)
                              const totalNodes = nodeEntries.length
                              const completedNodes = nodeEntries.filter(([_, state]) => {
                                if (state && typeof state === 'object' && 'status' in state) {
                                  return (state as { status?: string }).status === 'completed'
                                }
                                return false
                              }).length
                              const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
                              return (
                                <div 
                                  className="bg-blue-500 h-full transition-all duration-300"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          Started: {new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </div>
                      {execution.completedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            Completed: {new Date(execution.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-600 whitespace-nowrap">
                        Duration: {formatDuration(execution.startedAt, execution.completedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Status and action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {execution.status === 'completed' && (
                      <div className="text-xs text-green-400 font-medium">
                        ✓ Completed
                      </div>
                    )}
                    {execution.status === 'failed' && (
                      <div className="text-xs text-red-400 font-medium">
                        ✗ Failed
                      </div>
                    )}
                    {isActive && (
                      <div className="text-xs text-blue-400 font-medium animate-pulse">
                        ● In Progress
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
