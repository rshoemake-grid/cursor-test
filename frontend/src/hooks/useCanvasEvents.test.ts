import { renderHook, act } from '@testing-library/react'
import { useCanvasEvents } from './useCanvasEvents'
import { addEdge } from '@xyflow/react'
import type { Node, Edge, Connection } from '@xyflow/react'
import { showSuccess, showError } from '../utils/notifications'
import { logger } from '../utils/logger'

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useCanvasEvents', () => {
  const mockReactFlowInstanceRef = { current: { screenToFlowPosition: jest.fn() } }
  const mockSetNodes = jest.fn()
  const mockSetEdges = jest.fn()
  const mockSetSelectedNodeId = jest.fn()
  const mockNotifyModified = jest.fn()
  const mockClipboard = {
    clipboardNode: null,
    paste: jest.fn(),
  }
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockReactFlowInstanceRef.current = { screenToFlowPosition: jest.fn() }
  })

  describe('onConnect', () => {
    it('should add edge when connection is made', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
      }

      act(() => {
        result.current.onConnect(connection)
      })

      expect(mockSetEdges).toHaveBeenCalled()
      const setEdgesCall = mockSetEdges.mock.calls[0][0]
      expect(typeof setEdgesCall).toBe('function')
    })
  })

  describe('onDragOver', () => {
    it('should prevent default and set dropEffect to move', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDragOver(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.dataTransfer.dropEffect).toBe('move')
    })
  })

  describe('onDrop', () => {
    it('should create new node when dropping valid type', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should not create node when no type data', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn(() => ''),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })

    it('should handle custom agent data', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const customAgentData = {
        label: 'Custom Agent',
        description: 'Test Description',
        agent_config: { model: 'gpt-4' },
      }

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            if (type === 'application/custom-agent') return JSON.stringify(customAgentData)
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const existingNodes: Node[] = []
      const newNode = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall[0]
      expect(newNode).toBeDefined()
      if (newNode && Array.isArray(newNode)) {
        expect(newNode[0].data.label).toBe('Custom Agent')
        expect(newNode[0].data.description).toBe('Test Description')
      } else if (newNode) {
        expect(newNode.data.label).toBe('Custom Agent')
        expect(newNode.data.description).toBe('Test Description')
      }
    })

    it('should handle invalid custom agent data', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            if (type === 'application/custom-agent') return 'invalid json'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should use fallback position calculation when screenToFlowPosition not available', () => {
      mockReactFlowInstanceRef.current = { screenToFlowPosition: undefined }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 50, top: 50 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
    })
  })

  describe('onNodeClick', () => {
    it('should select node on single click', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith('node-1')
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should toggle selection on multi-select click', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
        selected: false,
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: true,
        metaKey: false,
        ctrlKey: false,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockSetNodes).toHaveBeenCalled()
    })
  })

  describe('onPaneClick', () => {
    it('should clear selection on pane click', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        ctrlKey: false,
        metaKey: false,
        button: 0,
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onPaneClick(mockEvent)
      })

      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
    })

    it('should paste on pane click with Ctrl+V and clipboard node', () => {
      const clipboardWithNode = {
        clipboardNode: { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} } as Node,
        paste: jest.fn(),
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: clipboardWithNode,
        })
      )

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        button: 0,
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onPaneClick(mockEvent)
      })

      expect(clipboardWithNode.paste).toHaveBeenCalledWith(100, 200)
    })
  })

  describe('handleAddToAgentNodes', () => {
    it('should add agent node to storage', () => {
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([]))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Agent',
          description: 'Test Description',
          agent_config: { model: 'gpt-4' },
        },
      }

      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockStorage.getItem).toHaveBeenCalledWith('customAgentNodes')
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(dispatchEventSpy).toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalledWith('Agent node added to palette')

      dispatchEventSpy.mockRestore()
    })

    it('should not add duplicate agent node', () => {
      const existingNodes = [
        {
          id: 'agent_1',
          label: 'Test Agent',
          description: 'Test Description',
          agent_config: { model: 'gpt-4' },
          type: 'agent',
        },
      ]
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(existingNodes))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Agent',
          description: 'Test Description',
          agent_config: { model: 'gpt-4' },
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockShowError).toHaveBeenCalledWith('This agent node already exists in the palette')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle non-agent node', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'condition',
        position: { x: 0, y: 0 },
        data: {},
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle missing storage', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: null,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
    })

    it('should handle storage errors', () => {
      mockStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(mockShowError).toHaveBeenCalledWith('Failed to add agent node to palette')
    })

    it('should handle node with name but no label', () => {
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([]))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          name: 'Test Agent',
          agent_config: {},
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockStorage.setItem).toHaveBeenCalled()
      const setItemCall = mockStorage.setItem.mock.calls[0]
      const savedNodes = JSON.parse(setItemCall[1])
      expect(savedNodes[0].label).toBe('Test Agent')
    })

    it('should handle node with neither label nor name', () => {
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([]))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          agent_config: {},
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockStorage.setItem).toHaveBeenCalled()
      const setItemCall = mockStorage.setItem.mock.calls[0]
      const savedNodes = JSON.parse(setItemCall[1])
      expect(savedNodes[0].label).toBe('Custom Agent')
    })
  })

  describe('onNodeClick edge cases', () => {
    it('should not handle clicks during drag operations', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      // Set isDraggingRef to true
      result.current.isDraggingRef.current = true

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
      expect(mockSetNodes).not.toHaveBeenCalled()
    })

    it('should handle multi-select with metaKey', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
        selected: false,
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: false,
        metaKey: true,
        ctrlKey: false,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should handle multi-select with ctrlKey', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
        selected: false,
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: false,
        metaKey: false,
        ctrlKey: true,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should toggle selection when node is already selected in multi-select', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
        selected: true,
      }

      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: true,
        metaKey: false,
        ctrlKey: false,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall([mockNode]) : setNodesCall
      const updatedNode = updatedNodes.find((n: Node) => n.id === 'node-1')
      expect(updatedNode?.selected).toBe(false)
    })
  })

  describe('onPaneClick edge cases', () => {
    it('should not paste when button is not 0', () => {
      const clipboardWithNode = {
        clipboardNode: { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} } as Node,
        paste: jest.fn(),
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: clipboardWithNode,
        })
      )

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        button: 1, // Not left button
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onPaneClick(mockEvent)
      })

      expect(clipboardWithNode.paste).not.toHaveBeenCalled()
    })

    it('should not paste when clipboard node is null', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        button: 0,
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onPaneClick(mockEvent)
      })

      expect(mockClipboard.paste).not.toHaveBeenCalled()
    })

    it('should paste with metaKey (Cmd on Mac)', () => {
      const clipboardWithNode = {
        clipboardNode: { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} } as Node,
        paste: jest.fn(),
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: clipboardWithNode,
        })
      )

      const mockEvent = {
        ctrlKey: false,
        metaKey: true,
        button: 0,
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent

      act(() => {
        result.current.onPaneClick(mockEvent)
      })

      expect(clipboardWithNode.paste).toHaveBeenCalledWith(100, 200)
    })
  })

  describe('onDrop edge cases', () => {
    it('should handle fallback when closest returns null', () => {
      mockReactFlowInstanceRef.current = { screenToFlowPosition: undefined }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue(null),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).not.toHaveBeenCalled()
    })

    it('should handle node type capitalization correctly', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'condition'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(Array.isArray(newNodes)).toBe(true)
      if (Array.isArray(newNodes) && newNodes.length > 0) {
        expect(newNodes[0].data.label).toContain('Condition')
      }
    })

    it('should handle node type with custom data fallback values', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'loop'
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      if (Array.isArray(newNodes) && newNodes.length > 0) {
        expect(newNodes[0].data.label).toBe('Loop Node')
        expect(newNodes[0].data.name).toBe('Loop Node')
        expect(newNodes[0].data.inputs).toEqual([])
      }
    })

    it('should verify custom agent data fallback for label when missing', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const customAgentData = {
        description: 'Test Description',
        agent_config: { model: 'gpt-4' },
        // No label
      }

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            if (type === 'application/custom-agent') return JSON.stringify(customAgentData)
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      if (Array.isArray(newNodes) && newNodes.length > 0) {
        // Should use fallback: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`
        expect(newNodes[0].data.label).toBe('Agent Node')
        expect(newNodes[0].data.name).toBe('Agent Node')
      }
    })

    it('should verify custom agent data fallback for description when missing', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const customAgentData = {
        label: 'Custom Agent',
        agent_config: { model: 'gpt-4' },
        // No description
      }

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            if (type === 'application/custom-agent') return JSON.stringify(customAgentData)
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      if (Array.isArray(newNodes) && newNodes.length > 0) {
        expect(newNodes[0].data.description).toBe('')
      }
    })

    it('should verify custom agent data fallback for agent_config when missing', () => {
      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn().mockReturnValue({ x: 100, y: 200 })

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
        })
      )

      const customAgentData = {
        label: 'Custom Agent',
        description: 'Test Description',
        // No agent_config
      }

      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 150,
        clientY: 250,
        dataTransfer: {
          getData: jest.fn((type: string) => {
            if (type === 'application/reactflow') return 'agent'
            if (type === 'application/custom-agent') return JSON.stringify(customAgentData)
            return ''
          }),
        },
        currentTarget: {
          closest: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
          }),
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.onDrop(mockEvent)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      if (Array.isArray(newNodes) && newNodes.length > 0) {
        expect(newNodes[0].data.agent_config).toEqual({})
      }
    })

    it('should verify handleAddToAgentNodes checks node.type !== agent', () => {
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([]))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'condition', // Not 'agent'
        position: { x: 0, y: 0 },
        data: {
          label: 'Condition Node',
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      // Should return early, not call storage
      expect(mockStorage.getItem).not.toHaveBeenCalled()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should verify handleAddToAgentNodes checks !storage', () => {
      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: null,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {},
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
    })

    it('should verify handleAddToAgentNodes checks exists with label and agent_config comparison', () => {
      const existingNodes = [
        {
          id: 'agent_1',
          label: 'Test Agent',
          agent_config: { model: 'gpt-4', temperature: 0.7 },
          type: 'agent',
        },
      ]
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(existingNodes))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Agent',
          agent_config: { model: 'gpt-4', temperature: 0.7 },
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      expect(mockShowError).toHaveBeenCalledWith('This agent node already exists in the palette')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should verify handleAddToAgentNodes checks exists with different agent_config', () => {
      const existingNodes = [
        {
          id: 'agent_1',
          label: 'Test Agent',
          agent_config: { model: 'gpt-4' },
          type: 'agent',
        },
      ]
      mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(existingNodes))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage as any,
        })
      )

      const mockNode: Node = {
        id: 'node-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Agent',
          agent_config: { model: 'gpt-3.5' }, // Different config
        },
      }

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      // Should add since agent_config is different
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalled()
    })

    it('should verify exact fallback values for customData logical OR operators', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn((format: string) => {
            if (format === 'application/reactflow') return 'agent'
            if (format === 'application/custom-agent') return JSON.stringify({
              label: 'Test Agent',
              // Omit description and agent_config to test fallbacks
            })
            return ''
          }),
        },
        clientX: 100,
        clientY: 200,
        currentTarget: document.createElement('div'),
      } as any

      mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.onDrop(mockEvent)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodeArray = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      const newNode = Array.isArray(newNodeArray) ? newNodeArray[0] : newNodeArray

      // Verify exact fallback values (not mutated)
      // When customData is provided, it uses customData.description || '' and customData.agent_config || {}
      expect(newNode).toBeDefined()
      expect(newNode.data).toBeDefined()
      // customData.description || '' should be ''
      expect(newNode.data.description).toBe('')
      expect(newNode.data.description.length).toBe(0)
      // customData.agent_config || {} should be {}
      expect(newNode.data.agent_config).toEqual({})
      expect(Object.keys(newNode.data.agent_config)).toHaveLength(0)
    })

    it('should verify exact fallback values for node.data logical OR operators', () => {
      // Clear storage to ensure clean state
      mockStorage.getItem.mockReturnValue(null)
      jest.clearAllMocks()
      
      const mockNode = {
        id: 'node-1',
        type: 'agent',
        data: {
          // Omit label, name, description, agent_config to test fallbacks
        },
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      // Verify exact fallback values are used
      expect(mockStorage.setItem).toHaveBeenCalled()
      const setItemCall = mockStorage.setItem.mock.calls[0]
      const agentNodes = JSON.parse(setItemCall[1])
      const agentTemplate = agentNodes[0]

      // Verify exact fallback values (not mutated)
      // node.data.label || node.data.name || 'Custom Agent' should be 'Custom Agent'
      expect(agentTemplate.label).toBe('Custom Agent')
      expect(agentTemplate.description).toBe('')
      expect(agentTemplate.agent_config).toEqual({})
    })

    it('should verify exact string literal Custom Agent', () => {
      // Clear storage to ensure clean state
      mockStorage.getItem.mockReturnValue(null)
      jest.clearAllMocks()
      
      const mockNode = {
        id: 'node-1',
        type: 'agent',
        data: {
          // No label or name - should use 'Custom Agent' fallback
        },
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      const setItemCall = mockStorage.setItem.mock.calls[0]
      const agentNodes = JSON.parse(setItemCall[1])
      const agentTemplate = agentNodes[0]

      // Verify exact string literal 'Custom Agent' (not mutated)
      expect(agentTemplate.label).toBe('Custom Agent')
      expect(agentTemplate.label).not.toBe('custom agent')
      expect(agentTemplate.label).not.toBe('CustomAgent')
    })

    it('should verify exact string literal Agent node added to palette', () => {
      const mockNode = {
        id: 'node-1',
        type: 'agent',
        data: { label: 'Test Agent', agent_config: {} },
      }

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      // Verify exact string literal (not mutated)
      expect(mockShowSuccess).toHaveBeenCalledWith('Agent node added to palette')
      expect(mockShowSuccess).not.toHaveBeenCalledWith('agent node added to palette')
      expect(mockShowSuccess).not.toHaveBeenCalledWith('Agent node added to the palette')
    })

    it('should verify exact string literal This agent node already exists in the palette', () => {
      const mockNode = {
        id: 'node-1',
        type: 'agent',
        data: { label: 'Test Agent', agent_config: {} },
      }

      mockStorage.getItem.mockReturnValue(JSON.stringify([
        { label: 'Test Agent', agent_config: {} }
      ]))

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      act(() => {
        result.current.handleAddToAgentNodes(mockNode)
      })

      // Verify exact string literal (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('This agent node already exists in the palette')
      expect(mockShowError).not.toHaveBeenCalledWith('this agent node already exists in the palette')
    })

    it('should verify exact logical OR operators in isMultiSelect', () => {
      const mockNode = { id: 'node-1', type: 'agent', data: {} }
      const mockEvent = {
        stopPropagation: jest.fn(),
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      } as any

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: mockClipboard,
          storage: mockStorage,
        })
      )

      // Test: shiftKey is true
      mockEvent.shiftKey = true
      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })
      expect(mockSetNodes).toHaveBeenCalled()

      // Test: metaKey is true
      jest.clearAllMocks()
      mockEvent.shiftKey = false
      mockEvent.metaKey = true
      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })
      expect(mockSetNodes).toHaveBeenCalled()

      // Test: ctrlKey is true
      jest.clearAllMocks()
      mockEvent.metaKey = false
      mockEvent.ctrlKey = true
      act(() => {
        result.current.onNodeClick(mockEvent, mockNode)
      })
      expect(mockSetNodes).toHaveBeenCalled()
    })

    it('should verify exact logical OR operators in onPaneClick', () => {
      const mockEvent = {
        button: 0,
        ctrlKey: false,
        metaKey: false,
        clientX: 100,
        clientY: 200,
      } as any

      const { result } = renderHook(() =>
        useCanvasEvents({
          reactFlowInstanceRef: mockReactFlowInstanceRef as any,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setSelectedNodeId: mockSetSelectedNodeId,
          notifyModified: mockNotifyModified,
          clipboard: { ...mockClipboard, clipboardNode: { id: 'clipboard-1' } },
          storage: mockStorage,
        })
      )

      // Test: ctrlKey is true
      mockEvent.ctrlKey = true
      act(() => {
        result.current.onPaneClick(mockEvent)
      })
      expect(mockClipboard.paste).toHaveBeenCalled()

      // Test: metaKey is true
      jest.clearAllMocks()
      mockEvent.ctrlKey = false
      mockEvent.metaKey = true
      act(() => {
        result.current.onPaneClick(mockEvent)
      })
      expect(mockClipboard.paste).toHaveBeenCalled()
    })
  })
})
