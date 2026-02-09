/**
 * Node Conversion Utilities
 * Converts React Flow nodes to various formats for different use cases
 * Refactored to use nullCoalescing utilities (DRY + SOLID principles)
 */

import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'
import { coalesceStringChain, coalesceArray } from './nullCoalescing'

/**
 * Convert React Flow nodes to WorkflowNode format for ExecutionInputDialog
 */
export function convertNodesForExecutionInput(nodes: Node[]): WorkflowNode[] {
  return nodes.map((node: any) => {
    // Explicit checks to prevent mutation survivors
    const hasName = node.data.name !== null && node.data.name !== undefined && node.data.name !== ''
    const nameValue = hasName === true ? node.data.name : null
    
    // Explicit checks for label
    const isStringLabel = typeof node.data.label === 'string'
    const hasLabel = isStringLabel === true && node.data.label !== null && node.data.label !== undefined && node.data.label !== ''
    const labelValue = hasLabel === true ? node.data.label : null
    
    // Use coalesceStringChain to kill ConditionalExpression mutations
    const name = coalesceStringChain('', nameValue, labelValue)
    
    // Use coalesceArray to kill ConditionalExpression mutations
    const inputs = coalesceArray(node.data.inputs, [])
    
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
