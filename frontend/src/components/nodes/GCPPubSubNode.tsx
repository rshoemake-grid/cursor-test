import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Radio } from 'lucide-react'

export default function GCPPubSubNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-purple-500 border-4 shadow-xl ring-2 ring-purple-200' 
            : 'border-purple-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-100 rounded">
          <Radio className="w-4 h-4 text-purple-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900">{data.label || 'GCP Pub/Sub'}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2">{data.description}</div>
      )}
      
      {data.input_config?.topic_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">
          Topic: {data.input_config.topic_name}
        </div>
      )}
      
      {data.input_config?.subscription_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">
          Subscription: {data.input_config.subscription_name}
        </div>
      )}
      
      {data.input_config?.mode && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Mode: {data.input_config.mode === 'write' ? 'Publish' : 'Subscribe'}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

