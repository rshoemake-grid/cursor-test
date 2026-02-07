/**
 * Node Components Barrel Export
 * 
 * This file exports:
 * 1. `nodeTypes` object - Required by ReactFlow component for custom node rendering
 *    Used in: WorkflowCanvas.tsx (line 17, 73)
 * 2. Individual node components - Available for direct imports if needed
 * 
 * The `nodeTypes` object maps node type strings to their React component implementations.
 * This is required by ReactFlow's `nodeTypes` prop.
 */

import AgentNode from './AgentNode'
import ConditionNode from './ConditionNode'
import LoopNode from './LoopNode'
import StartNode from './StartNode'
import EndNode from './EndNode'
import GCPBucketNode from './GCPBucketNode'
import AWSS3Node from './AWSS3Node'
import GCPPubSubNode from './GCPPubSubNode'
import LocalFileSystemNode from './LocalFileSystemNode'
import DatabaseNode from './DatabaseNode'
import FirebaseNode from './FirebaseNode'
import BigQueryNode from './BigQueryNode'

/**
 * Node types mapping for ReactFlow
 * Maps node type identifiers to their React component implementations
 * Required by ReactFlow component's nodeTypes prop
 */
export const nodeTypes = {
  agent: AgentNode,
  condition: ConditionNode,
  loop: LoopNode,
  start: StartNode,
  end: EndNode,
  gcp_bucket: GCPBucketNode,
  aws_s3: AWSS3Node,
  gcp_pubsub: GCPPubSubNode,
  local_filesystem: LocalFileSystemNode,
  database: DatabaseNode,
  firebase: FirebaseNode,
  bigquery: BigQueryNode,
}

export { 
  AgentNode, 
  ConditionNode, 
  LoopNode, 
  StartNode, 
  EndNode,
  GCPBucketNode,
  AWSS3Node,
  GCPPubSubNode,
  LocalFileSystemNode
}

