/**
 * Mutation tests for useKeyboardShortcuts hook
 * Targets exact conditionals, logical operators, and edge cases
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

describe('useKeyboardShortcuts - Mutation Killers', () => {
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

  const createKeyboardEvent = (options: {
    key: string
    ctrlKey?: boolean
    metaKey?: boolean
    target?: HTMLElement
  }) => {
    const event = new KeyboardEvent('keydown', {
      key: options.key,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false,
    })
    event.preventDefault = jest.fn()
    event.stopPropagation = jest.fn()
    if (options.target) {
      Object.defineProperty(event, 'target', { value: options.target, writable: false })
    }
    return event
  }

  describe('Input field detection - logical OR', () => {
    it('should verify exact OR - INPUT tagName', () => {
      const mockInput = document.createElement('input')
      mockGetNodes.mockReturnValue([{ id: 'node1', selected: true } as Node])

      renderHookWithProvider({
        selectedNodeId: 'node1',
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true, target: mockInput })
      window.dispatchEvent(event)

      // Should not copy (INPUT tagName matches first OR condition)
      expect(mockOnCopy).not.toHaveBeenCalled()
    })

    it('should verify exact OR - TEXTAREA tagName', () => {
      const mockTextarea = document.createElement('textarea')
      mockGetNodes.mockReturnValue([{ id: 'node1', selected: true } as Node])

      renderHookWithProvider({
        selectedNodeId: 'node1',
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true, target: mockTextarea })
      window.dispatchEvent(event)

      // Should not copy (TEXTAREA tagName matches second OR condition)
      expect(mockOnCopy).not.toHaveBeenCalled()
    })

    it('should verify exact OR - isContentEditable', () => {
      const mockDiv = document.createElement('div')
      // Set contentEditable to make isContentEditable return true
      Object.defineProperty(mockDiv, 'isContentEditable', {
        get: () => true,
        configurable: true,
      })
      mockGetNodes.mockReturnValue([{ id: 'node1', selected: true } as Node])

      renderHookWithProvider({
        selectedNodeId: 'node1',
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true, target: mockDiv })
      window.dispatchEvent(event)

      // Should not copy (isContentEditable matches third OR condition)
      expect(mockOnCopy).not.toHaveBeenCalled()
    })

    it('should verify exact OR - none match (should handle shortcut)', () => {
      const mockDiv = document.createElement('div')
      // contentEditable is not set (falsy), tagName is 'DIV' (not INPUT/TEXTAREA)
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

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true, target: mockDiv })
      window.dispatchEvent(event)

      // Should copy (none of the OR conditions match: tagName !== INPUT/TEXTAREA, isContentEditable is falsy)
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
    })
  })

  describe('Copy shortcut - logical OR and exact string match', () => {
    it('should verify exact OR - ctrlKey true', () => {
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

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true })
      window.dispatchEvent(event)

      // Should copy (ctrlKey matches first OR condition)
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should verify exact OR - metaKey true', () => {
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

      const event = createKeyboardEvent({ key: 'c', metaKey: true })
      window.dispatchEvent(event)

      // Should copy (metaKey matches second OR condition)
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should verify exact string match - key === "c"', () => {
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

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true })
      window.dispatchEvent(event)

      // Should copy (exact string match)
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
    })

    it('should verify exact string match - key !== "c" (should not copy)', () => {
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

      const event = createKeyboardEvent({ key: 'd', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not copy (key !== "c")
      expect(mockOnCopy).not.toHaveBeenCalled()
    })

    it('should verify exact equality - selectedNodes.length === 1', () => {
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

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true })
      window.dispatchEvent(event)

      // Should copy (length === 1)
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode)
    })

    it('should verify exact equality - selectedNodes.length !== 1 (should not copy)', () => {
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

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not copy (length !== 1)
      expect(mockOnCopy).not.toHaveBeenCalled()
    })

    it('should verify exact equality - selectedNodes.length === 0 (should not copy)', () => {
      mockGetNodes.mockReturnValue([])

      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'c', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not copy (length === 0, not === 1)
      expect(mockOnCopy).not.toHaveBeenCalled()
    })
  })

  describe('Cut shortcut - logical OR and exact string match', () => {
    it('should verify exact OR - ctrlKey true', () => {
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

      const event = createKeyboardEvent({ key: 'x', ctrlKey: true })
      window.dispatchEvent(event)

      // Should cut (ctrlKey matches first OR condition)
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should verify exact OR - metaKey true', () => {
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

      const event = createKeyboardEvent({ key: 'x', metaKey: true })
      window.dispatchEvent(event)

      // Should cut (metaKey matches second OR condition)
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode)
    })

    it('should verify exact string match - key === "x"', () => {
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

      const event = createKeyboardEvent({ key: 'x', ctrlKey: true })
      window.dispatchEvent(event)

      // Should cut (exact string match)
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode)
    })

    it('should verify exact string match - key !== "x" (should not cut)', () => {
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

      const event = createKeyboardEvent({ key: 'y', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not cut (key !== "x")
      expect(mockOnCut).not.toHaveBeenCalled()
    })

    it('should verify exact equality - selectedNodes.length === 1', () => {
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

      const event = createKeyboardEvent({ key: 'x', ctrlKey: true })
      window.dispatchEvent(event)

      // Should cut (length === 1)
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode)
    })
  })

  describe('Paste shortcut - logical OR and truthy check', () => {
    it('should verify exact OR - ctrlKey true', () => {
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

      const event = createKeyboardEvent({ key: 'v', ctrlKey: true })
      window.dispatchEvent(event)

      // Should paste (ctrlKey matches first OR condition)
      expect(mockOnPaste).toHaveBeenCalled()
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should verify exact OR - metaKey true', () => {
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

      const event = createKeyboardEvent({ key: 'v', metaKey: true })
      window.dispatchEvent(event)

      // Should paste (metaKey matches second OR condition)
      expect(mockOnPaste).toHaveBeenCalled()
    })

    it('should verify exact string match - key === "v"', () => {
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

      const event = createKeyboardEvent({ key: 'v', ctrlKey: true })
      window.dispatchEvent(event)

      // Should paste (exact string match)
      expect(mockOnPaste).toHaveBeenCalled()
    })

    it('should verify truthy check - clipboardNode exists', () => {
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

      const event = createKeyboardEvent({ key: 'v', ctrlKey: true })
      window.dispatchEvent(event)

      // Should paste (clipboardNode is truthy)
      expect(mockOnPaste).toHaveBeenCalled()
    })

    it('should verify truthy check - clipboardNode is null (should not paste)', () => {
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'v', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not paste (clipboardNode is falsy)
      expect(mockOnPaste).not.toHaveBeenCalled()
    })

    it('should verify truthy check - clipboardNode is undefined (should not paste)', () => {
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: undefined as any,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'v', ctrlKey: true })
      window.dispatchEvent(event)

      // Should not paste (clipboardNode is falsy)
      expect(mockOnPaste).not.toHaveBeenCalled()
    })
  })

  describe('Delete/Backspace - logical OR and exact string match', () => {
    it('should verify exact OR - key === "Delete"', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should delete (key === "Delete" matches first OR condition)
      expect(mockDeleteElements).toHaveBeenCalled()
      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
    })

    it('should verify exact OR - key === "Backspace"', () => {
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

      const event = createKeyboardEvent({ key: 'Backspace' })
      window.dispatchEvent(event)

      // Should delete (key === "Backspace" matches second OR condition)
      expect(mockDeleteElements).toHaveBeenCalled()
      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
    })

    it('should verify exact string match - key !== "Delete" && key !== "Backspace" (should not delete)', () => {
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

      const event = createKeyboardEvent({ key: 'Enter' })
      window.dispatchEvent(event)

      // Should not delete (key doesn't match either OR condition)
      expect(mockDeleteElements).not.toHaveBeenCalled()
    })
  })

  describe('Delete selection - logical OR and comparison operators', () => {
    it('should verify exact OR - selectedNodes.length > 0', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should delete (selectedNodes.length > 0 matches first OR condition)
      expect(mockDeleteElements).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should verify exact OR - selectedEdges.length > 0', () => {
      const selectedEdge = { id: 'e1', source: 'node1', target: 'node2', selected: true }
      mockGetNodes.mockReturnValue([])
      mockGetEdges.mockReturnValue([selectedEdge as any])

      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should delete (selectedEdges.length > 0 matches second OR condition)
      expect(mockDeleteElements).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should verify exact OR - both false (should not delete)', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should not delete (both OR conditions false)
      expect(mockDeleteElements).not.toHaveBeenCalled()
      expect(mockNotifyModified).not.toHaveBeenCalled()
    })

    it('should verify exact comparison - selectedNodes.length > 0 (not === 0)', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should delete (length > 0, not === 0)
      expect(mockDeleteElements).toHaveBeenCalled()
    })

    it('should verify exact comparison - selectedNodes.length === 0 (should not delete)', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should not delete (length === 0, not > 0)
      expect(mockDeleteElements).not.toHaveBeenCalled()
    })
  })

  describe('Clear selection - some() check', () => {
    it('should verify some() check - node.id === selectedNodeId', () => {
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should clear selection (some node.id === selectedNodeId)
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
    })

    it('should verify some() check - node.id !== selectedNodeId (should not clear)', () => {
      const selectedNode = { id: 'node1', selected: true } as Node
      mockGetNodes.mockReturnValue([selectedNode])
      mockGetEdges.mockReturnValue([])

      renderHookWithProvider({
        selectedNodeId: 'node2', // Different ID
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste,
      })

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should not clear selection (no node.id === selectedNodeId)
      expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
    })

    it('should verify some() check - empty array (should not clear)', () => {
      mockGetNodes.mockReturnValue([])
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

      const event = createKeyboardEvent({ key: 'Delete' })
      window.dispatchEvent(event)

      // Should not clear selection (empty array, some() returns false)
      expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
    })
  })
})
