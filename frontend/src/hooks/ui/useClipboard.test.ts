/**
 * Tests for useClipboard hook
 */

import { renderHook, act } from '@testing-library/react'
import { useClipboard } from './useClipboard'
import { showSuccess } from '../../utils/notifications'
import type { Node } from '@xyflow/react'

jest.mock('../../utils/notifications', () => ({
  showSuccess: jest.fn(),
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>

describe('useClipboard', () => {
  let mockNotifyModified: jest.Mock
  let mockReactFlowInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockNotifyModified = jest.fn()
    
    mockReactFlowInstance = {
      getNodes: jest.fn(() => []),
      screenToFlowPosition: jest.fn((pos: { x: number; y: number }) => pos),
      addNodes: jest.fn(),
      deleteElements: jest.fn(),
    }
  })

  const createMockRef = (instance: any) => {
    return { current: instance } as React.MutableRefObject<any>
  }

  it('should initialize with empty clipboard', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    expect(result.current.clipboardNode).toBeNull()
    expect(result.current.clipboardAction).toBeNull()
  })

  it('should copy a node', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    expect(result.current.clipboardNode).toEqual(node)
    expect(result.current.clipboardAction).toBe('copy')
    expect(mockShowSuccess).toHaveBeenCalledWith('Node copied to clipboard')
  })

  it('should cut a node', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.cut(node)
    })

    expect(result.current.clipboardNode).toEqual(node)
    expect(result.current.clipboardAction).toBe('cut')
    expect(mockShowSuccess).toHaveBeenCalledWith('Node cut to clipboard')
  })

  it('should paste a copied node', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste()
    })

    expect(mockReactFlowInstance.addNodes).toHaveBeenCalled()
    expect(mockReactFlowInstance.deleteElements).not.toHaveBeenCalled()
    expect(result.current.clipboardNode).toEqual(node) // Still there after copy
    expect(mockNotifyModified).toHaveBeenCalled()
    expect(mockShowSuccess).toHaveBeenCalledWith('Node pasted')
  })

  it('should paste a cut node and delete original', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.cut(node)
    })

    act(() => {
      result.current.paste()
    })

    expect(mockReactFlowInstance.addNodes).toHaveBeenCalled()
    expect(mockReactFlowInstance.deleteElements).toHaveBeenCalledWith({
      nodes: [{ id: 'node1' }],
    })
    expect(result.current.clipboardNode).toBeNull()
    expect(result.current.clipboardAction).toBeNull()
    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should paste at specified position', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    mockReactFlowInstance.screenToFlowPosition.mockReturnValue({ x: 300, y: 400 })

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste(300, 400)
    })

    expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith({ x: 300, y: 400 })
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { x: 300, y: 400 },
      })
    )
  })

  it('should paste at offset position if no coordinates provided', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste()
    })

    expect(mockReactFlowInstance.addNodes).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { x: 150, y: 250 }, // Original + 50 offset
      })
    )
  })

  it('should not paste if clipboard is empty', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    act(() => {
      result.current.paste()
    })

    expect(mockReactFlowInstance.addNodes).not.toHaveBeenCalled()
    expect(mockNotifyModified).not.toHaveBeenCalled()
  })

  it('should not paste if React Flow instance is missing', () => {
    const ref = createMockRef(null)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste()
    })

    expect(mockNotifyModified).not.toHaveBeenCalled()
  })

  it('should not paste if React Flow methods are missing', () => {
    const ref = createMockRef({})
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste()
    })

    expect(mockNotifyModified).not.toHaveBeenCalled()
  })

  it('should generate new ID when pasting', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    act(() => {
      result.current.paste()
    })

    const addedNode = mockReactFlowInstance.addNodes.mock.calls[0][0]
    expect(addedNode.id).not.toBe('node1')
    expect(addedNode.id).toMatch(/^agent_\d+$/)
    expect(addedNode.selected).toBe(false)
  })

  it('should clear clipboard', () => {
    const ref = createMockRef(mockReactFlowInstance)
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified))

    const node: Node = {
      id: 'node1',
      type: 'agent',
      position: { x: 100, y: 200 },
      data: { name: 'Test Node' },
    }

    act(() => {
      result.current.copy(node)
    })

    expect(result.current.clipboardNode).toEqual(node)

    act(() => {
      result.current.clear()
    })

    expect(result.current.clipboardNode).toBeNull()
    expect(result.current.clipboardAction).toBeNull()
  })
})
