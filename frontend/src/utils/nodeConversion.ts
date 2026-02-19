/**
 * Node Conversion Utilities
 * Converts React Flow nodes to various formats for different use cases
 * Refactored to use nullCoalescing utilities (DRY + SOLID principles)
 */

import type { Node } from '@xyflow/react'
import type { WorkflowNode, NodeType } from '../types/workflow'
import { coalesceStringChain, coalesceArray } from './nullCoalescing'
import { isNonEmptyString } from './validationHelpers'

/**
 * Convert React Flow nodes to WorkflowNode format for ExecutionInputDialog
 */
export function convertNodesForExecutionInput(nodes: Node[]): WorkflowNode[] {
  return nodes.map((node: Node) => {
    // Use validation helper to extract valid strings (DRY - eliminates duplication)
    // Type assertion needed as node.data is typed as Record<string, unknown>
    const nodeData = node.data as Record<string, unknown>
    const nameValue = isNonEmptyString(nodeData.name) ? nodeData.name as string : null
    const labelValue = isNonEmptyString(nodeData.label) ? nodeData.label as string : null
    
    // Use coalesceStringChain to kill ConditionalExpression mutations
    const name = coalesceStringChain('', nameValue, labelValue)
    
    // Use coalesceArray to kill ConditionalExpression mutations
    const inputs = coalesceArray(nodeData.inputs as WorkflowNode['inputs'] | null | undefined, [])
    
    return {
      id: node.id,
      type: node.type as NodeType, // NodeType from workflow types
      name,
      description: nodeData.description as string | undefined,
      // Type conversion needed due to slight differences between NodeData and WorkflowNode types
      agent_config: nodeData.agent_config as WorkflowNode['agent_config'],
      condition_config: nodeData.condition_config as WorkflowNode['condition_config'],
      loop_config: nodeData.loop_config as WorkflowNode['loop_config'],
      input_config: nodeData.input_config,
      inputs,
      position: node.position,
    }
  })
}
