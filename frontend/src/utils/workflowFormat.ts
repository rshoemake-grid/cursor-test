/**
 * Workflow Format Conversion Utilities
 * Converts between React Flow format and Workflow Definition format
 * Refactored to use nullCoalescing utilities (DRY + SOLID principles)
 */

import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../types/workflow'
import { coalesceObject, coalesceArray, coalesceObjectChain, coalesceArrayChain, coalesceStringChain } from './nullCoalescing'
import { safeGetProperty } from './safeAccess'
import { isDefined } from './typeGuards'

/**
 * Interface for workflow node data
 * Contains all possible config types and inputs
 */
export interface WorkflowNodeData {
  agent_config?: Record<string, any>
  condition_config?: Record<string, any>
  loop_config?: Record<string, any>
  input_config?: Record<string, any>
  inputs?: any[]
  name?: string
  label?: string
  description?: string
  [key: string]: any // Allow additional properties
}

/**
 * Interface for edge data
 * Supports both camelCase and snake_case handle properties
 */
export interface EdgeData {
  id?: string
  source: string
  target: string
  sourceHandle?: string | boolean | number | null
  source_handle?: string | boolean | number | null
  targetHandle?: string | boolean | number | null
  target_handle?: string | boolean | number | null
  label?: string
  [key: string]: any // Allow additional properties
}

/**
 * Config type constants for workflow nodes
 * Used to eliminate DRY violations in config merging
 */
const CONFIG_TYPES = ['agent_config', 'condition_config', 'loop_config', 'input_config'] as const

/**
 * Merge configs from data object and workflow node
 * Follows Open/Closed Principle - can be extended without modifying existing code
 * 
 * @param data - Data object (may contain configs)
 * @param wfNode - Workflow node (may contain configs)
 * @returns Merged configs object
 */
function mergeConfigs(data: WorkflowNodeData | null | undefined, wfNode: WorkflowNodeData | null | undefined): Record<string, any> {
  const configs: Record<string, any> = {}
  for (const configType of CONFIG_TYPES) {
    // Extract config values before coalescing for explicit handling
    const dataConfig = safeGetProperty(data, configType, undefined)
    const wfNodeConfig = safeGetProperty(wfNode, configType, undefined)
    configs[configType] = coalesceObjectChain({}, dataConfig, wfNodeConfig)
  }
  return configs
}

/**
 * Extract handle value from edge (supports both camelCase and snake_case)
 * Handles false values specially - treats as falsy (like || operator)
 * 
 * @param edge - The edge object
 * @param handleType - Either 'source' or 'target'
 * @returns The handle value as string | null
 */
function extractHandle(edge: EdgeData, handleType: 'source' | 'target'): string | null {
  const camelKey = `${handleType}Handle`
  const snakeKey = `${handleType}_handle`
  
  // Check camelCase first, treating false as falsy
  // Explicit boolean checks to prevent mutation survivors
  const camelValue = edge[camelKey]
  const isCamelDefined = isDefined(camelValue) === true
  const isCamelNotFalse = camelValue !== false
  if (isCamelDefined === true && isCamelNotFalse === true) {
    return normalizeHandle(camelValue)
  }
  
  // Check snake_case, treating false as falsy
  const snakeValue = edge[snakeKey]
  const isSnakeDefined = isDefined(snakeValue) === true
  const isSnakeNotFalse = snakeValue !== false
  if (isSnakeDefined === true && isSnakeNotFalse === true) {
    return normalizeHandle(snakeValue)
  }
  
  return null
}

/**
 * Normalize handle value to string | null
 * Converts boolean true to string "true", validates strings, handles numbers
 * 
 * @param handle - The handle value (any type)
 * @returns Normalized handle as string | null
 */
function normalizeHandle(handle: any): string | null {
  // Explicit boolean check
  if (handle === true) return "true"
  
  // Explicit type and value checks
  const isString = typeof handle === 'string'
  const isNonEmptyString = isString === true && handle !== ''
  if (isNonEmptyString === true) return handle
  
  // Explicit type check
  const isNumber = typeof handle === 'number'
  if (isNumber === true) return String(handle)
  
  return null
}

/**
 * Generate edge ID with fallback logic
 * 
 * @param edge - The edge object
 * @param sourceHandle - The source handle (may be null)
 * @returns Generated edge ID string
 */
function generateEdgeId(edge: EdgeData, sourceHandle: string | null): string {
  // Explicit checks to prevent mutation survivors
  const hasId = isDefined(edge.id) === true && edge.id !== ''
  if (hasId === true) {
    return edge.id!
  }
  
  // Explicit checks to prevent mutation survivors
  const hasSourceHandle = isDefined(sourceHandle) === true && sourceHandle !== ''
  if (hasSourceHandle === true) {
    return `${edge.source}-${sourceHandle}-${edge.target}`
  }
  
  return `${edge.source}-${edge.target}`
}

/**
 * Convert React Flow edges to WorkflowEdge format
 */
export function convertEdgesToWorkflowFormat(edges: Edge[]): WorkflowEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === 'string' ? edge.label : undefined
  }))
}

