// @ts-nocheck
import { Trash2, Copy, Scissors, Clipboard, Plus, Upload } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'

interface ContextMenuProps {
  nodeId?: string
  edgeId?: string
  node?: any
  x: number
  y: number
  onClose: () => void
  onDelete?: () => void
  onCopy?: (node: any) => void
  onCut?: (node: any) => void
  onPaste?: () => void
  onAddToAgentNodes?: (node: any) => void
  onSendToMarketplace?: (node: any) => void
  canPaste?: boolean
}

export default function ContextMenu({ 
  nodeId, 
  edgeId, 
  node,
  x, 
  y, 
  onClose, 
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onAddToAgentNodes,
  onSendToMarketplace,
  canPaste = false
}: ContextMenuProps) {
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

  const handleCopy = () => {
    if (node && onCopy) {
      onCopy(node)
    }
    onClose()
  }

  const handleCut = () => {
    if (node && onCut) {
      onCut(node)
    }
    onClose()
  }

  const handlePaste = () => {
    if (onPaste) {
      onPaste()
    }
    onClose()
  }

  const handleAddToAgentNodes = () => {
    if (node && onAddToAgentNodes) {
      onAddToAgentNodes(node)
    }
    onClose()
  }

  const handleSendToMarketplace = () => {
    if (node && onSendToMarketplace) {
      onSendToMarketplace(node)
    }
    onClose()
  }

  const isAgentNode = node?.type === 'agent'
  const label = nodeId ? 'Delete Node' : 'Delete Connection'

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {nodeId && (
        <>
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleCut}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Scissors className="w-4 h-4" />
            Cut
          </button>
          {canPaste && (
            <button
              onClick={handlePaste}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
              Paste
            </button>
          )}
          {isAgentNode && (
            <>
              <button
                onClick={handleAddToAgentNodes}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-200 mt-1 pt-2"
              >
                <Plus className="w-4 h-4" />
                Add to Agent Nodes
              </button>
              <button
                onClick={handleSendToMarketplace}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Send to Marketplace
              </button>
            </>
          )}
          <div className="border-t border-gray-200 my-1" />
        </>
      )}
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

