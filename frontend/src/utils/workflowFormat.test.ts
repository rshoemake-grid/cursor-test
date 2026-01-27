/**
 * Tests for workflow format conversion utilities
 */

import {
  convertEdgesToWorkflowFormat,
  convertNodesToWorkflowFormat,
  createWorkflowDefinition,
  initializeReactFlowNodes,
  formatEdgesForReactFlow,
  normalizeNodeForStorage,
  workflowNodeToReactFlowNode,
} from './workflowFormat'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge } from '../types/workflow'

describe('workflowFormat utilities', () => {
  describe('convertEdgesToWorkflowFormat', () => {
    it('should convert React Flow edges to WorkflowEdge format', () => {
      const edges: Edge[] = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          label: 'Connection',
        },
        {
          id: 'e2',
          source: 'node2',
          target: 'node3',
        },
      ]

      const result = convertEdgesToWorkflowFormat(edges)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'e1',
        source: 'node1',
        target: 'node2',
        label: 'Connection',
      })
      expect(result[1]).toEqual({
        id: 'e2',
        source: 'node2',
        target: 'node3',
        label: undefined,
      })
    })

    it('should handle edges with ReactNode labels', () => {
      const ReactNodeLabel = { type: 'span', props: {}, children: 'React Node' }
      const edges: Edge[] = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          label: ReactNodeLabel as any,
        },
      ]

      const result = convertEdgesToWorkflowFormat(edges)

      expect(result[0].label).toBeUndefined()
    })

    it('should handle empty edges array', () => {
      const result = convertEdgesToWorkflowFormat([])
      expect(result).toEqual([])
    })
  })

  describe('convertNodesToWorkflowFormat', () => {
    it('should convert React Flow nodes to WorkflowNode format', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 100, y: 200 },
          data: {
            name: 'Test Agent',
            description: 'Test description',
            agent_config: { model: 'gpt-4' },
            inputs: [],
          },
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'node1',
        type: 'agent',
        name: 'Test Agent',
        description: 'Test description',
        agent_config: { model: 'gpt-4' },
        condition_config: undefined,
        loop_config: undefined,
        input_config: undefined,
        inputs: [],
        position: { x: 100, y: 200 },
      })
    })

    it('should use label if name is not available', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            label: 'Agent Label',
            description: 'Test',
          },
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      expect(result[0].name).toBe('Agent Label')
    })

    it('should use node id if neither name nor label is available', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {},
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      expect(result[0].name).toBe('node1')
    })

    it('should handle nodes with all config types', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: 'Test',
            agent_config: { model: 'gpt-4' },
            condition_config: { condition_type: 'equals' },
            loop_config: { loop_type: 'for_each' },
            input_config: { mode: 'read' },
            inputs: [{ name: 'input1' }],
          },
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      expect(result[0].agent_config).toEqual({ model: 'gpt-4' })
      expect(result[0].condition_config).toEqual({ condition_type: 'equals' })
      expect(result[0].loop_config).toEqual({ loop_type: 'for_each' })
      expect(result[0].input_config).toEqual({ mode: 'read' })
      expect(result[0].inputs).toEqual([{ name: 'input1' }])
    })

    it('should handle empty inputs array', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: 'Test',
            inputs: null as any,
          },
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      expect(result[0].inputs).toEqual([])
    })
  })

  describe('createWorkflowDefinition', () => {
    it('should create workflow definition from component state', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Agent 1' },
        },
      ]

      const edges: Edge[] = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
        },
      ]

      const result = createWorkflowDefinition({
        name: 'Test Workflow',
        description: 'Test Description',
        nodes,
        edges,
        variables: { var1: 'value1' },
      })

      expect(result.name).toBe('Test Workflow')
      expect(result.description).toBe('Test Description')
      expect(result.nodes).toHaveLength(1)
      expect(result.edges).toHaveLength(1)
      expect(result.variables).toEqual({ var1: 'value1' })
    })

    it('should handle empty nodes and edges', () => {
      const result = createWorkflowDefinition({
        name: 'Empty Workflow',
        description: '',
        nodes: [],
        edges: [],
        variables: {},
      })

      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
      expect(result.variables).toEqual({})
    })
  })

  describe('initializeReactFlowNodes', () => {
    it('should initialize nodes with default configs', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: 'Test',
          },
        },
      ]

      const result = initializeReactFlowNodes(nodes)

      expect(result[0].draggable).toBe(true)
      expect(result[0].selected).toBe(false)
      expect(result[0].data.agent_config).toEqual({})
      expect(result[0].data.condition_config).toEqual({})
      expect(result[0].data.loop_config).toEqual({})
      expect(result[0].data.input_config).toEqual({})
      expect(result[0].data.inputs).toEqual([])
    })

    it('should preserve existing configs', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: 'Test',
            agent_config: { model: 'gpt-4' },
            inputs: [{ name: 'input1' }],
          },
        },
      ]

      const result = initializeReactFlowNodes(nodes)

      expect(result[0].data.agent_config).toEqual({ model: 'gpt-4' })
      expect(result[0].data.inputs).toEqual([{ name: 'input1' }])
    })

    it('should convert null/undefined configs to empty objects', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: 'Test',
            agent_config: null as any,
            condition_config: undefined as any,
          },
        },
      ]

      const result = initializeReactFlowNodes(nodes)

      expect(result[0].data.agent_config).toEqual({})
      expect(result[0].data.condition_config).toEqual({})
    })
  })

  describe('formatEdgesForReactFlow', () => {
    it('should format edges with sourceHandle and targetHandle', () => {
      const edges = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          sourceHandle: 'true',
          targetHandle: 'false',
        },
      ]

      const result = formatEdgesForReactFlow(edges)

      expect(result[0].sourceHandle).toBe('true')
      expect(result[0].targetHandle).toBe('false')
    })

    it('should handle snake_case source_handle', () => {
      const edges = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          source_handle: 'output',
        },
      ]

      const result = formatEdgesForReactFlow(edges)

      expect(result[0].sourceHandle).toBe('output')
    })

    it('should convert boolean handles to strings', () => {
      const edges = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          sourceHandle: true,
          targetHandle: false,
        },
      ]

      const result = formatEdgesForReactFlow(edges)

      expect(result[0].sourceHandle).toBe('true')
      // Note: false is converted to 'false' but then filtered out because it's falsy
      // The implementation only adds handles if they have truthy values
      expect(result[0].targetHandle).toBeUndefined()
    })

    it('should generate edge ID if not provided', () => {
      const edges = [
        {
          source: 'node1',
          target: 'node2',
          sourceHandle: 'output',
        },
      ]

      const result = formatEdgesForReactFlow(edges)

      expect(result[0].id).toBe('node1-output-node2')
    })

    it('should preserve other edge properties', () => {
      const edges = [
        {
          id: 'e1',
          source: 'node1',
          target: 'node2',
          label: 'Custom Label',
          animated: true,
        },
      ]

      const result = formatEdgesForReactFlow(edges)

      expect(result[0].label).toBe('Custom Label')
      expect(result[0].animated).toBe(true)
    })
  })

  describe('normalizeNodeForStorage', () => {
    it('should normalize node configs for storage', () => {
      const node: Node = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
        },
      }

      const result = normalizeNodeForStorage(node)

      expect(result.data.agent_config).toEqual({})
      expect(result.data.condition_config).toEqual({})
      expect(result.data.loop_config).toEqual({})
      expect(result.data.input_config).toEqual({})
    })

    it('should preserve existing configs', () => {
      const node: Node = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          agent_config: { model: 'gpt-4' },
        },
      }

      const result = normalizeNodeForStorage(node)

      expect(result.data.agent_config).toEqual({ model: 'gpt-4' })
    })

    it('should handle nodes with configs at top level', () => {
      const node: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        agent_config: { model: 'gpt-4' },
        data: {},
      }

      const result = normalizeNodeForStorage(node)

      expect(result.data.agent_config).toEqual({ model: 'gpt-4' })
    })
  })

  describe('workflowNodeToReactFlowNode', () => {
    it('should convert WorkflowNode to React Flow Node', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        name: 'Test Agent',
        description: 'Test Description',
        position: { x: 100, y: 200 },
        agent_config: { model: 'gpt-4' },
        inputs: [],
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      expect(result.id).toBe('node1')
      expect(result.type).toBe('agent')
      expect(result.position).toEqual({ x: 100, y: 200 })
      expect(result.draggable).toBe(true)
      expect(result.selected).toBe(false)
      expect(result.data.name).toBe('Test Agent')
      expect(result.data.description).toBe('Test Description')
      expect(result.data.agent_config).toEqual({ model: 'gpt-4' })
    })

    it('should handle nested data object', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        name: 'Top Level Name',
        data: {
          name: 'Nested Name',
          label: 'Nested Label',
          agent_config: { model: 'gpt-4' },
        },
        position: { x: 0, y: 0 },
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      expect(result.data.name).toBe('Nested Name')
      expect(result.data.label).toBe('Nested Label')
      expect(result.data.agent_config).toEqual({ model: 'gpt-4' })
    })

    it('should add execution state if provided', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        name: 'Test',
        position: { x: 0, y: 0 },
      }

      const nodeExecutionStates = {
        node1: { status: 'running', error: undefined },
      }

      const result = workflowNodeToReactFlowNode(wfNode, nodeExecutionStates)

      expect(result.data.executionStatus).toBe('running')
      expect(result.data.executionError).toBeUndefined()
    })

    it('should handle missing position', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        name: 'Test',
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      expect(result.position).toEqual({ x: 0, y: 0 })
    })

    it('should use fallback for name if not provided', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      expect(result.data.name).toBe('agent')
      expect(result.data.label).toBe('agent')
    })
  })
})
