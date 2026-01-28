import { renderHook, act } from '@testing-library/react'
import { useContextMenu } from './useContextMenu'
import type { Node, Edge } from '@xyflow/react'

describe('useContextMenu', () => {
  it('should initialize with null context menu', () => {
    const { result } = renderHook(() => useContextMenu())
    expect(result.current.contextMenu).toBeNull()
  })

  it('should open context menu on node right-click', () => {
    const { result } = renderHook(() => useContextMenu())
    const mockNode: Node = {
      id: 'node-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
    }
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.onNodeContextMenu(mockEvent, mockNode)
    })

    expect(result.current.contextMenu).toEqual({
      nodeId: 'node-1',
      node: mockNode,
      x: 100,
      y: 200,
    })
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should open context menu on edge right-click', () => {
    const { result } = renderHook(() => useContextMenu())
    const mockEdge: Edge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    }
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 150,
      clientY: 250,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.onEdgeContextMenu(mockEvent, mockEdge)
    })

    expect(result.current.contextMenu).toEqual({
      edgeId: 'edge-1',
      x: 150,
      y: 250,
    })
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should close context menu', () => {
    const { result } = renderHook(() => useContextMenu())
    const mockNode: Node = {
      id: 'node-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
    }
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.onNodeContextMenu(mockEvent, mockNode)
    })

    expect(result.current.contextMenu).not.toBeNull()

    act(() => {
      result.current.closeContextMenu()
    })

    expect(result.current.contextMenu).toBeNull()
  })

  it('should update context menu position correctly', () => {
    const { result } = renderHook(() => useContextMenu())
    const mockNode: Node = {
      id: 'node-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
    }
    const mockEvent1 = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    const mockEvent2 = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 300,
      clientY: 400,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.onNodeContextMenu(mockEvent1, mockNode)
    })

    expect(result.current.contextMenu?.x).toBe(100)
    expect(result.current.contextMenu?.y).toBe(200)

    act(() => {
      result.current.onNodeContextMenu(mockEvent2, mockNode)
    })

    expect(result.current.contextMenu?.x).toBe(300)
    expect(result.current.contextMenu?.y).toBe(400)
  })

  it('should handle multiple node context menu calls', () => {
    const { result } = renderHook(() => useContextMenu())
    const mockNode1: Node = {
      id: 'node-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {},
    }
    const mockNode2: Node = {
      id: 'node-2',
      type: 'condition',
      position: { x: 0, y: 0 },
      data: {},
    }
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.onNodeContextMenu(mockEvent, mockNode1)
    })

    expect(result.current.contextMenu?.nodeId).toBe('node-1')

    act(() => {
      result.current.onNodeContextMenu(mockEvent, mockNode2)
    })

    expect(result.current.contextMenu?.nodeId).toBe('node-2')
  })

  it('should allow setting context menu directly', () => {
    const { result } = renderHook(() => useContextMenu())

    act(() => {
      result.current.setContextMenu({
        nodeId: 'node-1',
        x: 50,
        y: 75,
      })
    })

    expect(result.current.contextMenu).toEqual({
      nodeId: 'node-1',
      x: 50,
      y: 75,
    })
  })
})
