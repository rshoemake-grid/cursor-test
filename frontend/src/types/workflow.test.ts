/**
 * Tests for types/workflow.ts type definitions
 * 
 * This file tests that workflow-related types are correctly defined
 * and can be used to create valid workflow objects.
 */

import type {
  NodeType,
  ExecutionStatus,
  AgentConfig,
  InputMapping,
  ConditionConfig,
  LoopConfig,
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  NodeState,
  ExecutionLogEntry,
  ExecutionState,
} from './workflow'
import {
  isValidNodeType,
  isValidExecutionStatus,
  isValidConditionType,
  isValidLoopType,
  isValidEdgeCondition,
} from './workflow'
// Import the module to ensure all runtime code is executed
import * as workflowModule from './workflow'

describe('types/workflow.ts', () => {
  describe('NodeType', () => {
    it('should accept valid node types', () => {
      const validTypes: NodeType[] = ['agent', 'condition', 'loop', 'start', 'end']
      validTypes.forEach((type) => {
        expect(['agent', 'condition', 'loop', 'start', 'end']).toContain(type)
      })
    })
  })

  describe('ExecutionStatus', () => {
    it('should accept valid execution statuses', () => {
      const validStatuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
      validStatuses.forEach((status) => {
        expect(['pending', 'running', 'completed', 'failed', 'paused']).toContain(status)
      })
    })
  })

  describe('AgentConfig', () => {
    it('should create valid AgentConfig object', () => {
      const config: AgentConfig = {
        model: 'gpt-4',
        temperature: 0.7,
      }
      expect(config.model).toBe('gpt-4')
      expect(config.temperature).toBe(0.7)
    })

    it('should allow optional fields in AgentConfig', () => {
      const config: AgentConfig = {
        model: 'gpt-4',
        temperature: 0.7,
        system_prompt: 'You are a helpful assistant',
        max_tokens: 1000,
        tools: ['tool1', 'tool2'],
      }
      expect(config.system_prompt).toBe('You are a helpful assistant')
      expect(config.max_tokens).toBe(1000)
      expect(config.tools).toEqual(['tool1', 'tool2'])
    })
  })

  describe('InputMapping', () => {
    it('should create valid InputMapping object', () => {
      const mapping: InputMapping = {
        name: 'input1',
        source_field: 'output',
      }
      expect(mapping.name).toBe('input1')
      expect(mapping.source_field).toBe('output')
    })

    it('should allow optional source_node in InputMapping', () => {
      const mapping: InputMapping = {
        name: 'input1',
        source_node: 'node-1',
        source_field: 'output',
      }
      expect(mapping.source_node).toBe('node-1')
    })
  })

  describe('ConditionConfig', () => {
    it('should create valid ConditionConfig object', () => {
      const config: ConditionConfig = {
        condition_type: 'equals',
        field: 'status',
        value: 'active',
      }
      expect(config.condition_type).toBe('equals')
      expect(config.field).toBe('status')
      expect(config.value).toBe('active')
    })

    it('should allow optional branches in ConditionConfig', () => {
      const config: ConditionConfig = {
        condition_type: 'equals',
        field: 'status',
        value: 'active',
        true_branch: 'node-true',
        false_branch: 'node-false',
      }
      expect(config.true_branch).toBe('node-true')
      expect(config.false_branch).toBe('node-false')
    })
  })

  describe('LoopConfig', () => {
    it('should create valid LoopConfig object', () => {
      const config: LoopConfig = {
        loop_type: 'for_each',
        items_source: 'array',
      }
      expect(config.loop_type).toBe('for_each')
      expect(config.items_source).toBe('array')
    })

    it('should allow optional fields in LoopConfig', () => {
      const config: LoopConfig = {
        loop_type: 'while',
        condition: 'i < 10',
        max_iterations: 100,
      }
      expect(config.condition).toBe('i < 10')
      expect(config.max_iterations).toBe(100)
    })
  })

  describe('WorkflowNode', () => {
    it('should create valid WorkflowNode object', () => {
      const node: WorkflowNode = {
        id: 'node-1',
        type: 'agent',
        name: 'Test Node',
        inputs: [],
        position: { x: 0, y: 0 },
      }
      expect(node.id).toBe('node-1')
      expect(node.type).toBe('agent')
      expect(node.name).toBe('Test Node')
      expect(node.inputs).toEqual([])
      expect(node.position).toEqual({ x: 0, y: 0 })
    })

    it('should allow optional fields in WorkflowNode', () => {
      const node: WorkflowNode = {
        id: 'node-1',
        type: 'agent',
        name: 'Test Node',
        description: 'A test node',
        agent_config: {
          model: 'gpt-4',
          temperature: 0.7,
        },
        inputs: [],
        position: { x: 100, y: 200 },
      }
      expect(node.description).toBe('A test node')
      expect(node.agent_config?.model).toBe('gpt-4')
    })
  })

  describe('WorkflowEdge', () => {
    it('should create valid WorkflowEdge object', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      }
      expect(edge.id).toBe('edge-1')
      expect(edge.source).toBe('node-1')
      expect(edge.target).toBe('node-2')
    })

    it('should allow optional fields in WorkflowEdge', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Success',
        condition: 'true',
        sourceHandle: 'output',
        targetHandle: 'input',
      }
      expect(edge.label).toBe('Success')
      expect(edge.condition).toBe('true')
      expect(edge.sourceHandle).toBe('output')
      expect(edge.targetHandle).toBe('input')
    })

    it('should allow snake_case handles in WorkflowEdge', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        source_handle: 'output',
        target_handle: 'input',
      }
      expect(edge.source_handle).toBe('output')
      expect(edge.target_handle).toBe('input')
    })
  })

  describe('WorkflowDefinition', () => {
    it('should create valid WorkflowDefinition object', () => {
      const workflow: WorkflowDefinition = {
        name: 'Test Workflow',
        nodes: [],
        edges: [],
        variables: {},
      }
      expect(workflow.name).toBe('Test Workflow')
      expect(workflow.nodes).toEqual([])
      expect(workflow.edges).toEqual([])
      expect(workflow.variables).toEqual({})
    })

    it('should allow optional fields in WorkflowDefinition', () => {
      const workflow: WorkflowDefinition = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        version: '1.0.0',
        nodes: [],
        edges: [],
        variables: { key: 'value' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }
      expect(workflow.id).toBe('workflow-1')
      expect(workflow.description).toBe('A test workflow')
      expect(workflow.version).toBe('1.0.0')
      expect(workflow.variables).toEqual({ key: 'value' })
    })
  })

  describe('NodeState', () => {
    it('should create valid NodeState object', () => {
      const state: NodeState = {
        node_id: 'node-1',
        status: 'running',
      }
      expect(state.node_id).toBe('node-1')
      expect(state.status).toBe('running')
    })

    it('should allow optional fields in NodeState', () => {
      const state: NodeState = {
        node_id: 'node-1',
        status: 'completed',
        input: { key: 'value' },
        output: { result: 'success' },
        error: undefined,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:01:00Z',
      }
      expect(state.input).toEqual({ key: 'value' })
      expect(state.output).toEqual({ result: 'success' })
      expect(state.started_at).toBe('2024-01-01T00:00:00Z')
      expect(state.completed_at).toBe('2024-01-01T00:01:00Z')
    })
  })

  describe('ExecutionLogEntry', () => {
    it('should create valid ExecutionLogEntry object', () => {
      const log: ExecutionLogEntry = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'Test log message',
      }
      expect(log.timestamp).toBe('2024-01-01T00:00:00Z')
      expect(log.level).toBe('info')
      expect(log.message).toBe('Test log message')
    })

    it('should allow optional node_id in ExecutionLogEntry', () => {
      const log: ExecutionLogEntry = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'error',
        node_id: 'node-1',
        message: 'Error occurred',
      }
      expect(log.node_id).toBe('node-1')
    })
  })

  describe('ExecutionState', () => {
    it('should create valid ExecutionState object', () => {
      const state: ExecutionState = {
        execution_id: 'exec-1',
        workflow_id: 'workflow-1',
        status: 'running',
        node_states: {},
        variables: {},
        started_at: '2024-01-01T00:00:00Z',
        logs: [],
      }
      expect(state.execution_id).toBe('exec-1')
      expect(state.workflow_id).toBe('workflow-1')
      expect(state.status).toBe('running')
      expect(state.node_states).toEqual({})
      expect(state.variables).toEqual({})
      expect(state.logs).toEqual([])
    })

    it('should allow optional fields in ExecutionState', () => {
      const state: ExecutionState = {
        execution_id: 'exec-1',
        workflow_id: 'workflow-1',
        status: 'completed',
        current_node: 'node-1',
        node_states: {
          'node-1': {
            node_id: 'node-1',
            status: 'completed',
          },
        },
        variables: { key: 'value' },
        result: { success: true },
        error: undefined,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:01:00Z',
        logs: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            level: 'info',
            message: 'Started',
          },
        ],
      }
      expect(state.current_node).toBe('node-1')
      expect(state.result).toEqual({ success: true })
      expect(state.completed_at).toBe('2024-01-01T00:01:00Z')
      expect(state.logs).toHaveLength(1)
    })
  })

  describe('type compatibility', () => {
    it('should allow WorkflowNode with different node types', () => {
      const agentNode: WorkflowNode = {
        id: 'node-1',
        type: 'agent',
        name: 'Agent Node',
        agent_config: { model: 'gpt-4', temperature: 0.7 },
        inputs: [],
        position: { x: 0, y: 0 },
      }

      const conditionNode: WorkflowNode = {
        id: 'node-2',
        type: 'condition',
        name: 'Condition Node',
        condition_config: {
          condition_type: 'equals',
          field: 'status',
          value: 'active',
        },
        inputs: [],
        position: { x: 100, y: 0 },
      }

      expect(agentNode.type).toBe('agent')
      expect(conditionNode.type).toBe('condition')
    })

    it('should allow WorkflowEdge with different conditions', () => {
      const trueEdge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        condition: 'true',
      }

      const falseEdge: WorkflowEdge = {
        id: 'edge-2',
        source: 'node-1',
        target: 'node-3',
        condition: 'false',
      }

      expect(trueEdge.condition).toBe('true')
      expect(falseEdge.condition).toBe('false')
    })
  })

  describe('runtime type validation functions', () => {
    describe('isValidNodeType', () => {
      it('should validate valid node types', () => {
        expect(isValidNodeType('agent')).toBe(true)
        expect(isValidNodeType('condition')).toBe(true)
        expect(isValidNodeType('loop')).toBe(true)
        expect(isValidNodeType('start')).toBe(true)
        expect(isValidNodeType('end')).toBe(true)
      })

      it('should reject invalid node types', () => {
        expect(isValidNodeType('invalid')).toBe(false)
        expect(isValidNodeType('')).toBe(false)
        expect(isValidNodeType('node')).toBe(false)
      })
    })

    describe('isValidExecutionStatus', () => {
      it('should validate valid execution statuses', () => {
        expect(isValidExecutionStatus('pending')).toBe(true)
        expect(isValidExecutionStatus('running')).toBe(true)
        expect(isValidExecutionStatus('completed')).toBe(true)
        expect(isValidExecutionStatus('failed')).toBe(true)
        expect(isValidExecutionStatus('paused')).toBe(true)
      })

      it('should reject invalid execution statuses', () => {
        expect(isValidExecutionStatus('invalid')).toBe(false)
        expect(isValidExecutionStatus('')).toBe(false)
        expect(isValidExecutionStatus('done')).toBe(false)
      })
    })

    describe('isValidConditionType', () => {
      it('should validate valid condition types', () => {
        expect(isValidConditionType('equals')).toBe(true)
        expect(isValidConditionType('contains')).toBe(true)
        expect(isValidConditionType('greater_than')).toBe(true)
        expect(isValidConditionType('less_than')).toBe(true)
        expect(isValidConditionType('custom')).toBe(true)
      })

      it('should reject invalid condition types', () => {
        expect(isValidConditionType('invalid')).toBe(false)
        expect(isValidConditionType('')).toBe(false)
      })
    })

    describe('isValidLoopType', () => {
      it('should validate valid loop types', () => {
        expect(isValidLoopType('for_each')).toBe(true)
        expect(isValidLoopType('while')).toBe(true)
        expect(isValidLoopType('until')).toBe(true)
      })

      it('should reject invalid loop types', () => {
        expect(isValidLoopType('invalid')).toBe(false)
        expect(isValidLoopType('for')).toBe(false)
      })
    })

    describe('isValidEdgeCondition', () => {
      it('should validate valid edge conditions', () => {
        expect(isValidEdgeCondition('true')).toBe(true)
        expect(isValidEdgeCondition('false')).toBe(true)
        expect(isValidEdgeCondition('default')).toBe(true)
      })

      it('should reject invalid edge conditions', () => {
        expect(isValidEdgeCondition('invalid')).toBe(false)
        expect(isValidEdgeCondition('')).toBe(false)
      })
    })

    it('should execute all validation functions from module', () => {
      // Ensure all runtime functions are accessible from the module
      expect(workflowModule.isValidNodeType).toBeDefined()
      expect(workflowModule.isValidExecutionStatus).toBeDefined()
      expect(workflowModule.isValidConditionType).toBeDefined()
      expect(workflowModule.isValidLoopType).toBeDefined()
      expect(workflowModule.isValidEdgeCondition).toBeDefined()
    })

    it('should execute module via require', () => {
      // Force execution of the module to ensure coverage
      const requiredModule = require('./workflow')
      expect(requiredModule.isValidNodeType).toBeDefined()
      expect(requiredModule.isValidExecutionStatus).toBeDefined()
      expect(requiredModule.isValidConditionType).toBeDefined()
      expect(requiredModule.isValidLoopType).toBeDefined()
      expect(requiredModule.isValidEdgeCondition).toBeDefined()
    })
  })
})
