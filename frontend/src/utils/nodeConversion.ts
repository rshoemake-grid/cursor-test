/**
 * Node Conversion Utilities
 * Converts React Flow nodes to various formats for different use cases
 */

import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'

/**
 * Convert React Flow nodes to WorkflowNode format for ExecutionInputDialog
 */
export function convertNodesForExecutionInput(nodes: Node[]): WorkflowNode[] {
  return nodes.map((node: any) => ({
    id: node.id,
    type: node.type as any, // NodeType from workflow types
    name: node.data.name || (typeof node.data.label === 'string' ? node.data.label : ''),
    description: node.data.description,
    agent_config: (node.data as any).agent_config,
    condition_config: (node.data as any).condition_config,
    loop_config: node.data.loop_config,
    input_config: node.data.input_config,
    inputs: node.data.inputs || [],
    position: node.position,
  }))
}
