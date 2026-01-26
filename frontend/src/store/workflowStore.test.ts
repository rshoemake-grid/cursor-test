import { useWorkflowStore } from './workflowStore'
import type { WorkflowDefinition } from '../types/workflow'
import type { Node, Edge } from '@xyflow/react'

describe('useWorkflowStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWorkflowStore.setState({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      nodes: [],
      edges: [],
      variables: {},
    })
  })

  describe('Initial state', () => {
    it('should have initial state', () => {
      const state = useWorkflowStore.getState()
      
      expect(state.workflowId).toBeNull()
      expect(state.workflowName).toBe('Untitled Workflow')
      expect(state.workflowDescription).toBe('')
      expect(state.nodes).toEqual([])
      expect(state.edges).toEqual([])
      expect(state.variables).toEqual({})
    })
  })

  describe('Setters', () => {
    it('should set workflowId', () => {
      useWorkflowStore.getState().setWorkflowId('workflow-1')
      
      expect(useWorkflowStore.getState().workflowId).toBe('workflow-1')
    })

    it('should set workflowName', () => {
      useWorkflowStore.getState().setWorkflowName('My Workflow')
      
      expect(useWorkflowStore.getState().workflowName).toBe('My Workflow')
    })

    it('should set workflowDescription', () => {
      useWorkflowStore.getState().setWorkflowDescription('Description')
      
      expect(useWorkflowStore.getState().workflowDescription).toBe('Description')
    })

    it('should set nodes', () => {
      const nodes: Node[] = [
        { id: '1', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: '2', type: 'end', position: { x: 100, y: 100 }, data: {} },
      ]
      
      useWorkflowStore.getState().setNodes(nodes)
      
      expect(useWorkflowStore.getState().nodes).toEqual(nodes)
    })

    it('should set edges', () => {
      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
      ]
      
      useWorkflowStore.getState().setEdges(edges)
      
      expect(useWorkflowStore.getState().edges).toEqual(edges)
    })

    it('should set variables', () => {
      const variables = { var1: 'value1', var2: 42 }
      
      useWorkflowStore.getState().setVariables(variables)
      
      expect(useWorkflowStore.getState().variables).toEqual(variables)
    })
  })

  describe('Node operations', () => {
    it('should add node', () => {
      const node: Node = { id: '1', type: 'start', position: { x: 0, y: 0 }, data: {} }
      
      useWorkflowStore.getState().addNode(node)
      
      expect(useWorkflowStore.getState().nodes).toHaveLength(1)
      expect(useWorkflowStore.getState().nodes[0]).toEqual(node)
    })

    it('should update node', () => {
      const node: Node = { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } }
      useWorkflowStore.getState().addNode(node)
      
      useWorkflowStore.getState().updateNode('1', { label: 'Updated Start' })
      
      expect(useWorkflowStore.getState().nodes[0].data.label).toBe('Updated Start')
    })

    it('should not update non-existent node', () => {
      const node: Node = { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } }
      useWorkflowStore.getState().addNode(node)
      
      useWorkflowStore.getState().updateNode('2', { label: 'Updated' })
      
      expect(useWorkflowStore.getState().nodes[0].data.label).toBe('Start')
    })

    it('should remove node', () => {
      const node1: Node = { id: '1', type: 'start', position: { x: 0, y: 0 }, data: {} }
      const node2: Node = { id: '2', type: 'end', position: { x: 100, y: 100 }, data: {} }
      useWorkflowStore.getState().addNode(node1)
      useWorkflowStore.getState().addNode(node2)
      
      useWorkflowStore.getState().removeNode('1')
      
      expect(useWorkflowStore.getState().nodes).toHaveLength(1)
      expect(useWorkflowStore.getState().nodes[0].id).toBe('2')
    })

    it('should remove edges connected to removed node', () => {
      const node1: Node = { id: '1', type: 'start', position: { x: 0, y: 0 }, data: {} }
      const node2: Node = { id: '2', type: 'end', position: { x: 100, y: 100 }, data: {} }
      useWorkflowStore.getState().addNode(node1)
      useWorkflowStore.getState().addNode(node2)
      
      const edge1: Edge = { id: 'e1', source: '1', target: '2' }
      const edge2: Edge = { id: 'e2', source: '2', target: '3' }
      useWorkflowStore.getState().addEdge(edge1)
      useWorkflowStore.getState().addEdge(edge2)
      
      useWorkflowStore.getState().removeNode('1')
      
      expect(useWorkflowStore.getState().edges).toHaveLength(1)
      expect(useWorkflowStore.getState().edges[0].id).toBe('e2')
    })
  })

  describe('Edge operations', () => {
    it('should add edge', () => {
      const edge: Edge = { id: 'e1', source: '1', target: '2' }
      
      useWorkflowStore.getState().addEdge(edge)
      
      expect(useWorkflowStore.getState().edges).toHaveLength(1)
      expect(useWorkflowStore.getState().edges[0]).toEqual(edge)
    })

    it('should remove edge', () => {
      const edge1: Edge = { id: 'e1', source: '1', target: '2' }
      const edge2: Edge = { id: 'e2', source: '2', target: '3' }
      useWorkflowStore.getState().addEdge(edge1)
      useWorkflowStore.getState().addEdge(edge2)
      
      useWorkflowStore.getState().removeEdge('e1')
      
      expect(useWorkflowStore.getState().edges).toHaveLength(1)
      expect(useWorkflowStore.getState().edges[0].id).toBe('e2')
    })
  })

  describe('Workflow management', () => {
    it('should load workflow', () => {
      const workflow: WorkflowDefinition = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [
          {
            id: '1',
            type: 'start',
            name: 'Start',
            position: { x: 0, y: 0 },
          },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
        ],
        variables: { var1: 'value1' },
      }
      
      useWorkflowStore.getState().loadWorkflow(workflow)
      
      const state = useWorkflowStore.getState()
      expect(state.workflowId).toBe('workflow-1')
      expect(state.workflowName).toBe('Test Workflow')
      expect(state.workflowDescription).toBe('Test Description')
      expect(state.nodes).toHaveLength(1)
      expect(state.edges).toHaveLength(1)
      expect(state.variables).toEqual({ var1: 'value1' })
    })

    it('should load workflow without id', () => {
      const workflow: WorkflowDefinition = {
        id: undefined as any,
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [],
        edges: [],
        variables: {},
      }
      
      useWorkflowStore.getState().loadWorkflow(workflow)
      
      expect(useWorkflowStore.getState().workflowId).toBeNull()
    })

    it('should load workflow with nested data structure', () => {
      const workflow: WorkflowDefinition = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [
          {
            id: '1',
            type: 'start',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start Node',
              name: 'start',
            },
          } as any,
        ],
        edges: [],
        variables: {},
      }
      
      useWorkflowStore.getState().loadWorkflow(workflow)
      
      const node = useWorkflowStore.getState().nodes[0]
      expect(node.data.label).toBe('Start Node')
      expect(node.data.name).toBe('start')
    })

    it('should clear workflow', () => {
      const workflow: WorkflowDefinition = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [
          { id: '1', type: 'start', name: 'Start', position: { x: 0, y: 0 } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
        ],
        variables: { var1: 'value1' },
      }
      
      useWorkflowStore.getState().loadWorkflow(workflow)
      useWorkflowStore.getState().clearWorkflow()
      
      const state = useWorkflowStore.getState()
      expect(state.workflowId).toBeNull()
      expect(state.workflowName).toBe('Untitled Workflow')
      expect(state.workflowDescription).toBe('')
      expect(state.nodes).toEqual([])
      expect(state.edges).toEqual([])
      expect(state.variables).toEqual({})
    })

    it('should convert to workflow definition', () => {
      const node: Node = {
        id: '1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start', name: 'start', description: 'Start node' },
      }
      const edge: Edge = { id: 'e1', source: '1', target: '2' }
      
      useWorkflowStore.getState().setWorkflowName('My Workflow')
      useWorkflowStore.getState().setWorkflowDescription('Description')
      useWorkflowStore.getState().addNode(node)
      useWorkflowStore.getState().addEdge(edge)
      useWorkflowStore.getState().setVariables({ var1: 'value1' })
      
      const workflow = useWorkflowStore.getState().toWorkflowDefinition()
      
      expect(workflow.name).toBe('My Workflow')
      expect(workflow.description).toBe('Description')
      expect(workflow.nodes).toHaveLength(1)
      expect(workflow.nodes[0].id).toBe('1')
      // The name comes from node.data.label || node.data.name || node.id
      // Since we set label: 'Start', it should be 'Start'
      expect(workflow.nodes[0].name).toBe('Start')
      expect(workflow.edges).toHaveLength(1)
      expect(workflow.variables).toEqual({ var1: 'value1' })
    })

    it('should convert node with label fallback to name', () => {
      const node: Node = {
        id: '1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start Label' },
      }
      
      useWorkflowStore.getState().addNode(node)
      
      const workflow = useWorkflowStore.getState().toWorkflowDefinition()
      
      expect(workflow.nodes[0].name).toBe('Start Label')
    })

    it('should convert node with name fallback to id', () => {
      const node: Node = {
        id: 'node-1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {},
      }
      
      useWorkflowStore.getState().addNode(node)
      
      const workflow = useWorkflowStore.getState().toWorkflowDefinition()
      
      expect(workflow.nodes[0].name).toBe('node-1')
    })
  })
})
