import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../types/workflow'

interface WorkflowStore {
  // Current workflow state
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  nodes: Node[]
  edges: Edge[]
  variables: Record<string, any>
  
  // Actions
  setWorkflowId: (id: string | null) => void
  setWorkflowName: (name: string) => void
  setWorkflowDescription: (description: string) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setVariables: (variables: Record<string, any>) => void
  addNode: (node: Node) => void
  updateNode: (nodeId: string, data: any) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: Edge) => void
  removeEdge: (edgeId: string) => void
  
  // Workflow management
  loadWorkflow: (workflow: WorkflowDefinition) => void
  clearWorkflow: () => void
  toWorkflowDefinition: () => Omit<WorkflowDefinition, 'id'>
}

// Convert our node format to WorkflowNode format
const nodeToWorkflowNode = (node: Node): WorkflowNode => ({
  id: node.id,
  type: node.type as any,
  name: node.data.label || node.data.name || node.id,
  description: node.data.description,
  agent_config: node.data.agent_config,
  condition_config: node.data.condition_config,
  loop_config: node.data.loop_config,
  inputs: node.data.inputs || [],
  position: node.position,
})

// Convert WorkflowNode to our node format
const workflowNodeToNode = (wfNode: WorkflowNode): Node => ({
  id: wfNode.id,
  type: wfNode.type,
  position: wfNode.position,
  data: {
    label: wfNode.name,
    name: wfNode.name,
    description: wfNode.description,
    agent_config: wfNode.agent_config,
    condition_config: wfNode.condition_config,
    loop_config: wfNode.loop_config,
    inputs: wfNode.inputs,
  },
})

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflowId: null,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  nodes: [],
  edges: [],
  variables: {},

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setWorkflowDescription: (description) => set({ workflowDescription: description }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setVariables: (variables) => set({ variables }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    })),

  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  
  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),

  loadWorkflow: (workflow) => {
    const nodes = workflow.nodes.map(workflowNodeToNode)
    const edges = workflow.edges as Edge[]
    
    set({
      workflowId: workflow.id || null,
      workflowName: workflow.name,
      workflowDescription: workflow.description || '',
      nodes,
      edges,
      variables: workflow.variables,
    })
  },

  clearWorkflow: () =>
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      nodes: [],
      edges: [],
      variables: {},
    }),

  toWorkflowDefinition: () => {
    const state = get()
    return {
      name: state.workflowName,
      description: state.workflowDescription,
      nodes: state.nodes.map(nodeToWorkflowNode),
      edges: state.edges as WorkflowEdge[],
      variables: state.variables,
    }
  },
}))

