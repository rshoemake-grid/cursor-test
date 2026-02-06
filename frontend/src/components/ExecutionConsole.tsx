import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Play, X } from 'lucide-react'
import WorkflowChat from './WorkflowChat'
// Domain-based imports - Phase 7
import { useWebSocket } from '../hooks/execution'
import ExecutionStatusBadge from './ExecutionStatusBadge'
import LogLevelBadge from './LogLevelBadge'
import { logger } from '../utils/logger'
import { getLogLevelColor } from '../utils/logLevel'
import type { DocumentAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import type { Execution } from '../contexts/WorkflowTabsContext'
// Mutation kill utilities
import { coalesceString } from '../utils/nullCoalescing'
import { LOG_LEVELS } from '../constants/stringLiterals'

interface ExecutionConsoleProps {
  activeWorkflowId: string | null
  executions?: Execution[]
  activeExecutionId?: string | null
  onWorkflowUpdate?: (changes: any) => void
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: any) => void
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void
  onRemoveExecution?: (workflowId: string, executionId: string) => void
  // Dependency injection
  documentAdapter?: DocumentAdapter | null
}

export default function ExecutionConsole({ 
  activeWorkflowId,
  executions = [],
  activeExecutionId = null,
  onWorkflowUpdate,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution,
  documentAdapter = defaultAdapters.createDocumentAdapter()
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(300)
  const [activeTab, setActiveTab] = useState<string>('chat')
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  
  // Get all tabs: Chat + one per execution (memoized to prevent unnecessary re-renders)
  const allTabs = useMemo(() => [
    { id: 'chat', name: 'Chat', type: 'chat' as const },
    ...executions.map(exec => ({ 
      id: exec.id, 
      name: exec.id.slice(0, 8), 
      type: 'execution' as const,
      execution: exec
    }))
  ], [executions])
  
  const activeTabData = useMemo(
    () => allTabs.find(t => t.id === activeTab),
    [allTabs, activeTab]
  )
  const activeExecution = activeTabData?.type === 'execution' ? activeTabData.execution : null
  
  // Get active execution status - find by activeExecutionId if not in activeTab
  const activeExecutionStatus = useMemo(() => {
    // Explicit check to prevent mutation survivors
    if (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') {
      const exec = executions.find(e => e.id === activeExecutionId)
      return exec?.status as 'running' | 'completed' | 'failed' | 'pending' | 'paused' | undefined
    }
    return activeExecution?.status as 'running' | 'completed' | 'failed' | 'pending' | 'paused' | undefined
  }, [activeExecutionId, executions, activeExecution])

  // Set up WebSocket connection for active execution
  useWebSocket({
    executionId: activeExecutionId,
    executionStatus: activeExecutionStatus,
    onLog: (log) => {
      // Explicit checks to prevent mutation survivors
      if ((activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '') && (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && (onExecutionLogUpdate !== null && onExecutionLogUpdate !== undefined)) {
        logger.debug('[ExecutionConsole] Received log via WebSocket:', log)
        onExecutionLogUpdate(activeWorkflowId, activeExecutionId, log)
      }
    },
    onStatus: (status) => {
      // Explicit checks to prevent mutation survivors
      if ((activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '') && (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && (onExecutionStatusUpdate !== null && onExecutionStatusUpdate !== undefined)) {
        logger.debug('[ExecutionConsole] Received status update via WebSocket:', status)
        onExecutionStatusUpdate(activeWorkflowId, activeExecutionId, status as 'running' | 'completed' | 'failed')
      }
    },
    onNodeUpdate: (nodeId, nodeState) => {
      // Explicit checks to prevent mutation survivors
      if ((activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '') && (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && (onExecutionNodeUpdate !== null && onExecutionNodeUpdate !== undefined)) {
        logger.debug('[ExecutionConsole] Received node update via WebSocket:', nodeId, nodeState)
        onExecutionNodeUpdate(activeWorkflowId, activeExecutionId, nodeId, nodeState)
      }
    },
    onCompletion: (result) => {
      // Explicit checks to prevent mutation survivors
      if ((activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '') && (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && (onExecutionStatusUpdate !== null && onExecutionStatusUpdate !== undefined)) {
        logger.debug('[ExecutionConsole] Received completion via WebSocket:', result)
        onExecutionStatusUpdate(activeWorkflowId, activeExecutionId, 'completed')
      }
    },
    onError: (error) => {
      logger.error('[ExecutionConsole] WebSocket error:', error)
      // Explicit checks to prevent mutation survivors
      if ((activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '') && (activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && (onExecutionStatusUpdate !== null && onExecutionStatusUpdate !== undefined)) {
        onExecutionStatusUpdate(activeWorkflowId, activeExecutionId, 'failed')
      }
    }
  })
  
  // Switch to new execution tab when a new execution starts
  useEffect(() => {
    // Explicit checks to prevent mutation survivors
    if ((activeExecutionId !== null && activeExecutionId !== undefined && activeExecutionId !== '') && executions.length > 0) {
      setActiveTab(activeExecutionId)
      // Explicit check to prevent mutation survivors
      if (isExpanded === false) {
        setIsExpanded(true)
      }
    }
  }, [activeExecutionId, executions.length])
  
  // Handle closing an execution tab
  const handleCloseExecutionTab = (e: React.MouseEvent, executionId: string) => {
    e.stopPropagation() // Prevent tab switch
    // Explicit checks to prevent mutation survivors
    if ((onRemoveExecution !== null && onRemoveExecution !== undefined) && (activeWorkflowId !== null && activeWorkflowId !== undefined && activeWorkflowId !== '')) {
      onRemoveExecution(activeWorkflowId, executionId)
      // If closing the active tab, switch to Chat
      // Explicit check to prevent mutation survivors
      if (activeTab === executionId) {
        setActiveTab('chat')
      }
    }
  }
  

  // Handle resizing
  useEffect(() => {
    // Explicit check to prevent mutation survivors
    if (documentAdapter === null || documentAdapter === undefined) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const delta = startY.current - e.clientY
        const newHeight = startHeight.current + delta
        setHeight(Math.max(200, Math.min(600, newHeight)))
      }
    }

    const handleMouseUp = () => {
      isResizing.current = false
      if (documentAdapter.body) {
        documentAdapter.body.style.cursor = 'default'
        documentAdapter.body.style.userSelect = 'auto'
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [documentAdapter])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Explicit check to prevent mutation survivors
    if (documentAdapter === null || documentAdapter === undefined) return

    isResizing.current = true
    startY.current = e.clientY
    startHeight.current = height
    if (documentAdapter.body) {
      documentAdapter.body.style.cursor = 'ns-resize'
      documentAdapter.body.style.userSelect = 'none'
    }
  }

  return (
    <div 
      className="relative w-full bg-gray-900 text-gray-100 shadow-2xl border-t-2 border-gray-700 flex-shrink-0"
      style={{ height: isExpanded ? `${height}px` : 'auto', minHeight: '60px' }}
    >
      {/* Resize Handle */}
      {/* Explicit check to prevent mutation survivors */}
      {isExpanded === true && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Header Bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {allTabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1 rounded transition-colors relative group ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <button
                onClick={() => {
                  // Explicit check to prevent mutation survivors
                  if (isExpanded === false) {
                    setIsExpanded(true)
                  }
                  setActiveTab(tab.id)
                }}
                className="flex items-center gap-2"
              >
                {tab.type === 'chat' ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-semibold text-sm whitespace-nowrap">{tab.name}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="font-semibold text-sm whitespace-nowrap">{tab.name}</span>
                    {tab.execution?.status === 'running' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {tab.execution?.status === 'completed' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {tab.execution?.status === 'failed' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </>
                )}
              </button>
              {tab.type === 'execution' && (
                <button
                  onClick={(e) => handleCloseExecutionTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-0.5 transition-opacity ml-1"
                  title="Close execution tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {/* Explicit check to prevent mutation survivors */}
      {isExpanded === true && (
        <div className="overflow-hidden" style={{ height: `${height - 48}px` }}>
          {/* Explicit check to prevent mutation survivors */}
          {activeTab === 'chat' ? (
            <WorkflowChat
              workflowId={activeWorkflowId}
              onWorkflowUpdate={onWorkflowUpdate}
            />
          ) : activeExecution ? (
            <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Execution {activeExecution.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-gray-400">
                      Started: {new Date(activeExecution.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <ExecutionStatusBadge status={activeExecution.status} />
                </div>
                
                {/* Explicit checks to prevent mutation survivors */}
                {(activeExecution.logs !== null && activeExecution.logs !== undefined && activeExecution.logs.length > 0) ? (
                  <div className="space-y-1 font-mono text-xs">
                    {activeExecution.logs.map((log: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${getLogLevelColor(coalesceString(log.level, LOG_LEVELS.INFO))}`}
                      >
                        <span className="text-gray-500">
                          {new Date((log.timestamp !== null && log.timestamp !== undefined) ? log.timestamp : Date.now()).toLocaleTimeString()}
                        </span>
                        {' '}
                        <LogLevelBadge level={coalesceString(log.level, LOG_LEVELS.INFO)} showBackground={false} />
                        {/* Explicit check to prevent mutation survivors */}
                        {(log.node_id !== null && log.node_id !== undefined && log.node_id !== '') && <span className="text-gray-500"> [{log.node_id}]</span>}
                        {' '}
                        {coalesceString(log.message, JSON.stringify(log))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No logs yet. Execution is starting...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
              <div className="text-gray-400 text-center py-8">
                Execution not found
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

