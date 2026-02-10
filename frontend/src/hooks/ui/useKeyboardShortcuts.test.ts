/**
 * Tests for useKeyboardShortcuts hook
 */

import React from 'react'
import { renderHook } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import type { Node } from '@xyflow/react'

// Mock useReactFlow
const mockUseReactFlow = jest.fn()
jest.mock('@xyflow/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest mocking
  const React = require('react')
  const actual = jest.requireActual('@xyflow/react')
  return {
    ...actual,
    useReactFlow: () => mockUseReactFlow(),
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  }
})

describe('useKeyboardShortcuts', () => {
  let mockDeleteElements: jest.Mock
  let mockGetNodes: jest.Mock
  let mockGetEdges: jest.Mock
  let mockOnCopy: jest.Mock
  let mockOnCut: jest.Mock
  let mockOnPaste: jest.Mock
  let mockSetSelectedNodeId: jest.Mock
  let mockNotifyModified: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockDeleteElements = jest.fn()
    mockGetNodes = jest.fn(() => [])
    mockGetEdges = jest.fn(() => [])
    mockOnCopy = jest.fn()
    mockOnCut = jest.fn()
    mockOnPaste = jest.fn()
    mockSetSelectedNodeId = jest.fn()
    mockNotifyModified = jest.fn()

    mockUseReactFlow.mockReturnValue({
      deleteElements: mockDeleteElements,
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
    } as any)
  })

  const renderHookWithProvider = (options: Parameters<typeof useKeyboardShortcuts>[0]) => {
    return renderHook(() => useKeyboardShortcuts(options), {
      wrapper: ReactFlowProvider,
    })
  }

  it('should set up keyboard event listeners', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    addEventListenerSpy.mockRestore()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('should not handle shortcuts when typing in input field', () => {
    const mockInput = document.createElement('input')
    mockGetNodes.mockReturnValue([
      { id: 'node1', selected: true } as Node,
    ])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
    })
    Object.defineProperty(event, 'target', { value: mockInput, writable: false })

    window.dispatchEvent(event)

    expect(mockOnCopy).not.toHaveBeenCalled()
  })

  it('should handle Copy shortcut (Ctrl+C)', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    mockGetNodes.mockReturnValue([selectedNode])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
    })
    event.preventDefault = jest.fn()

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
  })

  it('should handle Copy shortcut (Cmd+C on Mac)', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    mockGetNodes.mockReturnValue([selectedNode])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      metaKey: true,
    })
    event.preventDefault = jest.fn()

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
  })

  it('should not copy if multiple nodes are selected', () => {
    mockGetNodes.mockReturnValue([
      { id: 'node1', selected: true } as Node,
      { id: 'node2', selected: true } as Node,
    ])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
    })

    window.dispatchEvent(event)

    expect(mockOnCopy).not.toHaveBeenCalled()
  })

  it('should handle Cut shortcut (Ctrl+X)', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    mockGetNodes.mockReturnValue([selectedNode])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'x',
      ctrlKey: true,
    })
    event.preventDefault = jest.fn()

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockOnCut).toHaveBeenCalledWith(selectedNode)
  })

  it('should handle Paste shortcut (Ctrl+V)', () => {
    const clipboardNode = { id: 'node1', type: 'agent' } as Node

    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
    })
    event.preventDefault = jest.fn()

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockOnPaste).toHaveBeenCalled()
  })

  it('should not paste if clipboard is empty', () => {
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
    })

    window.dispatchEvent(event)

    expect(mockOnPaste).not.toHaveBeenCalled()
  })

  it('should handle Delete key', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    const selectedEdge = { id: 'e1', source: 'node1', target: 'node2', selected: true }
    mockGetNodes.mockReturnValue([selectedNode])
    mockGetEdges.mockReturnValue([selectedEdge as any])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
    })
    event.preventDefault = jest.fn()
    event.stopPropagation = jest.fn()

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
    expect(mockDeleteElements).toHaveBeenCalledWith({
      nodes: [selectedNode],
      edges: [selectedEdge],
    })
    expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should handle Backspace key', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    mockGetNodes.mockReturnValue([selectedNode])
    mockGetEdges.mockReturnValue([])

    renderHookWithProvider({
      selectedNodeId: 'node1',
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
    })
    event.preventDefault = jest.fn()
    event.stopPropagation = jest.fn()

    window.dispatchEvent(event)

    expect(mockDeleteElements).toHaveBeenCalled()
    expect(mockNotifyModified).toHaveBeenCalled()
  })

  it('should not delete if nothing is selected', () => {
    mockGetNodes.mockReturnValue([])
    mockGetEdges.mockReturnValue([])

    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
    })

    window.dispatchEvent(event)

    expect(mockDeleteElements).not.toHaveBeenCalled()
  })

  it('should not clear selectedNodeId if deleted node was not selected', () => {
    const selectedNode = { id: 'node1', selected: true } as Node
    mockGetNodes.mockReturnValue([selectedNode])
    mockGetEdges.mockReturnValue([])

    renderHookWithProvider({
      selectedNodeId: 'node2', // Different node selected
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardNode: null,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    })

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
    })
    event.preventDefault = jest.fn()
    event.stopPropagation = jest.fn()

    window.dispatchEvent(event)

    expect(mockDeleteElements).toHaveBeenCalled()
    expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
  })
})
