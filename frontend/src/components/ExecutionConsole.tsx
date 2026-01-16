import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import WorkflowChat from './WorkflowChat'

interface ExecutionConsoleProps {
  activeWorkflowId: string | null
  onWorkflowUpdate?: (changes: any) => void
}

export default function ExecutionConsole({ 
  activeWorkflowId,
  onWorkflowUpdate
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(300)
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

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
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">Chat</span>
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

      {/* Chat Content */}
      {isExpanded && (
        <div className="overflow-hidden" style={{ height: `${height - 48}px` }}>
          <WorkflowChat 
            workflowId={activeWorkflowId}
            onWorkflowUpdate={onWorkflowUpdate}
          />
        </div>
      )}
    </div>
  )
}