/**
 * Convert React Flow nodes to WorkflowNode format
 */
export function convertNodesToWorkflowFormat(nodes: Node[]): WorkflowNode[] {
  return nodes.map(node => {
    // Use coalesceStringChain to kill ConditionalExpression mutations
    const nodeName: string = coalesceStringChain(
      node.id, // default fallback
      (typeof node.data.name === 'string' && node.data.name !== '') ? node.data.name : null,
      (typeof node.data.label === 'string' && node.data.label !== '') ? node.data.label : null
    )
    
    return {
      id: node.id,
      type: node.type as any,
      name: nodeName,
      description: typeof node.data.description === 'string' ? node.data.description : undefined,
      agent_config: (node.data as any).agent_config,
      condition_config: (node.data as any).condition_config,
      loop_config: (node.data as any).loop_config,
      input_config: (node.data as any).input_config,
      inputs: coalesceArray(node.data.inputs as any[] | null | undefined, []),
      position: node.position,
    } as WorkflowNode
  })
}

/**
 * Create a workflow definition from component state
 */
export function createWorkflowDefinition(params: {
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
}): Omit<WorkflowDefinition, 'id'> {
  return {
    name: params.name,
    description: params.description,
    nodes: convertNodesToWorkflowFormat(params.nodes),
    edges: convertEdgesToWorkflowFormat(params.edges),
    variables: params.variables,
  }
}

/**
 * Initialize React Flow nodes with default configs
 */
export function initializeReactFlowNodes(nodes: Node[]): Node[] {
  return nodes.map(node => ({
    ...node,
    draggable: true,
    selected: false,
    data: {
      ...node.data,
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(node.data, {}),
      inputs: coalesceArray(node.data.inputs as any[] | null | undefined, []),
    }
  }))
}

/**
 * Format edges for React Flow, handling sourceHandle/targetHandle conversion
 */
export function formatEdgesForReactFlow(edges: EdgeData[]): Edge[] {
  return edges.map((edge: EdgeData) => {
    // Extract handles using utility functions
    const sourceHandle = extractHandle(edge, 'source')
    const targetHandle = extractHandle(edge, 'target')
    
    // Generate edge ID using utility function
    const edgeId = generateEdgeId(edge, sourceHandle)
    
    // Create edge object with sourceHandle/targetHandle set explicitly
    const formattedEdge: any = {
      id: edgeId,
      source: edge.source,
      target: edge.target,
    }
    
    // Only add sourceHandle/targetHandle if they have values
    // Explicit checks to prevent mutation survivors
    const hasSourceHandle = isDefined(sourceHandle) === true && sourceHandle !== ''
    if (hasSourceHandle === true) {
      formattedEdge.sourceHandle = String(sourceHandle)
    }
    const hasTargetHandle = isDefined(targetHandle) === true && targetHandle !== ''
    if (hasTargetHandle === true) {
      formattedEdge.targetHandle = String(targetHandle)
    }
    
    // Preserve other edge properties (but don't overwrite sourceHandle/targetHandle)
    Object.keys(edge).forEach(key => {
      if (key !== 'sourceHandle' && key !== 'source_handle' && key !== 'targetHandle' && key !== 'target_handle') {
        formattedEdge[key] = edge[key]
      }
    })
    
    return formattedEdge
  })
}

/**
 * Normalize node for storage (ensures all configs are objects)
 */
export function normalizeNodeForStorage(node: Node): Node {
  return {
    ...node,
    data: {
      ...node.data,
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(
        node.data,
        node
      ),
    },
  }
}

/**
 * Convert WorkflowNode to React Flow Node format
 */
export function workflowNodeToReactFlowNode(wfNode: any, nodeExecutionStates?: Record<string, { status: string; error?: string }>): Node {
  // Use coalesceObject to kill ConditionalExpression mutations
  const data = coalesceObject(wfNode.data, {})
  // Use safeGetProperty to kill OptionalChaining mutations
  const nodeExecutionState = safeGetProperty(nodeExecutionStates, wfNode.id, undefined)
  
  // Merge top-level fields with data object fields, preferring data object
  // Use coalesceObjectChain and coalesceStringChain to kill all || mutations
  return {
    id: wfNode.id,
    type: wfNode.type,
    position: coalesceObject(wfNode.position, { x: 0, y: 0 }),
    draggable: true,
    selected: false,
    data: {
      label: coalesceStringChain(
        wfNode.type, // final fallback
        data.label,
        data.name,
        wfNode.name
      ),
      name: coalesceStringChain(
        wfNode.type, // final fallback
        data.name,
        wfNode.name
      ),
      description: coalesceStringChain(
        '', // default
        data.description,
        wfNode.description
      ),
      // Merge configs - prefer data object, fallback to top-level
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(data, wfNode),
      inputs: coalesceArrayChain([], data.inputs, wfNode.inputs),
      // Add execution state for visual feedback
      // Use safeGetProperty to kill OptionalChaining mutations
      executionStatus: safeGetProperty(nodeExecutionState, 'status', undefined),
      executionError: safeGetProperty(nodeExecutionState, 'error', undefined),
    },
  }
}
