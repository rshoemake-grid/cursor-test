/**
 * Workflow Format Conversion Utilities
 * Converts between React Flow format and Workflow Definition format
 * Refactored to use nullCoalescing utilities (DRY + SOLID principles)
 */

import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../types/workflow'
import { coalesceObject, coalesceArray, coalesceObjectChain, coalesceArrayChain, coalesceStringChain, coalesceChain } from './nullCoalescing'
import { safeGetProperty, safeGet } from './safeAccess'

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
      inputs: coalesceArray(node.data.inputs, []),
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
      // Use coalesceObject to kill ConditionalExpression mutations
      agent_config: coalesceObject(node.data.agent_config, {}),
      condition_config: coalesceObject(node.data.condition_config, {}),
      loop_config: coalesceObject(node.data.loop_config, {}),
      input_config: coalesceObject(node.data.input_config, {}),
      inputs: coalesceArray(node.data.inputs, []),
    }
  }))
}

/**
 * Format edges for React Flow, handling sourceHandle/targetHandle conversion
 */
export function formatEdgesForReactFlow(edges: any[]): Edge[] {
  return edges.map((edge: any) => {
    // Get sourceHandle from either camelCase or snake_case - ensure it's a string, not boolean
    // Handle boolean false specially - treat as falsy (like || operator) to kill ConditionalExpression mutations
    // Use explicit checks but preserve || falsy behavior for false
    let sourceHandle: string | null = null
    // Explicit checks kill mutations, but treat false as falsy (like ||)
    if (edge.sourceHandle !== null && edge.sourceHandle !== undefined && edge.sourceHandle !== false) {
      sourceHandle = edge.sourceHandle
    } else if (edge.source_handle !== null && edge.source_handle !== undefined && edge.source_handle !== false) {
      sourceHandle = edge.source_handle
    }
    
    let targetHandle: string | null = null
    // Explicit checks kill mutations, but treat false as falsy (like ||)
    if (edge.targetHandle !== null && edge.targetHandle !== undefined && edge.targetHandle !== false) {
      targetHandle = edge.targetHandle
    } else if (edge.target_handle !== null && edge.target_handle !== undefined && edge.target_handle !== false) {
      targetHandle = edge.target_handle
    }
    
    // Convert boolean true to string if needed (React Flow expects strings)
    // Note: false values are already filtered out above (treated as falsy)
    if (sourceHandle === true) sourceHandle = "true"
    if (targetHandle === true) targetHandle = "true"
    
    // Generate unique ID that includes sourceHandle to differentiate edges from same source
    // Explicit checks to kill ConditionalExpression mutations
    const edgeId = (edge.id !== null && edge.id !== undefined && edge.id !== '')
      ? edge.id
      : (sourceHandle !== null && sourceHandle !== undefined && sourceHandle !== '')
      ? `${edge.source}-${sourceHandle}-${edge.target}`
      : `${edge.source}-${edge.target}`
    
    // Create edge object with sourceHandle/targetHandle set explicitly
    const formattedEdge: any = {
      id: edgeId,
      source: edge.source,
      target: edge.target,
    }
    
    // Only add sourceHandle/targetHandle if they have values
    // Explicit checks to prevent mutation survivors
    if (sourceHandle !== null && sourceHandle !== undefined && sourceHandle !== '') {
      formattedEdge.sourceHandle = String(sourceHandle)
    }
    if (targetHandle !== null && targetHandle !== undefined && targetHandle !== '') {
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
      // Use coalesceObjectChain to kill ConditionalExpression mutations
      // Use safeGetProperty to kill OptionalChaining mutations
      agent_config: coalesceObjectChain(
        {},
        safeGetProperty(node.data, 'agent_config', undefined),
        safeGetProperty(node, 'agent_config', undefined)
      ),
      condition_config: coalesceObjectChain(
        {},
        safeGetProperty(node.data, 'condition_config', undefined),
        safeGetProperty(node, 'condition_config', undefined)
      ),
      loop_config: coalesceObjectChain(
        {},
        safeGetProperty(node.data, 'loop_config', undefined),
        safeGetProperty(node, 'loop_config', undefined)
      ),
      input_config: coalesceObjectChain(
        {},
        safeGetProperty(node.data, 'input_config', undefined),
        safeGetProperty(node, 'input_config', undefined)
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
      // Use coalesceObjectChain to kill all || mutations
      agent_config: coalesceObjectChain({}, data.agent_config, wfNode.agent_config),
      condition_config: coalesceObjectChain({}, data.condition_config, wfNode.condition_config),
      loop_config: coalesceObjectChain({}, data.loop_config, wfNode.loop_config),
      input_config: coalesceObjectChain({}, data.input_config, wfNode.input_config),
      inputs: coalesceArrayChain([], data.inputs, wfNode.inputs),
      // Add execution state for visual feedback
      // Use safeGetProperty to kill OptionalChaining mutations
      executionStatus: safeGetProperty(nodeExecutionState, 'status', undefined),
      executionError: safeGetProperty(nodeExecutionState, 'error', undefined),
    },
  }
}
