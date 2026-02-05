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
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>
const mockUseReactFlow = useReactFlow as jest.MockedFunction<typeof useReactFlow>

describe('useNodeOperations', () => {
  let mockSetNodes: jest.Mock
  let mockDeleteElements: jest.Mock
  let mockSetSelectedNodeId: jest.Mock

  const mockSelectedNode = {
    id: 'node-1',
    data: {
      name: 'Test Node',
      label: 'Test Node',
      inputs: [],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockSetNodes = jest.fn()
    mockDeleteElements = jest.fn()
    mockSetSelectedNodeId = jest.fn()
    
    mockUseReactFlow.mockReturnValue({
      setNodes: mockSetNodes,
      deleteElements: mockDeleteElements,
      getNodes: jest.fn(() => [mockSelectedNode]),
      getEdges: jest.fn(() => []),
      getNode: jest.fn(),
      getEdge: jest.fn(),
      addNodes: jest.fn(),
      addEdges: jest.fn(),
      updateNode: jest.fn(),
      updateEdge: jest.fn(),
      deleteElements: mockDeleteElements,
      toObject: jest.fn(),
      fromObject: jest.fn(),
      getViewport: jest.fn(),
      setViewport: jest.fn(),
      screenToFlowCoordinate: jest.fn(),
      flowToScreenCoordinate: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      zoomTo: jest.fn(),
      fitView: jest.fn(),
      project: jest.fn(),
      getIntersectingNodes: jest.fn(),
      isNodeIntersecting: jest.fn(),
    } as any)
    
    mockShowConfirm.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('handleUpdate', () => {
    it('should update node field', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdate('name', 'Updated Name')
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.name).toBe('Updated Name')
    })

    it('should update label when name changes', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdate('name', 'New Name')
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.label).toBe('New Name')
    })

    it('should not update label when other field changes', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdate('description', 'New Description')
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.label).toBe('Test Node')
      expect(updatedNode.data.description).toBe('New Description')
    })

    it('should return early if no node selected', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdate('name', 'Updated Name')
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })

    it('should not update other nodes', () => {
      const otherNode = {
        id: 'node-2',
        data: { name: 'Other Node' },
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdate('name', 'Updated Name')
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode, otherNode]) : setNodesCall
      const otherNodeUpdated = updatedNodes.find((n: any) => n.id === 'node-2')
      expect(otherNodeUpdated.data.name).toBe('Other Node')
    })
  })

  describe('handleConfigUpdate', () => {
    it('should update config field', () => {
      const nodeWithConfig = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          config: { key: 'value' },
        },
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: nodeWithConfig,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleConfigUpdate('config', 'key', 'newValue')
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([nodeWithConfig]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.config.key).toBe('newValue')
    })

    it('should create config object if it does not exist', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleConfigUpdate('config', 'key', 'value')
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.config).toEqual({ key: 'value' })
    })

    it('should return early if no node selected', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleConfigUpdate('config', 'key', 'value')
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })
  })

  describe('handleDelete', () => {
    it('should delete node after confirmation', async () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Test Node'),
        { title: 'Delete Node', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      )
      expect(mockDeleteElements).toHaveBeenCalledWith({ nodes: [{ id: 'node-1' }] })
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
    })

    it('should use label if name is not available', async () => {
      const nodeWithLabel = {
        ...mockSelectedNode,
        data: {
          label: 'Node Label',
        },
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: nodeWithLabel,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Node Label'),
        expect.any(Object)
      )
    })

    it('should use node id if name and label are not available', async () => {
      const nodeWithoutName = {
        ...mockSelectedNode,
        data: {},
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: nodeWithoutName,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('node-1'),
        expect.any(Object)
      )
    })

    it('should not delete if user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockDeleteElements).not.toHaveBeenCalled()
      expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
    })

    it('should return early if no node selected', async () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })
  })

  describe('handleSave', () => {
    it('should save workflow and call callbacks', async () => {
      const mockOnSaveWorkflow = jest.fn().mockResolvedValue('workflow-id')
      const mockOnSave = jest.fn().mockResolvedValue(undefined)
      const mockSetSaveStatus = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
          onSaveWorkflow: mockOnSaveWorkflow,
          onSave: mockOnSave,
        })
      )

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
      })

      expect(mockSetSaveStatus).toHaveBeenCalledWith('saving')
      expect(mockOnSaveWorkflow).toHaveBeenCalled()
      expect(mockOnSave).toHaveBeenCalled()
      expect(mockSetSaveStatus).toHaveBeenCalledWith('saved')
    })

    it('should handle save error', async () => {
      const mockOnSaveWorkflow = jest.fn().mockRejectedValue(new Error('Save failed'))
      const mockSetSaveStatus = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
          onSaveWorkflow: mockOnSaveWorkflow,
        })
      )

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to save workflow'))
      expect(mockSetSaveStatus).toHaveBeenCalledWith('idle')
    })

    it('should return early if no node selected', async () => {
      const mockSetSaveStatus = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
      })

      expect(mockSetSaveStatus).not.toHaveBeenCalled()
    })

    it('should reset save status after delay', async () => {
      const mockSetSaveStatus = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      await act(async () => {
        await result.current.handleSave(mockSetSaveStatus)
        jest.advanceTimersByTime(2000)
      })

      expect(mockSetSaveStatus).toHaveBeenCalledWith('idle')
    })
  })

  describe('handleAddInput', () => {
    it('should add input to node', () => {
      const mockSetShowAddInput = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleAddInput('input1', 'source-node', 'output', mockSetShowAddInput)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.inputs).toHaveLength(1)
      expect(updatedNode.data.inputs[0]).toEqual({
        name: 'input1',
        source_node: 'source-node',
        source_field: 'output',
      })
      expect(mockSetShowAddInput).toHaveBeenCalledWith(false)
    })

    it('should handle empty sourceNode', () => {
      const mockSetShowAddInput = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: mockSelectedNode,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleAddInput('input1', '', 'output', mockSetShowAddInput)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockSelectedNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.inputs[0].source_node).toBeUndefined()
    })

    it('should return early if no node selected', () => {
      const mockSetShowAddInput = jest.fn()

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleAddInput('input1', 'source-node', 'output', mockSetShowAddInput)
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })
  })

  describe('handleRemoveInput', () => {
    it('should remove input at index', () => {
      const nodeWithInputs = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          inputs: [
            { name: 'input1' },
            { name: 'input2' },
            { name: 'input3' },
          ],
        },
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: nodeWithInputs,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleRemoveInput(1)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([nodeWithInputs]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.inputs).toHaveLength(2)
      expect(updatedNode.data.inputs.find((i: any) => i.name === 'input2')).toBeUndefined()
    })

    it('should return early if no node selected', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleRemoveInput(0)
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })
  })

  describe('handleUpdateInput', () => {
    it('should update input field', () => {
      const nodeWithInputs = {
        ...mockSelectedNode,
        data: {
          ...mockSelectedNode.data,
          inputs: [
            { name: 'input1', source_node: 'node1' },
          ],
        },
      }

      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: nodeWithInputs,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdateInput(0, 'source_node', 'node2')
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([nodeWithInputs]) : setNodesCall
      const updatedNode = updatedNodes.find((n: any) => n.id === 'node-1')
      expect(updatedNode.data.inputs[0].source_node).toBe('node2')
    })

    it('should return early if no node selected', () => {
      const { result } = renderHook(() =>
        useNodeOperations({
          selectedNode: null,
          setSelectedNodeId: mockSetSelectedNodeId,
        })
      )

      act(() => {
        result.current.handleUpdateInput(0, 'name', 'newName')
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })
  })
})
