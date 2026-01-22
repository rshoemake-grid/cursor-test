import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Play, X } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<string>('chat')
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  
  // Switch to new execution tab when a new execution starts
  useEffect(() => {
    if (activeExecutionId && executions.length > 0) {
      setActiveTab(activeExecutionId)
      if (!isExpanded) {
        setIsExpanded(true)
      }
    }
  }, [activeExecutionId, executions.length])
  
  // Get all tabs: Chat + one per execution
  const allTabs = [
    { id: 'chat', name: 'Chat', type: 'chat' as const },
    ...executions.map(exec => ({ 
      id: exec.id, 
      name: exec.id.slice(0, 8), 
      type: 'execution' as const,
      execution: exec
    }))
  ]
  
  const activeTabData = allTabs.find(t => t.id === activeTab)
  const activeExecution = activeTabData?.type === 'execution' ? activeTabData.execution : null

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
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true)
                }
                setActiveTab(tab.id)
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors relative group ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
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
      {isExpanded && (
        <div className="overflow-hidden" style={{ height: `${height - 48}px` }}>
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
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    activeExecution.status === 'completed' ? 'bg-green-900 text-green-200' :
                    activeExecution.status === 'failed' ? 'bg-red-900 text-red-200' :
                    'bg-blue-900 text-blue-200'
                  }`}>
                    {activeExecution.status}
                  </div>
                </div>
                
                {activeExecution.logs && activeExecution.logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-xs">
                    {activeExecution.logs.map((log: any, index: number) => (
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

