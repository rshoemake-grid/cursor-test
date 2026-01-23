// @ts-nocheck
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'

export default function DatabaseNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  const inputConfig = (data as any).input_config || {}
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-indigo-500 border-4 shadow-xl ring-2 ring-indigo-200' 
            : 'border-indigo-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-indigo-100 rounded flex-shrink-0">
          <Database className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">{String(data.label || 'Database')}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">{String(data.description)}</div>
      )}
      
      {inputConfig.database_type && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          Type: {inputConfig.database_type}
        </div>
      )}
      
      {inputConfig.database_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          DB: {inputConfig.database_name}
        </div>
      )}
      
      {inputConfig.mode && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
          Mode: {inputConfig.mode === 'write' ? 'Write' : 'Read'}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

