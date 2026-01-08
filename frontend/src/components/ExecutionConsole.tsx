import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Loader, CheckCircle, XCircle, Clock, Trash2, MessageSquare, Terminal } from 'lucide-react'
import WorkflowChat from './WorkflowChat'
import { useWebSocket } from '../hooks/useWebSocket'

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
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: ExecutionLog) => void
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void
}

export default function ExecutionConsole({ 
  workflowTabs, 
  activeWorkflowId,
  onCloseWorkflow,
  onClearExecutions,
  onWorkflowUpdate,
  onNodeStateUpdate,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(300)
  const [consoleTab, setConsoleTab] = useState<'executions' | 'chat'>('executions')
  const [executionTabs, setExecutionTabs] = useState<Array<{ executionId: string; workflowId: string; workflowName: string; status: string; startedAt: Date }>>([])
  const [activeExecutionTabId, setActiveExecutionTabId] = useState<string | null>(null)
  const seenExecutionIds = useRef<Set<string>>(new Set()) // Track which executions we've already seen
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  const shouldAutoScroll = useRef(true) // Track if we should auto-scroll

  // Check if user is near the bottom of the scroll container
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true
    const container = scrollContainerRef.current
    const threshold = 100 // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }

  // Reset auto-scroll when switching executions
  useEffect(() => {
    shouldAutoScroll.current = true
    // Scroll to bottom when switching to a new execution
    if (isExpanded && scrollContainerRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [activeExecutionTabId, isExpanded])

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      shouldAutoScroll.current = isNearBottom()
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isExpanded, activeExecutionTabId])

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isExpanded && shouldAutoScroll.current) {
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
  
  // Get active execution from execution tabs if one is selected
  const activeExecutionTab = executionTabs.find(tab => tab.executionId === activeExecutionTabId)
  const displayedExecution = activeExecutionTab 
    ? (() => {
        // Find the workflow tab that contains this execution
        const workflowTabForExecution = workflowTabs.find(tab => tab.workflowId === activeExecutionTab.workflowId)
        if (!workflowTabForExecution) {
          console.warn('Workflow tab not found for execution:', activeExecutionTab.workflowId)
          return undefined
        }
        // Find the execution in that workflow tab - try both the execution tab ID and all execution IDs
        let exec = workflowTabForExecution.executions.find(e => e.id === activeExecutionTab.executionId)
        if (!exec) {
          // If not found, maybe the execution ID changed (pending -> real). Try to find by matching workflow and timing
          console.log('Execution not found with ID:', activeExecutionTab.executionId, 'Available executions:', workflowTabForExecution.executions.map(e => e.id))
          // Try to find execution that matches the workflow and is close in time
          exec = workflowTabForExecution.executions.find(e => 
            Math.abs(e.startedAt.getTime() - activeExecutionTab.startedAt.getTime()) < 10000 // Within 10 seconds
          )
        }
        return exec
      })()
    : activeExecution
  
  // Track initial execution IDs when component mounts or workflow changes
  const initialExecutionIds = useRef<Set<string>>(new Set())
  const hasInitialized = useRef(false)
  
  // Initialize: mark all existing executions as "initial" (don't create tabs for them)
  useEffect(() => {
    if (!hasInitialized.current) {
      // Collect all execution IDs that exist when component first renders
      workflowTabs.forEach(workflowTab => {
        workflowTab.executions.forEach(execution => {
          initialExecutionIds.current.add(execution.id)
          seenExecutionIds.current.add(execution.id)
        })
      })
      hasInitialized.current = true
    }
  }, []) // Only run once on mount
  
  // Create execution tab only when a NEW execution starts (not for existing executions on workflow load)
  useEffect(() => {
    workflowTabs.forEach(workflowTab => {
      workflowTab.executions.forEach(execution => {
        // Check if there's a tab with this execution ID
        const existingTab = executionTabs.find(tab => tab.executionId === execution.id)
        
        // Also check if there's a pending tab that should be updated to this execution ID
        // (happens when pending execution ID is replaced with real ID)
        const pendingTab = !execution.id.startsWith('pending-') 
          ? executionTabs.find(tab => 
              tab.executionId.startsWith('pending-') && 
              tab.workflowId === workflowTab.workflowId &&
              Math.abs(tab.startedAt.getTime() - execution.startedAt.getTime()) < 5000 // Within 5 seconds
            )
          : null
        
        if (pendingTab && !existingTab) {
          // Update pending tab to use real execution ID
          setExecutionTabs(prev => prev.map(t => 
            t.executionId === pendingTab.executionId
              ? {
                  ...t,
                  executionId: execution.id,
                  status: execution.status
                }
              : t
          ))
          // Update activeExecutionTabId if it was pointing to the pending tab
          if (activeExecutionTabId === pendingTab.executionId) {
            setActiveExecutionTabId(execution.id)
          }
          seenExecutionIds.current.add(execution.id)
        } else if (!existingTab && !initialExecutionIds.current.has(execution.id)) {
          // This is a NEW execution (not in initial set) - create a tab for it
          seenExecutionIds.current.add(execution.id)
          setExecutionTabs(prev => [...prev, {
            executionId: execution.id,
            workflowId: workflowTab.workflowId,
            workflowName: workflowTab.workflowName,
            status: execution.status,
            startedAt: execution.startedAt
          }])
          // Auto-select the new execution tab if it's running or if no tab is selected
          if (!activeExecutionTabId && (execution.status === 'running' || executionTabs.length === 0)) {
            setActiveExecutionTabId(execution.id)
            // Auto-expand console when new execution starts
            setIsExpanded(true)
          }
        } else if (existingTab && existingTab.status !== execution.status) {
          // Update tab status when execution status changes
          setExecutionTabs(prev => prev.map(t => 
            t.executionId === execution.id 
              ? { ...t, status: execution.status }
              : t
          ))
        }
      })
    })
  }, [workflowTabs])
  
  // Find the workflow tab for the displayed execution
  const displayedExecutionWorkflowTab = displayedExecution && activeExecutionTab
    ? workflowTabs.find(tab => tab.workflowId === activeExecutionTab.workflowId)
    : activeWorkflowTab

  // WebSocket connection for real-time log streaming
  const { isConnected } = useWebSocket({
    executionId: displayedExecution?.id || null,
    onLog: (log) => {
      if (!displayedExecution || !displayedExecutionWorkflowTab || !onExecutionLogUpdate || !log) return
      
      // Add log to execution in real-time via callback
      onExecutionLogUpdate(displayedExecutionWorkflowTab.workflowId, displayedExecution.id, {
        timestamp: log.timestamp || new Date().toISOString(),
        message: log.message,
        level: log.level,
        node_id: log.node_id
      })
    },
    onStatus: (status) => {
      if (!displayedExecution || !displayedExecutionWorkflowTab || !onExecutionStatusUpdate) return
      
      // Update execution status
      onExecutionStatusUpdate(
        displayedExecutionWorkflowTab.workflowId,
        displayedExecution.id,
        status as 'running' | 'completed' | 'failed'
      )
    },
    onNodeUpdate: (nodeId, nodeState) => {
      if (!displayedExecution || !displayedExecutionWorkflowTab || !onExecutionNodeUpdate) return
      
      // Update node states for visualization
      if (onNodeStateUpdate) {
        const nodeStates: Record<string, { status: string; error?: string }> = {}
        Object.entries(displayedExecution.nodes || {}).forEach(([nId, nState]: [string, any]) => {
          nodeStates[nId] = {
            status: nState.status || 'pending',
            error: nState.error
          }
        })
        // Add/update the node that was just updated
        nodeStates[nodeId] = {
          status: nodeState.status || 'pending',
          error: nodeState.error
        }
        onNodeStateUpdate(nodeStates)
      }
      
      // Update execution's node states via callback
      onExecutionNodeUpdate(displayedExecutionWorkflowTab.workflowId, displayedExecution.id, nodeId, nodeState)
    },
    onCompletion: (result) => {
      if (!displayedExecution || !displayedExecutionWorkflowTab || !onExecutionStatusUpdate) return
      
      onExecutionStatusUpdate(displayedExecutionWorkflowTab.workflowId, displayedExecution.id, 'completed')
    },
    onError: (error) => {
      if (!displayedExecution || !displayedExecutionWorkflowTab) return
      
      // Add error log
      if (onExecutionLogUpdate) {
        onExecutionLogUpdate(displayedExecutionWorkflowTab.workflowId, displayedExecution.id, {
          timestamp: new Date().toISOString(),
          message: `Error: ${error}`,
          level: 'ERROR'
        })
      }
      
      // Update status to failed
      if (onExecutionStatusUpdate) {
        onExecutionStatusUpdate(displayedExecutionWorkflowTab.workflowId, displayedExecution.id, 'failed')
      }
    }
  })
  
  // Debug: Log when displayedExecution changes
  useEffect(() => {
    console.log('Displayed execution changed:', displayedExecution?.id, 'Active tab ID:', activeExecutionTabId)
  }, [displayedExecution?.id, activeExecutionTabId])

  // Update node states when execution changes
  useEffect(() => {
    if (displayedExecution && displayedExecution.nodes && onNodeStateUpdate) {
      const nodeStates: Record<string, { status: string; error?: string }> = {}
      Object.entries(displayedExecution.nodes).forEach(([nodeId, nodeState]: [string, any]) => {
        nodeStates[nodeId] = {
          status: nodeState.status || 'pending',
          error: nodeState.error
        }
      })
      onNodeStateUpdate(nodeStates)
    } else if (!displayedExecution && onNodeStateUpdate) {
      // Clear node states when no active execution
      onNodeStateUpdate({})
    }
  }, [displayedExecution, onNodeStateUpdate])
  
  // Auto-scroll when new logs arrive (only if user is at bottom)
  useEffect(() => {
    if (isExpanded && displayedExecution && displayedExecution.logs.length > 0 && shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayedExecution?.logs, isExpanded])

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

          {/* Execution Tabs */}
          {consoleTab === 'executions' && executionTabs.length > 0 && (
            <div className="flex items-center gap-1">
              {executionTabs.map(execTab => {
                const isActive = execTab.executionId === activeExecutionTabId
                const isCompleted = execTab.status === 'completed' || execTab.status === 'failed'
                const isRunning = execTab.status === 'running' || !isCompleted
                
                return (
                  <div
                    key={execTab.executionId}
                    className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => {
                        console.log('Clicking execution tab:', execTab.executionId)
                        setActiveExecutionTabId(execTab.executionId)
                        setIsExpanded(true)
                      }}
                      className="flex items-center gap-2 flex-1"
                      title={`${execTab.workflowName} - ${formatTime(execTab.startedAt)}`}
                    >
                      {isRunning && <Loader className="w-3 h-3 animate-spin flex-shrink-0" />}
                      {isCompleted && getStatusIcon(execTab.status)}
                      <span className="font-medium">
                        {execTab.executionId.slice(0, 8)}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const executionIdToClose = execTab.executionId
                        setExecutionTabs(prev => {
                          const filtered = prev.filter(t => t.executionId !== executionIdToClose)
                          // If closing the active tab, switch to another one
                          if (activeExecutionTabId === executionIdToClose) {
                            const remaining = filtered
                            setActiveExecutionTabId(remaining.length > 0 ? remaining[0].executionId : null)
                          }
                          return filtered
                        })
                      }}
                      type="button"
                      className="hover:text-red-400 ml-1 cursor-pointer flex-shrink-0 bg-transparent border-0 p-0 m-0"
                      title="Close execution tab"
                      aria-label="Close execution tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
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
          ) : !displayedExecution ? (
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
            <div ref={scrollContainerRef} className="overflow-auto p-4" style={{ height: `${height - 48}px` }}>
              {/* Active Execution Details */}
              {displayedExecution && (
                <>
                  {/* Execution Header */}
                  <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(displayedExecution.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Execution {displayedExecution.id.slice(0, 8)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              displayedExecution.status === 'running' ? 'bg-blue-600' :
                              displayedExecution.status === 'completed' ? 'bg-green-600' :
                              'bg-red-600'
                            }`}>
                              {displayedExecution.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Started: {formatTime(displayedExecution.startedAt)}
                            {displayedExecution.completedAt && ` • Completed: ${formatTime(displayedExecution.completedAt)}`}
                          </div>
                        </div>
                      </div>
                      {displayedExecution.status === 'running' && (
                        <div className="text-xs text-blue-400 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          LIVE - Updating in real-time
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Execution Logs */}
                  <div className="space-y-1 font-mono text-xs">
                    {displayedExecution.logs.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p>Waiting for execution logs...</p>
                      </div>
                    ) : (
                      displayedExecution.logs.map((log, idx) => (
                        <div
                          key={`${displayedExecution.id}-${idx}-${log.timestamp}`}
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
