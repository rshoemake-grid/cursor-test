// @ts-nocheck
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'

export default function AgentNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-primary-500 border-4 shadow-xl ring-2 ring-primary-200' 
            : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-100 rounded flex-shrink-0">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">{String(data.label || '')}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">{String(data.description)}</div>
      )}
      
      {(data.agent_config as any)?.model && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate">
          {(data.agent_config as any).model}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

