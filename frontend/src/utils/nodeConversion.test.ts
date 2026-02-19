/**
 * Tests for node conversion utilities
 */

import { convertNodesForExecutionInput } from './nodeConversion'
import type { Node } from '@xyflow/react'

describe('nodeConversion', () => {
  describe('convertNodesForExecutionInput', () => {
    it('should convert React Flow nodes to WorkflowNode format', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 100, y: 200 },
          data: {
            name: 'Test Agent',
            description: 'Test description',
            agent_config: { model: 'gpt-4', temperature: 0.7 },
          },
        },
        {
          id: 'node2',
          type: 'start',
          position: { x: 50, y: 50 },
          data: {
            label: 'Start Node',
            input_config: {
              inputs: [{ name: 'input1', type: 'string' }],
            },
          },
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'node1',
        type: 'agent',
        name: 'Test Agent',
        description: 'Test description',
        agent_config: { model: 'gpt-4', temperature: 0.7 },
        condition_config: undefined,
        loop_config: undefined,
        input_config: undefined,
        inputs: [],
        position: { x: 100, y: 200 },
      })
      expect(result[1]).toEqual({
        id: 'node2',
        type: 'start',
        name: 'Start Node',
        description: undefined,
        agent_config: undefined,
        condition_config: undefined,
        loop_config: undefined,
        input_config: {
          inputs: [{ name: 'input1', type: 'string' }],
        },
        inputs: [],
        position: { x: 50, y: 50 },
      })
    })

    it('should use label as name if name is not provided', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            label: 'Label Only',
          },
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result[0].name).toBe('Label Only')
    })

    it('should use empty string if neither name nor label is provided', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {},
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result[0].name).toBe('')
    })

    it('should handle non-string labels gracefully', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            label: { type: 'span', children: 'React Node' },
          },
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result[0].name).toBe('')
    })

    it('should preserve all config types', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'condition',
          position: { x: 0, y: 0 },
          data: {
            name: 'Condition Node',
            condition_config: { condition_type: 'equals', field: 'status', value: 'active' },
            loop_config: { loop_type: 'for_each' },
            input_config: { inputs: [] },
            inputs: [{ name: 'input1', source_field: 'field1' }],
          },
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result[0].condition_config).toEqual({
        condition_type: 'equals',
        field: 'status',
        value: 'active',
      })
      expect(result[0].loop_config).toEqual({ loop_type: 'for_each' })
      expect(result[0].input_config).toEqual({ inputs: [] })
      expect(result[0].inputs).toEqual([{ name: 'input1', source_field: 'field1' }])
    })

    it('should handle empty nodes array', () => {
      const result = convertNodesForExecutionInput([])

      expect(result).toEqual([])
    })

    it('should handle nodes with minimal data', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'end',
          position: { x: 0, y: 0 },
          data: {},
        },
      ]

      const result = convertNodesForExecutionInput(nodes)

      expect(result[0]).toEqual({
        id: 'node1',
        type: 'end',
        name: '',
        description: undefined,
        agent_config: undefined,
        condition_config: undefined,
        loop_config: undefined,
        input_config: undefined,
        inputs: [],
        position: { x: 0, y: 0 },
      })
    })

    describe('mutation killers - exact null/undefined/empty checks for name', () => {
      it('should verify exact null check - name is null', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: null }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact undefined check - name is undefined', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: undefined }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact empty string check - name is empty string', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: '' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact non-empty string check - name is non-empty', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Test Name' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Test Name')
      })

      it('should verify exact boolean equality - hasName is true', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Valid Name' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Valid Name')
      })

      it('should verify exact boolean equality - hasName is false (null)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: null }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact boolean equality - hasName is false (undefined)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: undefined }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact boolean equality - hasName is false (empty string)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: '' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })
    })

    describe('mutation killers - exact typeof checks for label', () => {
      it('should verify exact typeof check - label is string', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'String Label' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('String Label')
      })

      it('should verify exact typeof check - label is not string (number)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 123 as any }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact typeof check - label is not string (object)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: { type: 'span' } as any }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact typeof check - label is not string (null)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: null }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact typeof check - label is not string (undefined)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: undefined }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact boolean equality - hasLabel is true', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Valid Label' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Valid Label')
      })

      it('should verify exact boolean equality - hasLabel is false (null)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: null }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify exact boolean equality - hasLabel is false (empty string)', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: '' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })
    })

    describe('mutation killers - compound condition testing', () => {
      it('should verify exact AND chain - name checks all conditions', () => {
        // Test: name !== null && name !== undefined && name !== ''
        const nodes1: Node[] = [{ id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { name: null } }]
        const nodes2: Node[] = [{ id: 'node2', type: 'agent', position: { x: 0, y: 0 }, data: { name: undefined } }]
        const nodes3: Node[] = [{ id: 'node3', type: 'agent', position: { x: 0, y: 0 }, data: { name: '' } }]
        const nodes4: Node[] = [{ id: 'node4', type: 'agent', position: { x: 0, y: 0 }, data: { name: 'Valid' } }]
        
        expect(convertNodesForExecutionInput(nodes1)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes2)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes3)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes4)[0].name).toBe('Valid')
      })

      it('should verify exact AND chain - label checks all conditions', () => {
        // Test: typeof label === 'string' && label !== null && label !== undefined && label !== ''
        const nodes1: Node[] = [{ id: 'node1', type: 'agent', position: { x: 0, y: 0 }, data: { label: null } }]
        const nodes2: Node[] = [{ id: 'node2', type: 'agent', position: { x: 0, y: 0 }, data: { label: undefined } }]
        const nodes3: Node[] = [{ id: 'node3', type: 'agent', position: { x: 0, y: 0 }, data: { label: '' } }]
        const nodes4: Node[] = [{ id: 'node4', type: 'agent', position: { x: 0, y: 0 }, data: { label: 123 as any } }]
        const nodes5: Node[] = [{ id: 'node5', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Valid' } }]
        
        expect(convertNodesForExecutionInput(nodes1)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes2)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes3)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes4)[0].name).toBe('')
        expect(convertNodesForExecutionInput(nodes5)[0].name).toBe('Valid')
      })
    })

    describe('mutation killers - name/label priority', () => {
      it('should verify name takes priority over label when both exist', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Name Value', label: 'Label Value' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Name Value')
      })

      it('should verify label used when name is null', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: null, label: 'Label Value' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Label Value')
      })

      it('should verify label used when name is undefined', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: undefined, label: 'Label Value' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Label Value')
      })

      it('should verify label used when name is empty string', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: '', label: 'Label Value' }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('Label Value')
      })

      it('should verify empty string fallback when both name and label are falsy', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: null, label: null }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })

      it('should verify empty string fallback when name is falsy and label is not string', () => {
        const nodes: Node[] = [{
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: null, label: 123 as any }
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].name).toBe('')
      })
    })
  })

  describe('coverage - edge cases and uncovered branches', () => {
    it('should handle empty nodes array', () => {
      const nodes: Node[] = []
      const result = convertNodesForExecutionInput(nodes)
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle node with inputs as null', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          inputs: null as any,
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].inputs).toEqual([])
    })

    it('should handle node with inputs as undefined', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          inputs: undefined as any,
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].inputs).toEqual([])
    })

    it('should handle node with valid inputs array', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          inputs: [
            { name: 'input1', source_field: 'field1' },
            { name: 'input2', source_field: 'field2' },
          ],
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].inputs).toEqual([
        { name: 'input1', source_field: 'field1' },
        { name: 'input2', source_field: 'field2' },
      ])
    })

    it('should handle node with all config types defined', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          description: 'Description',
          agent_config: { model: 'gpt-4', temperature: 0.7 },
          condition_config: { condition_type: 'equals', field: 'test', value: 'value' },
          loop_config: { loop_type: 'for_each', items_source: 'items' },
          input_config: { mode: 'read' },
          inputs: [],
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0]).toMatchObject({
        id: 'node1',
        type: 'agent',
        name: 'Test',
        description: 'Description',
        agent_config: { model: 'gpt-4', temperature: 0.7 },
        condition_config: { condition_type: 'equals', field: 'test', value: 'value' },
        loop_config: { loop_type: 'for_each', items_source: 'items' },
        input_config: { mode: 'read' },
        inputs: [],
      })
    })

    it('should handle node with name and label both provided (name takes priority)', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Name Value',
          label: 'Label Value',
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].name).toBe('Name Value')
    })

    it('should handle node with only name (no label)', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Name Only',
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].name).toBe('Name Only')
    })

    it('should handle node with only label (no name)', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          label: 'Label Only',
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].name).toBe('Label Only')
    })

    it('should handle node with description as undefined', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          description: undefined,
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].description).toBeUndefined()
    })

    it('should handle node with description as string', () => {
      const nodes: Node[] = [{
        id: 'node1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test',
          description: 'Test Description',
        },
      }]
      const result = convertNodesForExecutionInput(nodes)
      expect(result[0].description).toBe('Test Description')
    })

    it('should handle all node types', () => {
      const nodeTypes: Array<'agent' | 'condition' | 'loop' | 'start' | 'end'> = [
        'agent',
        'condition',
        'loop',
        'start',
        'end',
      ]
      
      nodeTypes.forEach((nodeType) => {
        const nodes: Node[] = [{
          id: `node-${nodeType}`,
          type: nodeType,
          position: { x: 0, y: 0 },
          data: { name: `Test ${nodeType}` },
        }]
        const result = convertNodesForExecutionInput(nodes)
        expect(result[0].type).toBe(nodeType)
        expect(result[0].name).toBe(`Test ${nodeType}`)
      })
    })

    it('should handle multiple nodes with various configurations', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Node 1', inputs: [{ name: 'input1', source_field: 'field1' }] },
        },
        {
          id: 'node2',
          type: 'condition',
          position: { x: 100, y: 100 },
          data: { label: 'Node 2', inputs: null as any },
        },
        {
          id: 'node3',
          type: 'start',
          position: { x: 200, y: 200 },
          data: { name: 'Node 3', inputs: undefined as any },
        },
      ]
      const result = convertNodesForExecutionInput(nodes)
      expect(result).toHaveLength(3)
      expect(result[0].inputs).toEqual([{ name: 'input1', source_field: 'field1' }])
      expect(result[1].inputs).toEqual([])
      expect(result[2].inputs).toEqual([])
    })
  })
})
