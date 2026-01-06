import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

export default function ConditionNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-primary-500 border-4 shadow-xl ring-2 ring-primary-200' 
            : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-100 rounded">
          <GitBranch className="w-4 h-4 text-purple-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900">{data.label}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2">{data.description}</div>
      )}
      
      {data.condition_config && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {data.condition_config.condition_type}: {data.condition_config.field}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '33%' }}
        className="w-3 h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '66%' }}
        className="w-3 h-3"
      />
    </div>
  )
}

