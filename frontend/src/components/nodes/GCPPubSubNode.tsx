import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Radio } from 'lucide-react'

export default function GCPPubSubNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-purple-500 border-4 shadow-xl ring-2 ring-purple-200' 
            : 'border-purple-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-100 rounded flex-shrink-0">
          <Radio className="w-4 h-4 text-purple-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">{String(data.label || 'GCP Pub/Sub')}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">{String(data.description)}</div>
      )}
      
      {(data.input_config as any)?.topic_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          Topic: {(data.input_config as any).topic_name}
        </div>
      )}
      
      {(data.input_config as any)?.subscription_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          Subscription: {(data.input_config as any).subscription_name}
        </div>
      )}
      
      {(data.input_config as any)?.mode && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
          Mode: {(data.input_config as any).mode === 'write' ? 'Publish' : 'Subscribe'}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

