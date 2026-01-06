import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Loader, CheckCircle, XCircle, Clock, Trash2, MessageSquare, Terminal } from 'lucide-react'
import WorkflowChat from './WorkflowChat'

interface ExecutionLog {
  timestamp: string
  message: string
  level: string
  node_id?: string
}

interface Execution {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  nodes: Record<string, any>
  logs: ExecutionLog[]
}

interface WorkflowTab {
  workflowId: string
  workflowName: string
  executions: Execution[]
  activeExecutionId: string | null
}

interface ExecutionConsoleProps {
  workflowTabs: WorkflowTab[]
  activeWorkflowId: string | null
  onCloseWorkflow: (workflowId: string) => void
  onClearExecutions: (workflowId: string) => void
  onWorkflowUpdate?: (changes: any) => void
  onNodeStateUpdate?: (states: Record<string, { status: string; error?: string }>) => void
}

export default function ExecutionConsole({ 
  workflowTabs, 
  activeWorkflowId,
  onCloseWorkflow,
  onClearExecutions,
  onWorkflowUpdate
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(300)
  const [consoleTab, setConsoleTab] = useState<'executions' | 'chat'>('executions')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [workflowTabs, activeWorkflowId, isExpanded])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        // Calculate delta from starting position
        const delta = startY.current - e.clientY
        const newHeight = startHeight.current + delta
        // Clamp between min (200px) and max (600px)
        setHeight(Math.max(200, Math.min(600, newHeight)))
      }
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true
    startY.current = e.clientY
    startHeight.current = height
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  const activeWorkflowTab = workflowTabs.find(tab => tab.workflowId === activeWorkflowId)
  const activeExecution = activeWorkflowTab?.executions.find(e => e.id === activeWorkflowTab.activeExecutionId) || activeWorkflowTab?.executions[0]
  
  // Update node states when execution changes
  useEffect(() => {
    if (activeExecution && activeExecution.nodes && onNodeStateUpdate) {
      const nodeStates: Record<string, { status: string; error?: string }> = {}
      Object.entries(activeExecution.nodes).forEach(([nodeId, nodeState]: [string, any]) => {
        nodeStates[nodeId] = {
          status: nodeState.status || 'pending',
          error: nodeState.error
        }
      })
      onNodeStateUpdate(nodeStates)
    } else if (!activeExecution && onNodeStateUpdate) {
      // Clear node states when no active execution
      onNodeStateUpdate({})
    }
  }, [activeExecution, onNodeStateUpdate])

  // Always show the console bar
  return (
    <div 
      className="relative w-full bg-gray-900 text-gray-100 shadow-2xl border-t-2 border-gray-700 flex-shrink-0"
      style={{ height: isExpanded ? `${height}px` : 'auto', minHeight: '60px' }}
    >
      {/* Resize Handle */}
      {isExpanded && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Header Bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">Console</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setConsoleTab('executions')}
              className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                consoleTab === 'executions'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              Executions
            </button>
            <button
              onClick={() => {
                setConsoleTab('chat')
                setIsExpanded(true)
              }}
              className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                consoleTab === 'chat'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              Chat
            </button>
          </div>

          {/* Workflow Tabs */}
          {workflowTabs.length > 0 ? (
            <div className="flex items-center gap-1">
              {workflowTabs.map(tab => {
                const hasRunning = tab.executions.some(e => e.status === 'running')
                const isActive = tab.workflowId === activeWorkflowId
                
                return (
                  <button
                    key={tab.workflowId}
                    onClick={() => {
                      // Parent component should handle switching active workflow
                    }}
                    className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {hasRunning && <Loader className="w-3 h-3 animate-spin" />}
                    <span className="font-medium">{tab.workflowName}</span>
                    <span className="text-gray-500">({tab.executions.length})</span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseWorkflow(tab.workflowId)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          onCloseWorkflow(tab.workflowId)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="hover:text-red-400 ml-1 cursor-pointer"
                      title="Close workflow tab"
                    >
                      <X className="w-3 h-3" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No workflows loaded</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {consoleTab === 'executions' && activeWorkflowTab && activeWorkflowTab.executions.length > 0 && (
            <button
              onClick={() => onClearExecutions(activeWorkflowTab.workflowId)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
              title="Clear execution history"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console Content */}
      {isExpanded && (
        <div className="overflow-hidden" style={{ height: `${height - 48}px` }}>
          {consoleTab === 'chat' ? (
            <WorkflowChat 
              workflowId={activeWorkflowId}
              onWorkflowUpdate={onWorkflowUpdate}
            />
          ) : !activeWorkflowTab || activeWorkflowTab.executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Clock className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Executions Yet</p>
              <p className="text-sm mt-2">
                {activeWorkflowTab 
                  ? 'Click the Execute button to run this workflow'
                  : 'Load a workflow to see execution history'}
              </p>
            </div>
          ) : (
            <div className="overflow-auto p-4" style={{ height: `${height - 48}px` }}>
              {/* Execution Selector */}
              {activeWorkflowTab.executions.length > 1 && (
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">Execution History:</span>
                    {activeWorkflowTab.executions.map((exec, idx) => {
                      const isActiveExec = exec.id === activeExecution?.id
                      return (
                        <button
                          key={exec.id}
                          onClick={() => {
                            // Would need to add handler to switch active execution
                          }}
                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                            isActiveExec
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                          title={`Started: ${formatTime(exec.startedAt)}`}
                        >
                          {getStatusIcon(exec.status)}
                          <span>#{activeWorkflowTab.executions.length - idx}</span>
                          <span className="text-gray-500">{exec.id.slice(0, 8)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Execution Details */}
              {activeExecution && (
                <>
                  {/* Execution Header */}
                  <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activeExecution.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Execution {activeExecution.id.slice(0, 8)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              activeExecution.status === 'running' ? 'bg-blue-600' :
                              activeExecution.status === 'completed' ? 'bg-green-600' :
                              'bg-red-600'
                            }`}>
                              {activeExecution.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Started: {formatTime(activeExecution.startedAt)}
                            {activeExecution.completedAt && ` • Completed: ${formatTime(activeExecution.completedAt)}`}
                          </div>
                        </div>
                      </div>
                      {activeExecution.status === 'running' && (
                        <div className="text-xs text-blue-400 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          LIVE - Updating in real-time
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Execution Logs */}
                  <div className="space-y-1 font-mono text-xs">
                    {activeExecution.logs.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p>Waiting for execution logs...</p>
                      </div>
                    ) : (
                      activeExecution.logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`py-1 px-2 rounded ${
                            log.level === 'ERROR' ? 'bg-red-900 bg-opacity-20 text-red-300' :
                            log.level === 'WARNING' ? 'bg-yellow-900 bg-opacity-20 text-yellow-300' :
                            'text-gray-300'
                          }`}
                        >
                          <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`ml-2 font-semibold ${
                            log.level === 'ERROR' ? 'text-red-400' :
                            log.level === 'WARNING' ? 'text-yellow-400' :
                            log.level === 'INFO' ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            {log.level}
                          </span>
                          {log.node_id && <span className="ml-2 text-purple-400">[{log.node_id}]</span>}
                          <span className="ml-2">{log.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
