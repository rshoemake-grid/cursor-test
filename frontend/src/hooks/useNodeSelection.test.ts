/**
 * Tests for useNodeSelection hook
 */

import { renderHook, act } from '@testing-library/react'
import { useNodeSelection } from './useNodeSelection'
import type { Node } from '@xyflow/react'

describe('useNodeSelection', () => {
  let mockNotifyModified: jest.Mock
  let mockReactFlowInstance: any
  let mockReactFlowInstanceRef: React.MutableRefObject<any>

  beforeEach(() => {
    jest.clearAllMocks()
    mockNotifyModified = jest.fn()

    mockReactFlowInstance = {
      getNodes: jest.fn(() => []),
    }

    mockReactFlowInstanceRef = {
      current: mockReactFlowInstance,
    } as React.MutableRefObject<any>
  })

  it('should initialize with no selection', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    expect(result.current.selectedNodeId).toBeNull()
    expect(result.current.selectedNodeIds.size).toBe(0)
  })

  it('should update selection when single node is selected', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const selectedNode: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
      selected: true,
    }

    mockReactFlowInstance.getNodes.mockReturnValue([selectedNode])

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'select', id: 'node1' }],
        jest.fn()
      )
    })

    expect(result.current.selectedNodeId).toBe('node1')
    expect(result.current.selectedNodeIds.has('node1')).toBe(true)
  })

  it('should clear selection when no nodes are selected', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    // First select a node
    const selectedNode: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
      selected: true,
    }

    mockReactFlowInstance.getNodes.mockReturnValue([selectedNode])

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'select', id: 'node1' }],
        jest.fn()
      )
    })

    expect(result.current.selectedNodeId).toBe('node1')

    // Then deselect
    const unselectedNode: Node = {
      ...selectedNode,
      selected: false,
    }

    mockReactFlowInstance.getNodes.mockReturnValue([unselectedNode])

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'select', id: 'node1' }],
        jest.fn()
      )
    })

    expect(result.current.selectedNodeId).toBeNull()
    expect(result.current.selectedNodeIds.size).toBe(0)
  })

  it('should clear selectedNodeId when multiple nodes are selected', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const node1: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
      selected: true,
    }

    const node2: Node = {
      id: 'node2',
      type: 'agent',
      position: { x: 100, y: 100 },
      data: {},
      selected: true,
    }

    mockReactFlowInstance.getNodes.mockReturnValue([node1, node2])

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'select', id: 'node1' }, { type: 'select', id: 'node2' }],
        jest.fn()
      )
    })

    expect(result.current.selectedNodeId).toBeNull()
    expect(result.current.selectedNodeIds.has('node1')).toBe(true)
    expect(result.current.selectedNodeIds.has('node2')).toBe(true)
  })

  it('should notify on position changes', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const mockOnNodesChangeBase = jest.fn()

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'position', id: 'node1', position: { x: 10, y: 20 } }],
        mockOnNodesChangeBase
      )
    })

    expect(mockOnNodesChangeBase).toHaveBeenCalledWith([
      { type: 'position', id: 'node1', position: { x: 10, y: 20 } },
    ])
    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should notify on add changes', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const mockOnNodesChangeBase = jest.fn()

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'add', item: { id: 'node1', type: 'agent' } }],
        mockOnNodesChangeBase
      )
    })

    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should notify on remove changes', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const mockOnNodesChangeBase = jest.fn()

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'remove', id: 'node1' }],
        mockOnNodesChangeBase
      )
    })

    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should not notify on selection-only changes', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    const mockOnNodesChangeBase = jest.fn()

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'select', id: 'node1' }],
        mockOnNodesChangeBase
      )
    })

    // Selection changes don't trigger notifyModified
    // Only actual modifications do
    expect(mockNotifyModified).not.toHaveBeenCalled()
  })

  it('should handle missing React Flow instance gracefully', () => {
    const emptyRef = { current: null } as React.MutableRefObject<any>
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: emptyRef,
        notifyModified: mockNotifyModified,
      })
    )

    const mockOnNodesChangeBase = jest.fn()

    act(() => {
      result.current.handleNodesChange(
        [{ type: 'position', id: 'node1' }],
        mockOnNodesChangeBase
      )
    })

    // Should still call base handler and notify
    expect(mockOnNodesChangeBase).toHaveBeenCalled()
    expect(mockNotifyModified).toHaveBeenCalled()
    expect(result.current.selectedNodeIds.size).toBe(0)
  })

  it('should allow manual selection updates via setters', () => {
    const { result } = renderHook(() =>
      useNodeSelection({
        reactFlowInstanceRef: mockReactFlowInstanceRef,
        notifyModified: mockNotifyModified,
      })
    )

    act(() => {
      result.current.setSelectedNodeId('node1')
      result.current.setSelectedNodeIds(new Set(['node1', 'node2']))
    })

    expect(result.current.selectedNodeId).toBe('node1')
    expect(result.current.selectedNodeIds.has('node1')).toBe(true)
    expect(result.current.selectedNodeIds.has('node2')).toBe(true)
  })
})
