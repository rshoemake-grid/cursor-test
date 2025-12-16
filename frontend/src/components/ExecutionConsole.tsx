import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Terminal, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

interface ExecutionTab {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  nodes: Record<string, any>
  logs: Array<{ timestamp: string; message: string; level: string }>
}

interface ExecutionConsoleProps {
  executions: ExecutionTab[]
  onClose: (id: string) => void
}

export default function ExecutionConsole({ executions, onClose }: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>(executions[0]?.id || null)
  const [height, setHeight] = useState(300)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  useEffect(() => {
    // Auto-select newest execution
    if (executions.length > 0 && !activeTab) {
      setActiveTab(executions[0].id)
    }
  }, [executions, activeTab])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [executions, activeTab])

  const activeExecution = executions.find(e => e.id === activeTab)

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

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-100 shadow-2xl border-t-2 border-gray-700 z-50"
      style={{ height: isExpanded ? `${height}px` : '40px' }}
    >
      {/* Header with tabs */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2 h-10">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          <Terminal className="w-4 h-4 text-green-400 mx-2" />
          
          {executions.length === 0 ? (
            <span className="text-gray-500 text-sm font-mono">
              Execution Console - Run a workflow to see live output
            </span>
          ) : (
            executions.map((execution) => (
              <button
                key={execution.id}
                onClick={() => setActiveTab(execution.id)}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-t text-sm font-mono
                  ${activeTab === execution.id 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                `}
              >
                {getStatusIcon(execution.status)}
                <span className="truncate max-w-[120px]">{execution.id.slice(0, 8)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose(execution.id)
                  }}
                  className="ml-1 hover:bg-gray-800 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console content */}
      {isExpanded && (
        <div className="h-[calc(100%-40px)] overflow-y-auto p-4 font-mono text-sm">
          {!activeExecution || executions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-lg font-semibold mb-2">No Active Executions</p>
                <p className="text-sm">
                  Click the <span className="text-green-400">Execute</span> button to run a workflow
                </p>
                <p className="text-xs mt-2 text-gray-600">
                  Executions will appear here in real-time
                </p>
              </div>
            </div>
          ) : (
            <>

          {/* Execution header */}
          <div className="mb-4 pb-3 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(activeExecution.status)}
              <span className="text-white font-semibold">
                Execution: {activeExecution.id}
              </span>
              <span className="text-gray-400 text-xs">
                Started: {formatTime(activeExecution.startedAt)}
              </span>
            </div>
            
            {activeExecution.status === 'running' && (
              <div className="flex items-center gap-2 text-blue-400 text-xs">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>LIVE - Updating in real-time</span>
              </div>
            )}
          </div>

          {/* Conversation stream */}
          <div className="space-y-3">
            {Object.entries(activeExecution.nodes).map(([nodeId, nodeState]: [string, any]) => (
              <div key={nodeId} className="border-l-2 border-gray-700 pl-4">
                {/* Node header */}
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(nodeState.status)}
                  <span className="text-cyan-400 font-semibold">{nodeId}</span>
                  <span className="text-gray-500 text-xs">({nodeState.status})</span>
                </div>

                {/* Input */}
                {nodeState.input && (
                  <div className="mb-2">
                    <div className="text-yellow-400 text-xs mb-1">→ INPUT:</div>
                    <div className="bg-gray-800 rounded px-3 py-2 text-xs text-gray-300">
                      {typeof nodeState.input === 'string' 
                        ? nodeState.input 
                        : JSON.stringify(nodeState.input, null, 2)}
                    </div>
                  </div>
                )}

                {/* Output/Response */}
                {nodeState.output && (
                  <div className="mb-2">
                    <div className="text-green-400 text-xs mb-1 flex items-center gap-2">
                      ← OUTPUT:
                      {nodeState.status === 'completed' && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded px-3 py-2 text-sm text-gray-100 border border-gray-700">
                      {typeof nodeState.output === 'string' 
                        ? nodeState.output 
                        : JSON.stringify(nodeState.output, null, 2)}
                    </div>
                  </div>
                )}

                {/* Error */}
                {nodeState.error && (
                  <div className="mb-2">
                    <div className="text-red-400 text-xs mb-1">✗ ERROR:</div>
                    <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded px-3 py-2 text-xs text-red-300">
                      {nodeState.error}
                    </div>
                  </div>
                )}

                {/* Running indicator */}
                {nodeState.status === 'running' && !nodeState.output && (
                  <div className="text-blue-400 text-xs flex items-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            ))}

            {/* Logs */}
            {activeExecution.logs && activeExecution.logs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-gray-500 text-xs mb-2">EXECUTION LOG:</div>
                {activeExecution.logs.map((log, idx) => (
                  <div key={idx} className="text-xs text-gray-400 font-mono">
                    <span className="text-gray-600">[{log.timestamp}]</span>
                    <span className={`ml-2 ${
                      log.level === 'ERROR' ? 'text-red-400' : 
                      log.level === 'WARN' ? 'text-yellow-400' : 
                      'text-gray-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
            </>
          )}
        </div>
      )}

      {/* Resize handle */}
      {isExpanded && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
          onMouseDown={(e) => {
            isResizing.current = true
            const startY = e.clientY
            const startHeight = height

            const handleMouseMove = (e: MouseEvent) => {
              if (isResizing.current) {
                const delta = startY - e.clientY
                const newHeight = Math.max(200, Math.min(800, startHeight + delta))
                setHeight(newHeight)
              }
            }

            const handleMouseUp = () => {
              isResizing.current = false
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        />
      )}
    </div>
  )
}

