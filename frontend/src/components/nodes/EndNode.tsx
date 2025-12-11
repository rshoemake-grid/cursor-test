import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Flag } from 'lucide-react'

export default function EndNode({ selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 border-2 ${
        selected ? 'border-gray-800' : 'border-gray-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-white" />
        <div className="font-semibold text-sm text-white">End</div>
      </div>
    </div>
  )
}

