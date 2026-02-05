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
  return nodes.map((node: any) => {
    // Explicit checks to prevent mutation survivors
    const name = (node.data.name !== null && node.data.name !== undefined && node.data.name !== '')
      ? node.data.name
      : (typeof node.data.label === 'string' && node.data.label !== null && node.data.label !== undefined && node.data.label !== '')
      ? node.data.label
      : ''
    
    // Explicit check to prevent mutation survivors
    const inputs = (node.data.inputs !== null && node.data.inputs !== undefined && Array.isArray(node.data.inputs))
      ? node.data.inputs
      : []
    
    return {
      id: node.id,
      type: node.type as any, // NodeType from workflow types
      name,
      description: node.data.description,
      agent_config: (node.data as any).agent_config,
      condition_config: (node.data as any).condition_config,
      loop_config: node.data.loop_config,
      input_config: node.data.input_config,
      inputs,
      position: node.position,
    }
  })
}
