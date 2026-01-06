import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'

// Helper to extract filename from path
const getFilename = (path: string): string => {
  if (!path) return ''
  const parts = path.split('/').filter(p => p)
  return parts[parts.length - 1] || path
}

export default function GCPBucketNode({ data, selected }: NodeProps) {
  const executionStatus = (data as any).executionStatus
  const hasError = executionStatus === 'failed'
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] ${
        hasError 
          ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' 
          : selected 
            ? 'border-orange-500 border-4 shadow-xl ring-2 ring-orange-200' 
            : 'border-orange-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-orange-100 rounded">
          <Database className="w-4 h-4 text-orange-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900">{String(data.label || 'GCP Bucket')}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2">{String(data.description)}</div>
      )}
      
      {(data.input_config as any)?.bucket_name && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">
          Bucket: {(data.input_config as any).bucket_name}
        </div>
      )}
      
      {(data.input_config as any)?.object_path && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">
          File: {getFilename((data.input_config as any).object_path)}
        </div>
      )}
      
      {(data.input_config as any)?.mode && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Mode: {(data.input_config as any).mode === 'write' ? 'Write' : 'Read'}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

