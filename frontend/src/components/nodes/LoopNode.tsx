import { Handle, Position, type NodeProps } from '@xyflow/react'
import { RotateCw } from 'lucide-react'

export default function LoopNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] ${
        selected ? 'border-primary-500 border-4 shadow-xl ring-2 ring-primary-200' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-green-100 rounded">
          <RotateCw className="w-4 h-4 text-green-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900">{data.label}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mb-2">{data.description}</div>
      )}
      
      {data.loop_config && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {data.loop_config.loop_type}
          {data.loop_config.max_iterations && ` (max: ${data.loop_config.max_iterations})`}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

