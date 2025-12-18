import { Trash2 } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'

interface ContextMenuProps {
  nodeId?: string
  edgeId?: string
  x: number
  y: number
  onClose: () => void
  onDelete?: () => void
}

export default function ContextMenu({ nodeId, edgeId, x, y, onClose, onDelete }: ContextMenuProps) {
  const { deleteElements } = useReactFlow()

  const handleDelete = () => {
    if (nodeId) {
      deleteElements({ nodes: [{ id: nodeId }] })
    } else if (edgeId) {
      deleteElements({ edges: [{ id: edgeId }] })
    }
    if (onDelete) {
      onDelete()
    }
    onClose()
  }

  const label = nodeId ? 'Delete Node' : 'Delete Connection'

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {label}
      </button>
    </div>
  )
}

