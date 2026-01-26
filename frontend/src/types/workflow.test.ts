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

describe('Workflow Types', () => {
  describe('Type definitions', () => {
    it('should have valid NodeType values', () => {
      const validTypes: NodeType[] = ['agent', 'condition', 'loop', 'start', 'end']
      
      validTypes.forEach(type => {
        expect(['agent', 'condition', 'loop', 'start', 'end']).toContain(type)
      })
    })

    it('should have valid ExecutionStatus values', () => {
      const validStatuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
      
      validStatuses.forEach(status => {
        expect(['pending', 'running', 'completed', 'failed', 'paused']).toContain(status)
      })
    })
  })

  describe('AgentConfig', () => {
    it('should create valid AgentConfig', () => {
      const config: AgentConfig = {
        model: 'gpt-4',
        system_prompt: 'You are a helpful assistant',
        temperature: 0.7,
        max_tokens: 1000,
        tools: ['tool1', 'tool2'],
      }

      expect(config.model).toBe('gpt-4')
      expect(config.system_prompt).toBe('You are a helpful assistant')
      expect(config.temperature).toBe(0.7)
      expect(config.max_tokens).toBe(1000)
      expect(config.tools).toEqual(['tool1', 'tool2'])
    })

    it('should create AgentConfig with optional fields', () => {
      const config: AgentConfig = {
        model: 'gpt-4',
        temperature: 0.7,
      }

      expect(config.model).toBe('gpt-4')
      expect(config.temperature).toBe(0.7)
      expect(config.system_prompt).toBeUndefined()
      expect(config.max_tokens).toBeUndefined()
      expect(config.tools).toBeUndefined()
    })
  })

  describe('InputMapping', () => {
    it('should create valid InputMapping', () => {
      const mapping: InputMapping = {
        name: 'input1',
        source_node: 'node-1',
        source_field: 'output',
      }

      expect(mapping.name).toBe('input1')
      expect(mapping.source_node).toBe('node-1')
      expect(mapping.source_field).toBe('output')
    })

    it('should create InputMapping without source_node', () => {
      const mapping: InputMapping = {
        name: 'input1',
        source_field: 'output',
      }

      expect(mapping.name).toBe('input1')
      expect(mapping.source_node).toBeUndefined()
      expect(mapping.source_field).toBe('output')
    })
  })

  describe('ConditionConfig', () => {
    it('should create valid ConditionConfig', () => {
      const config: ConditionConfig = {
        condition_type: 'equals',
        field: 'status',
        value: 'active',
        true_branch: 'branch1',
        false_branch: 'branch2',
      }

      expect(config.condition_type).toBe('equals')
      expect(config.field).toBe('status')
      expect(config.value).toBe('active')
      expect(config.true_branch).toBe('branch1')
      expect(config.false_branch).toBe('branch2')
    })

    it('should support all condition types', () => {
      const types: ConditionConfig['condition_type'][] = ['equals', 'contains', 'greater_than', 'less_than', 'custom']
      
      types.forEach(type => {
        const config: ConditionConfig = {
          condition_type: type,
          field: 'test',
          value: 'value',
        }
        expect(config.condition_type).toBe(type)
      })
    })
  })

  describe('LoopConfig', () => {
    it('should create valid LoopConfig', () => {
      const config: LoopConfig = {
        loop_type: 'for_each',
        items_source: 'items',
        condition: 'item.active',
        max_iterations: 100,
      }

      expect(config.loop_type).toBe('for_each')
      expect(config.items_source).toBe('items')
      expect(config.condition).toBe('item.active')
      expect(config.max_iterations).toBe(100)
    })

    it('should support all loop types', () => {
      const types: LoopConfig['loop_type'][] = ['for_each', 'while', 'until']
      
      types.forEach(type => {
        const config: LoopConfig = {
          loop_type: type,
        }
        expect(config.loop_type).toBe(type)
      })
    })
  })

  describe('WorkflowNode', () => {
    it('should create valid WorkflowNode', () => {
      const node: WorkflowNode = {
        id: 'node-1',
        type: 'agent',
        name: 'Agent Node',
        description: 'Description',
        agent_config: {
          model: 'gpt-4',
          temperature: 0.7,
        },
        inputs: [],
        position: { x: 0, y: 0 },
      }

      expect(node.id).toBe('node-1')
      expect(node.type).toBe('agent')
      expect(node.name).toBe('Agent Node')
      expect(node.description).toBe('Description')
      expect(node.agent_config).toBeDefined()
      expect(node.inputs).toEqual([])
      expect(node.position).toEqual({ x: 0, y: 0 })
    })
  })

  describe('WorkflowEdge', () => {
    it('should create valid WorkflowEdge', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Edge Label',
        condition: 'true',
        sourceHandle: 'output',
        targetHandle: 'input',
      }

      expect(edge.id).toBe('edge-1')
      expect(edge.source).toBe('node-1')
      expect(edge.target).toBe('node-2')
      expect(edge.label).toBe('Edge Label')
      expect(edge.condition).toBe('true')
      expect(edge.sourceHandle).toBe('output')
      expect(edge.targetHandle).toBe('input')
    })

    it('should support snake_case handles for backend compatibility', () => {
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
    it('should create valid WorkflowDefinition', () => {
      const workflow: WorkflowDefinition = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Description',
        version: '1.0.0',
        nodes: [],
        edges: [],
        variables: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(workflow.id).toBe('workflow-1')
      expect(workflow.name).toBe('Test Workflow')
      expect(workflow.description).toBe('Description')
      expect(workflow.version).toBe('1.0.0')
      expect(workflow.nodes).toEqual([])
      expect(workflow.edges).toEqual([])
      expect(workflow.variables).toEqual({})
    })

    it('should create WorkflowDefinition without optional fields', () => {
      const workflow: WorkflowDefinition = {
        name: 'Test Workflow',
        nodes: [],
        edges: [],
        variables: {},
      }

      expect(workflow.id).toBeUndefined()
      expect(workflow.description).toBeUndefined()
      expect(workflow.version).toBeUndefined()
    })
  })

  describe('NodeState', () => {
    it('should create valid NodeState', () => {
      const state: NodeState = {
        node_id: 'node-1',
        status: 'running',
        input: { key: 'value' },
        output: { result: 'success' },
        error: undefined,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:01:00Z',
      }

      expect(state.node_id).toBe('node-1')
      expect(state.status).toBe('running')
      expect(state.input).toEqual({ key: 'value' })
      expect(state.output).toEqual({ result: 'success' })
    })
  })

  describe('ExecutionLogEntry', () => {
    it('should create valid ExecutionLogEntry', () => {
      const log: ExecutionLogEntry = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        node_id: 'node-1',
        message: 'Log message',
      }

      expect(log.timestamp).toBe('2024-01-01T00:00:00Z')
      expect(log.level).toBe('INFO')
      expect(log.node_id).toBe('node-1')
      expect(log.message).toBe('Log message')
    })
  })

  describe('ExecutionState', () => {
    it('should create valid ExecutionState', () => {
      const state: ExecutionState = {
        execution_id: 'exec-1',
        workflow_id: 'workflow-1',
        status: 'running',
        current_node: 'node-1',
        node_states: {
          'node-1': {
            node_id: 'node-1',
            status: 'running',
          },
        },
        variables: { var1: 'value1' },
        result: undefined,
        error: undefined,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: undefined,
        logs: [],
      }

      expect(state.execution_id).toBe('exec-1')
      expect(state.workflow_id).toBe('workflow-1')
      expect(state.status).toBe('running')
      expect(state.current_node).toBe('node-1')
      expect(state.node_states).toBeDefined()
      expect(state.variables).toEqual({ var1: 'value1' })
      expect(state.logs).toEqual([])
    })
  })
})
