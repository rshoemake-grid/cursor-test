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

  it('should verify exact null value in initial state', () => {
    const { result } = renderHook(() => useContextMenu())
    expect(result.current.contextMenu).toBeNull()
    expect(result.current.contextMenu).not.toBe(undefined)
    expect(result.current.contextMenu).not.toBe(false)
  })

  it('should verify exact null value in closeContextMenu', () => {
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

    // Verify exact null value (not undefined)
    expect(result.current.contextMenu).toBeNull()
    expect(result.current.contextMenu).not.toBe(undefined)
  })

  it('should verify exact property assignments in onNodeContextMenu', () => {
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

    // Verify exact property assignments
    expect(result.current.contextMenu?.nodeId).toBe('node-1')
    expect(result.current.contextMenu?.node).toBe(mockNode)
    expect(result.current.contextMenu?.x).toBe(100)
    expect(result.current.contextMenu?.y).toBe(200)
  })

  it('should verify exact property assignments in onEdgeContextMenu', () => {
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

    // Verify exact property assignments
    expect(result.current.contextMenu?.edgeId).toBe('edge-1')
    expect(result.current.contextMenu?.x).toBe(150)
    expect(result.current.contextMenu?.y).toBe(250)
    // edgeId should be set, nodeId should not be set
    expect(result.current.contextMenu?.nodeId).toBeUndefined()
  })

  it('should verify exact useCallback dependencies - onNodeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.onNodeContextMenu
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
      firstHandler(mockEvent, mockNode)
    })

    rerender()

    const secondHandler = result.current.onNodeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })

  it('should verify exact useCallback dependencies - onEdgeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.onEdgeContextMenu
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
      firstHandler(mockEvent, mockEdge)
    })

    rerender()

    const secondHandler = result.current.onEdgeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })

  it('should verify exact useCallback dependencies - closeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.closeContextMenu

    act(() => {
      firstHandler()
    })

    rerender()

    const secondHandler = result.current.closeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })

  it('should verify exact return statement structure', () => {
    const { result } = renderHook(() => useContextMenu())

    // Verify exact return structure
    expect(result.current).toHaveProperty('contextMenu')
    expect(result.current).toHaveProperty('setContextMenu')
    expect(result.current).toHaveProperty('onNodeContextMenu')
    expect(result.current).toHaveProperty('onEdgeContextMenu')
    expect(result.current).toHaveProperty('closeContextMenu')
    expect(Object.keys(result.current).length).toBe(5)
  })

  it('should verify exact event.preventDefault() call', () => {
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

    // Verify exact method call
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(mockEvent.preventDefault).toHaveBeenCalledWith()
  })

  it('should verify exact event.stopPropagation() call', () => {
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

    // Verify exact method call
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1)
    expect(mockEvent.stopPropagation).toHaveBeenCalledWith()
  })

  it('should verify exact setContextMenu call with node context', () => {
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

    // Verify exact setContextMenu call
    expect(result.current.contextMenu).toEqual({
      nodeId: 'node-1',
      node: mockNode,
      x: 100,
      y: 200,
    })
  })

  it('should verify exact setContextMenu call with edge context', () => {
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

    // Verify exact setContextMenu call
    expect(result.current.contextMenu).toEqual({
      edgeId: 'edge-1',
      x: 150,
      y: 250,
    })
  })

  it('should verify exact setContextMenu(null) call', () => {
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

    // Verify exact null assignment
    expect(result.current.contextMenu).toBeNull()
    expect(result.current.contextMenu).not.toBe(undefined)
  })

  it('should verify exact useState initial value - contextMenu is null', () => {
    const { result } = renderHook(() => useContextMenu())

    // Verify exact initial value
    expect(result.current.contextMenu).toBeNull()
    expect(result.current.contextMenu).not.toBe(undefined)
    expect(result.current.contextMenu).not.toBe(false)
    expect(result.current.contextMenu).not.toBe({})
  })

  it('should verify exact useCallback dependencies array - onNodeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.onNodeContextMenu

    rerender()

    const secondHandler = result.current.onNodeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })

  it('should verify exact useCallback dependencies array - onEdgeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.onEdgeContextMenu

    rerender()

    const secondHandler = result.current.onEdgeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })

  it('should verify exact useCallback dependencies array - closeContextMenu', () => {
    const { result, rerender } = renderHook(() => useContextMenu())

    const firstHandler = result.current.closeContextMenu

    rerender()

    const secondHandler = result.current.closeContextMenu
    // Should be same function reference (empty dependency array)
    expect(secondHandler).toBe(firstHandler)
  })
})
