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

    it('should verify exact fallback values for all logical OR operators', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      // Verify exact fallback values (not mutated)
      expect(result.position).toEqual({ x: 0, y: 0 })
      expect(result.data.label).toBe('agent')
      expect(result.data.name).toBe('agent')
      expect(result.data.description).toBe('')
      expect(result.data.agent_config).toEqual({})
      expect(result.data.condition_config).toEqual({})
      expect(result.data.loop_config).toEqual({})
      expect(result.data.input_config).toEqual({})
      expect(result.data.inputs).toEqual([])
    })

    it('should verify nodeName fallback chain uses exact empty string', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            name: null as any,
            label: null as any,
          },
        },
      ]

      const result = convertNodesToWorkflowFormat(nodes)

      // Verify exact fallback chain: name || label || id
      expect(result[0].name).toBe('node1')
      expect(result[0].name).not.toBe('')
    })

    it('should verify sourceHandle || source_handle || null fallback chain', () => {
      // Test: no sourceHandle
      const edge1 = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
      }
      const result1 = formatEdgesForReactFlow([edge1])
      expect(result1[0].sourceHandle).toBeUndefined()

      // Test: has sourceHandle
      const edge2 = {
        id: 'e2',
        source: 'node1',
        target: 'node2',
        sourceHandle: 'output',
      }
      const result2 = formatEdgesForReactFlow([edge2])
      expect(result2[0].sourceHandle).toBe('output')

      // Test: has source_handle (snake_case)
      const edge3 = {
        id: 'e3',
        source: 'node1',
        target: 'node2',
        source_handle: 'input',
      }
      const result3 = formatEdgesForReactFlow([edge3])
      expect(result3[0].sourceHandle).toBe('input')
    })

    it('should verify boolean to string conversion uses exact true/false strings', () => {
      // Test: sourceHandle is true - gets converted to 'true' string
      const edge1 = {
        id: 'e1',
        source: 'node1',
        target: 'node2',
        sourceHandle: true,
      }
      const result1 = formatEdgesForReactFlow([edge1])
      // Verify exact 'true' string (not mutated)
      expect(result1[0].sourceHandle).toBe('true')
      expect(result1[0].sourceHandle).not.toBe(true)
      expect(result1[0].sourceHandle).not.toBe('True')

      // Test: sourceHandle is false
      // Note: false || null = null, so sourceHandle becomes null before the false check
      // The conversion check `if (sourceHandle === false)` never executes
      const edge2 = {
        source: 'node1',
        target: 'node2',
        sourceHandle: false,
      }
      const result2 = formatEdgesForReactFlow([edge2])
      // When sourceHandle is false, it becomes null via || chain
      expect(result2[0].sourceHandle).toBeUndefined()
      expect(result2[0].id).toBe('node1-node2') // No sourceHandle in ID (generated)

      // Test: targetHandle conversion
      const edge3 = {
        id: 'e3',
        source: 'node1',
        target: 'node2',
        targetHandle: true,
      }
      const result3 = formatEdgesForReactFlow([edge3])
      expect(result3[0].targetHandle).toBe('true')
      expect(result3[0].targetHandle).not.toBe(true)
    })

    it('should verify edge.id || generated fallback uses exact template', () => {
      const edge1 = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'output',
      }
      const result1 = formatEdgesForReactFlow([edge1])
      // Verify exact template: `${source}-${sourceHandle}-${target}`
      expect(result1[0].id).toBe('node1-output-node2')

      const edge2 = {
        source: 'node1',
        target: 'node2',
      }
      const result2 = formatEdgesForReactFlow([edge2])
      // Verify exact template: `${source}-${target}`
      expect(result2[0].id).toBe('node1-node2')
    })

    it('should verify initializeReactFlowNodes uses exact empty object/array fallbacks', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            agent_config: null as any,
            condition_config: undefined,
            loop_config: null as any,
            input_config: undefined,
            inputs: null as any,
          },
        },
      ]

      const result = initializeReactFlowNodes(nodes)

      // Verify exact empty object/array fallbacks (not mutated)
      expect(result[0].data.agent_config).toEqual({})
      expect(result[0].data.condition_config).toEqual({})
      expect(result[0].data.loop_config).toEqual({})
      expect(result[0].data.input_config).toEqual({})
      expect(result[0].data.inputs).toEqual([])
      expect(Object.keys(result[0].data.agent_config)).toHaveLength(0)
      expect(result[0].data.inputs.length).toBe(0)
    })

    it('should verify wfNode.data || {} uses exact empty object fallback', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: null,
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      // Verify data fallback to empty object
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('object')
    })

    it('should verify position || { x: 0, y: 0 } uses exact fallback values', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      // Verify exact fallback position values (not mutated)
      expect(result.position).toEqual({ x: 0, y: 0 })
      expect(result.position.x).toBe(0)
      expect(result.position.y).toBe(0)
      expect(result.position.x).not.toBe(1)
      expect(result.position.y).not.toBe(1)
    })

    it('should verify description ?? empty string uses exact empty string', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        description: null,
        data: { description: null },
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      // Verify exact empty string fallback (not null or undefined)
      expect(result.data.description).toBe('')
      expect(result.data.description.length).toBe(0)
    })

    it('should verify label fallback chain uses exact values', () => {
      // Test: data.label exists
      const wfNode1: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: { label: 'Label' },
      }
      const result1 = workflowNodeToReactFlowNode(wfNode1)
      expect(result1.data.label).toBe('Label')

      // Test: data.name exists
      const wfNode2: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        name: 'Name',
      }
      const result2 = workflowNodeToReactFlowNode(wfNode2)
      expect(result2.data.label).toBe('Name')

      // Test: wfNode.type fallback
      const wfNode3: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
      }
      const result3 = workflowNodeToReactFlowNode(wfNode3)
      expect(result3.data.label).toBe('agent')
    })

    it('should verify config fallback chains use exact empty object', () => {
      const wfNode: any = {
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
      }

      const result = workflowNodeToReactFlowNode(wfNode)

      // Verify all configs use exact empty object fallback
      expect(result.data.agent_config).toEqual({})
      expect(result.data.condition_config).toEqual({})
      expect(result.data.loop_config).toEqual({})
      expect(result.data.input_config).toEqual({})
      expect(result.data.inputs).toEqual([])
    })
  })
})
