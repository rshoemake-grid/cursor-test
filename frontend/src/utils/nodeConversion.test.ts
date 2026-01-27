/**
 * Tests for node conversion utilities
 */

import { convertNodesForExecutionInput } from './nodeConversion'
import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'

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
  })
})
