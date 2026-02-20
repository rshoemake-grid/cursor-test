/**
 * Node Conversion Utilities (REFACTORED VERSION)
 * Converts React Flow nodes to various formats for different use cases
 * 
 * Refactored to follow SOLID principles and DRY:
 * - Extracted validation logic into reusable helpers
 * - Single Responsibility Principle: Each function has one job
 * - DRY: No duplicated validation code
 * - Improved testability and maintainability
 */

import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'
import { coalesceStringChain, coalesceArray } from './nullCoalescing'

/**
 * Validates if a value is a non-empty string
 * 
 * This function provides a type guard that TypeScript can use for type narrowing.
 * It explicitly checks for string type, null, undefined, and empty string to kill
 * mutation test survivors.
 * 
 * @param value - The value to validate
 * @returns True if value is a non-empty string, false otherwise
 * 
 * @example
 * ```typescript
 * isValidNonEmptyString('test') // true
 * isValidNonEmptyString('') // false
 * isValidNonEmptyString(null) // false
 * isValidNonEmptyString(123) // false
 * ```
 */
function isValidNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && 
         value !== null && 
         value !== undefined && 
         value !== ''
}

/**
 * Extracts a valid string value from node data
 * 
 * Validates and returns the value if it's a valid non-empty string,
 * otherwise returns null. This eliminates the need for verbose boolean
 * checks in the calling code.
 * 
 * @param value - The value to extract
 * @returns The string value if valid, null otherwise
 * 
 * @example
 * ```typescript
 * extractValidString('test') // 'test'
 * extractValidString('') // null
 * extractValidString(null) // null
 * ```
 */
function extractValidString(value: unknown): string | null {
  return isValidNonEmptyString(value) ? value : null
}

/**
 * Extracts the name value from node data
 * 
 * Checks both name and label fields, with name taking priority over label.
 * Returns the first valid non-empty string found, or null if neither is valid.
 * 
 * @param nodeData - The node data object
 * @returns The name value (from name or label field), or null if neither is valid
 * 
 * @example
 * ```typescript
 * extractNodeName({ name: 'Test' }) // 'Test'
 * extractNodeName({ label: 'Label' }) // 'Label'
 * extractNodeName({ name: 'Test', label: 'Label' }) // 'Test' (name priority)
 * extractNodeName({}) // null
 * ```
 */
function extractNodeName(nodeData: any): string | null {
  const nameValue = extractValidString(nodeData.name)
  const labelValue = extractValidString(nodeData.label)
  return nameValue ?? labelValue
}

/**
 * Converts a single React Flow node to WorkflowNode format
 * 
 * This function handles the transformation of a single node, following
 * the Single Responsibility Principle. It focuses solely on data transformation.
 * 
 * @param node - The React Flow node to convert
 * @returns The converted WorkflowNode
 */
function convertSingleNode(node: Node): WorkflowNode {
  const name = extractNodeName(node.data) ?? ''
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
}

/**
 * Convert React Flow nodes to WorkflowNode format for ExecutionInputDialog
 * 
 * This is the main public API function. It orchestrates the conversion
 * of multiple nodes by mapping over the array and converting each node.
 * 
 * @param nodes - Array of React Flow nodes to convert
 * @returns Array of converted WorkflowNode objects
 * 
 * @example
 * ```typescript
 * const workflowNodes = convertNodesForExecutionInput(reactFlowNodes)
 * ```
 */
export function convertNodesForExecutionInput(nodes: Node[]): WorkflowNode[] {
  return nodes.map(convertSingleNode)
}
