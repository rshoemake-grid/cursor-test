/**
 * Tests for remaining branches in useNodeOperations.ts
 * 
 * These tests target branches that are not covered by existing tests,
 * focusing on conditional paths and logical operators.
 */

import { renderHook, act } from '@testing-library/react'
import { useNodeOperations } from './useNodeOperations'
import { showError } from '../../utils/notifications'
import { showConfirm } from '../../utils/confirm'
import { logger } from '../../utils/logger'
import { useReactFlow } from '@xyflow/react'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
}))

jest.mock('../../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
const mockUseReactFlow = useReactFlow as jest.MockedFunction<typeof useReactFlow>

describe('useNodeOperations - Remaining Branches', () => {
  let mockSetNodes: jest.Mock
  let mockDeleteElements: jest.Mock
  let mockSetSelectedNodeId: jest.Mock
  let mockOnSave: jest.Mock
  let mockOnSaveWorkflow: jest.Mock
  let mockSetSaveStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockSetNodes = jest.fn()
    mockDeleteElements = jest.fn()
    mockSetSelectedNodeId = jest.fn()
    mockOnSave = jest.fn()
    mockOnSaveWorkflow = jest.fn().mockResolvedValue('saved-workflow-id')
    mockSetSaveStatus = jest.fn()

    mockUseReactFlow.mockReturnValue({
      setNodes: mockSetNodes,
      deleteElements: mockDeleteElements,
    } as any)
    
    mockShowConfirm.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const renderHookWithProvider = (selectedNode: any) => {
    return renderHook(() =>
      useNodeOperations({
        selectedNode,
        setSelectedNodeId: mockSetSelectedNodeId,
        onSave: mockOnSave,
        onSaveWorkflow: mockOnSaveWorkflow,
      })
    )
  }

  describe('handleConfigUpdate - ternary operator branches', () => {
    it('should handle node.id !== selectedNode.id branch in map', () => {
      const selectedNode = {
        id: 'node-1',
        data: { name: 'Node 1', config: { key: 'value' } },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleConfigUpdate('config', 'key', 'new-value')
      })

      // Should call setNodes with map function
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      
      // Test with node that doesn't match
      const otherNode = { id: 'node-2', data: { name: 'Node 2' } }
      const resultNode = mapCallback([otherNode, selectedNode])
      
      // Should return node unchanged when id doesn't match (line 67 false branch)
      expect(resultNode[0]).toBe(otherNode)
      expect(resultNode[0].id).toBe('node-2')
    })
  })

  describe('handleSave - error instanceof Error branches', () => {
    it('should handle error that is not an Error instance', async () => {
      const selectedNode = {
        id: 'node-1',
        data: { name: 'Node 1' },
      }

      mockOnSaveWorkflow.mockRejectedValue('String error')

      const { result } = renderHookWithProvider(selectedNode)

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
      })

      // Should handle non-Error error (line 109 false branch)
      expect(showError).toHaveBeenCalledWith('Failed to save workflow: Unknown error')
      expect(mockSetSaveStatus).toHaveBeenCalledWith('idle')
    })

    it('should handle error that is an Error instance', async () => {
      const selectedNode = {
        id: 'node-1',
        data: { name: 'Node 1' },
      }

      mockOnSaveWorkflow.mockRejectedValue(new Error('Save failed'))

      const { result } = renderHookWithProvider(selectedNode)

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
      })

      // Should handle Error instance (line 109 true branch)
      expect(showError).toHaveBeenCalledWith('Failed to save workflow: Save failed')
      expect(mockSetSaveStatus).toHaveBeenCalledWith('idle')
    })
  })

  describe('handleAddInput - logical OR branches', () => {
    it('should handle when selectedNode.data.inputs exists (truthy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: [{ name: 'existing-input', source_node: 'node-2' }],
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleAddInput('new-input', 'node-3', 'field', jest.fn())
      })

      // Should use existing inputs array (line 116 truthy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toHaveLength(2)
      expect(updatedNode.data.inputs[1].name).toBe('new-input')
    })

    it('should handle when selectedNode.data.inputs is null (falsy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: null,
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleAddInput('new-input', 'node-3', 'field', jest.fn())
      })

      // Should use empty array fallback (line 116 falsy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toHaveLength(1)
      expect(updatedNode.data.inputs[0].name).toBe('new-input')
    })

    it('should handle when selectedNode.data.inputs is undefined (falsy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleAddInput('new-input', 'node-3', 'field', jest.fn())
      })

      // Should use empty array fallback (line 116 falsy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toHaveLength(1)
      expect(updatedNode.data.inputs[0].name).toBe('new-input')
    })

    it('should handle when sourceField is truthy', () => {
      const selectedNode = {
        id: 'node-1',
        data: { name: 'Node 1', inputs: [] },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleAddInput('new-input', 'node-3', 'custom-field', jest.fn())
      })

      // Should use sourceField value (line 120 truthy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs[0].source_field).toBe('custom-field')
    })

    it('should handle when sourceField is falsy', () => {
      const selectedNode = {
        id: 'node-1',
        data: { name: 'Node 1', inputs: [] },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleAddInput('new-input', 'node-3', '', jest.fn())
      })

      // Should use default 'output' (line 120 falsy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs[0].source_field).toBe('output')
    })
  })

  describe('handleRemoveInput - logical OR branches', () => {
    it('should handle when selectedNode.data.inputs exists (truthy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: [
            { name: 'input-1', source_node: 'node-2' },
            { name: 'input-2', source_node: 'node-3' },
          ],
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleRemoveInput(0)
      })

      // Should use existing inputs array (line 130 truthy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toHaveLength(1)
      expect(updatedNode.data.inputs[0].name).toBe('input-2')
    })

    it('should handle when selectedNode.data.inputs is null (falsy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: null,
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleRemoveInput(0)
      })

      // Should use empty array fallback (line 130 falsy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toHaveLength(0)
    })
  })

  describe('handleUpdateInput - logical OR branches', () => {
    it('should handle when selectedNode.data.inputs exists (truthy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: [
            { name: 'input-1', source_node: 'node-2', source_field: 'field1' },
          ],
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleUpdateInput(0, 'source_field', 'updated-field')
      })

      // Should use existing inputs array (line 138 truthy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs[0].source_field).toBe('updated-field')
    })

    it('should handle when selectedNode.data.inputs is null (falsy branch)', () => {
      const selectedNode = {
        id: 'node-1',
        data: {
          name: 'Node 1',
          inputs: null,
        },
      }

      const { result } = renderHookWithProvider(selectedNode)

      act(() => {
        result.current.handleUpdateInput(0, 'source_field', 'updated-field')
      })

      // Should use empty array fallback (line 138 falsy branch)
      expect(mockSetNodes).toHaveBeenCalled()
      const mapCallback = mockSetNodes.mock.calls[0][0]
      const updatedNode = mapCallback([selectedNode])[0]
      expect(updatedNode.data.inputs).toEqual([{ source_field: 'updated-field' }])
    })
  })
})
