/**
 * Input Node Editor Component (Router)
 * Routes to type-specific editors for better SOLID compliance
 * Single Responsibility: Only routes to appropriate editor
 * Refactored to use extracted type-specific editors
 */

import { NodeWithData } from '../../types/nodeData'
import GCPBucketEditor from './input/GCPBucketEditor'
import AWSS3Editor from './input/AWSS3Editor'
import GCPPubSubEditor from './input/GCPPubSubEditor'
import LocalFileSystemEditor from './input/LocalFileSystemEditor'
import { NODE_TYPE_DISPLAY_NAMES } from './input/inputEditorConstants'

interface InputNodeEditorProps {
  node: NodeWithData & { type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function InputNodeEditor({
  node,
  onConfigUpdate
}: InputNodeEditorProps) {
  // Route to type-specific editor
  // Single Responsibility: Only routes to appropriate editor
  switch (node.type) {
    case 'gcp_bucket': {
      const typedNode = node as NodeWithData & { type: 'gcp_bucket' }
      return <GCPBucketEditor node={typedNode} onConfigUpdate={onConfigUpdate} />
    }
    case 'aws_s3': {
      const typedNode = node as NodeWithData & { type: 'aws_s3' }
      return <AWSS3Editor node={typedNode} onConfigUpdate={onConfigUpdate} />
    }
    case 'gcp_pubsub': {
      const typedNode = node as NodeWithData & { type: 'gcp_pubsub' }
      return <GCPPubSubEditor node={typedNode} onConfigUpdate={onConfigUpdate} />
    }
    case 'local_filesystem': {
      const typedNode = node as NodeWithData & { type: 'local_filesystem' }
      return <LocalFileSystemEditor node={typedNode} onConfigUpdate={onConfigUpdate} />
    }
    case 'database':
    case 'firebase':
    case 'bigquery': {
      // These are handled by separate editors in PropertyPanel
      // Use constants to prevent string literal mutations
      const displayName = node.type === 'database' ? NODE_TYPE_DISPLAY_NAMES.DATABASE :
                         node.type === 'firebase' ? NODE_TYPE_DISPLAY_NAMES.FIREBASE :
                         NODE_TYPE_DISPLAY_NAMES.BIGQUERY
      return (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {displayName}
          </h4>
          <p className="text-xs text-gray-500">
            Configuration for {node.type} nodes is handled in PropertyPanel.
          </p>
        </div>
      )
    }
    default:
      return null
  }
}

