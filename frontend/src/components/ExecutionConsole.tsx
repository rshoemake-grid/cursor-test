import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Play } from 'lucide-react'
import WorkflowChat from './WorkflowChat'

interface Execution {
  id: string
  status: string
  startedAt: Date
  nodes: Record<string, any>
  logs: any[]
}

interface ExecutionConsoleProps {
  activeWorkflowId: string | null
  executions?: Execution[]
  activeExecutionId?: string | null
  onWorkflowUpdate?: (changes: any) => void
}

export default function ExecutionConsole({ 
  activeWorkflowId,
  executions = [],
  activeExecutionId = null,
  onWorkflowUpdate
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(300)
  const [activeTab, setActiveTab] = useState<'chat' | 'execution'>('chat')
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  
  // Switch to execution tab when a new execution starts
  useEffect(() => {
    if (activeExecutionId && executions.length > 0) {
      setActiveTab('execution')
    }
  }, [activeExecutionId, executions.length])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const delta = startY.current - e.clientY
        const newHeight = startHeight.current + delta
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
            <button
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true)
                }
                setActiveTab('chat')
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                activeTab === 'chat' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-semibold text-sm">Chat</span>
            </button>
            <button
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true)
                }
                setActiveTab('execution')
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors relative ${
                activeTab === 'execution' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Play className="w-4 h-4" />
              <span className="font-semibold text-sm">Execution</span>
              {activeExecutionId && executions.some(e => e.id === activeExecutionId && e.status === 'running') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="overflow-hidden" style={{ height: `${height - 48}px` }}>
          {activeTab === 'chat' ? (
            <WorkflowChat 
              workflowId={activeWorkflowId}
              onWorkflowUpdate={onWorkflowUpdate}
            />
          ) : (
            <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
              {activeExecutionId ? (
                (() => {
                  const execution = executions.find(e => e.id === activeExecutionId)
                  if (!execution) {
                    return (
                      <div className="text-gray-400 text-center py-8">
                        Execution not found
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Execution {execution.id.slice(0, 8)}...</h3>
                          <p className="text-sm text-gray-400">
                            Started: {new Date(execution.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded text-sm font-medium ${
                          execution.status === 'completed' ? 'bg-green-900 text-green-200' :
                          execution.status === 'failed' ? 'bg-red-900 text-red-200' :
                          'bg-blue-900 text-blue-200'
                        }`}>
                          {execution.status}
                        </div>
                      </div>
                      
                      {execution.logs && execution.logs.length > 0 ? (
                        <div className="space-y-1 font-mono text-xs">
                          {execution.logs.map((log: any, index: number) => (
                            <div
                              key={index}
                              className={`p-2 rounded ${
                                log.level === 'ERROR'
                                  ? 'bg-red-900/30 text-red-200'
                                  : log.level === 'WARNING'
                                  ? 'bg-yellow-900/30 text-yellow-200'
                                  : 'bg-gray-800 text-gray-300'
                              }`}
                            >
                              <span className="text-gray-500">
                                {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                              </span>
                              {' '}
                              <span className={`font-semibold ${
                                log.level === 'ERROR' ? 'text-red-400' : 
                                log.level === 'WARNING' ? 'text-yellow-400' : 
                                'text-blue-400'
                              }`}>
                                {log.level || 'INFO'}
                              </span>
                              {log.node_id && <span className="text-gray-500"> [{log.node_id}]</span>}
                              {' '}
                              {log.message || JSON.stringify(log)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-8">
                          No logs yet. Execution is starting...
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : executions.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold mb-4">Recent Executions</h3>
                  {executions.map((exec) => (
                    <button
                      key={exec.id}
                      onClick={() => setActiveTab('execution')}
                      className="w-full text-left p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{exec.id.slice(0, 8)}...</div>
                          <div className="text-sm text-gray-400">
                            {new Date(exec.startedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          exec.status === 'completed' ? 'bg-green-900 text-green-200' :
                          exec.status === 'failed' ? 'bg-red-900 text-red-200' :
                          'bg-blue-900 text-blue-200'
                        }`}>
                          {exec.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No executions yet. Execute a workflow to see logs here.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

