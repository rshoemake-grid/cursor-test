/**
 * Workflow Format Conversion Utilities
 * Converts between React Flow format and Workflow Definition format
 */

import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../types/workflow'

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
    const nodeName: string = 
      (typeof node.data.name === 'string' ? node.data.name : '') ||
      (typeof node.data.label === 'string' ? node.data.label : '') ||
      node.id
    return {
      id: node.id,
      type: node.type as any,
      name: nodeName,
      description: typeof node.data.description === 'string' ? node.data.description : undefined,
      agent_config: (node.data as any).agent_config,
      condition_config: (node.data as any).condition_config,
      loop_config: (node.data as any).loop_config,
      input_config: (node.data as any).input_config,
      inputs: Array.isArray(node.data.inputs) ? node.data.inputs : [],
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
      // Ensure configs are objects, not null/undefined
      agent_config: node.data.agent_config || {},
      condition_config: node.data.condition_config || {},
      loop_config: node.data.loop_config || {},
      input_config: node.data.input_config || {},
      inputs: node.data.inputs || [],
    }
  }))
}

/**
 * Format edges for React Flow, handling sourceHandle/targetHandle conversion
 */
export function formatEdgesForReactFlow(edges: any[]): Edge[] {
  return edges.map((edge: any) => {
    // Get sourceHandle from either camelCase or snake_case - ensure it's a string, not boolean
    let sourceHandle = edge.sourceHandle || edge.source_handle || null
    let targetHandle = edge.targetHandle || edge.target_handle || null
    
    // Convert boolean to string if needed (React Flow expects strings)
    if (sourceHandle === true) sourceHandle = "true"
    if (sourceHandle === false) sourceHandle = "false"
    if (targetHandle === true) targetHandle = "true"
    if (targetHandle === false) targetHandle = "false"
    
    // Generate unique ID that includes sourceHandle to differentiate edges from same source
    const edgeId = edge.id || (sourceHandle 
      ? `${edge.source}-${sourceHandle}-${edge.target}` 
      : `${edge.source}-${edge.target}`)
    
    // Create edge object with sourceHandle/targetHandle set explicitly
    const formattedEdge: any = {
      id: edgeId,
      source: edge.source,
      target: edge.target,
    }
    
    // Only add sourceHandle/targetHandle if they have values
    if (sourceHandle) {
      formattedEdge.sourceHandle = String(sourceHandle)
    }
    if (targetHandle) {
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
      agent_config: (node.data as any)?.agent_config ?? (node as any).agent_config ?? {},
      condition_config: (node.data as any)?.condition_config ?? (node as any).condition_config ?? {},
      loop_config: (node.data as any)?.loop_config ?? (node as any).loop_config ?? {},
      input_config: (node.data as any)?.input_config ?? (node as any).input_config ?? {},
    },
  }
}

/**
 * Convert WorkflowNode to React Flow Node format
 */
export function workflowNodeToReactFlowNode(wfNode: any, nodeExecutionStates?: Record<string, { status: string; error?: string }>): Node {
  const data = wfNode.data || {}
  const nodeExecutionState = nodeExecutionStates?.[wfNode.id]
  
  // Merge top-level fields with data object fields, preferring data object
  return {
    id: wfNode.id,
    type: wfNode.type,
    position: wfNode.position || { x: 0, y: 0 },
    draggable: true,
    selected: false,
    data: {
      label: data.label || data.name || wfNode.name || wfNode.type,
      name: data.name || wfNode.name || wfNode.type,
      description: data.description ?? wfNode.description ?? '',
      // Merge configs - prefer data object, fallback to top-level
      agent_config: data.agent_config || wfNode.agent_config || {},
      condition_config: data.condition_config || wfNode.condition_config || {},
      loop_config: data.loop_config || wfNode.loop_config || {},
      input_config: data.input_config || wfNode.input_config || {},
      inputs: data.inputs || wfNode.inputs || [],
      // Add execution state for visual feedback
      executionStatus: nodeExecutionState?.status,
      executionError: nodeExecutionState?.error,
    },
  }
}
