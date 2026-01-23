// @ts-nocheck
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'

export default function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 border-2 ${
        selected ? 'border-primary-700 border-4 shadow-xl ring-2 ring-primary-200' : 'border-primary-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-white" />
        <div className="font-semibold text-sm text-white">Start</div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

