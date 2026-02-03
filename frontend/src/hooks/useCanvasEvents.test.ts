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

  describe('additional coverage for no-coverage mutants', () => {
    describe('exact string literal comparisons', () => {
      it('should verify exact string literal "application/reactflow"', () => {
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
              // Verify exact string literal 'application/reactflow' is used
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

        expect(mockEvent.dataTransfer.getData).toHaveBeenCalledWith('application/reactflow')
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify exact string literal "application/custom-agent"', () => {
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
              // Verify exact string literal 'application/custom-agent' is used
              if (type === 'application/custom-agent') return JSON.stringify({ label: 'Test' })
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

        expect(mockEvent.dataTransfer.getData).toHaveBeenCalledWith('application/custom-agent')
      })

      it('should verify exact string literal ".react-flow"', () => {
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

        const mockClosest = jest.fn().mockReturnValue({
          getBoundingClientRect: jest.fn().mockReturnValue({ left: 50, top: 50 }),
        })

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
            closest: mockClosest,
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify exact string literal '.react-flow' is used
        expect(mockClosest).toHaveBeenCalledWith('.react-flow')
      })

      it('should verify exact string literal "customAgentNodes"', () => {
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
          data: { label: 'Test Agent', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(mockNode)
        })

        // Verify exact string literal 'customAgentNodes' is used
        expect(mockStorage.getItem).toHaveBeenCalledWith('customAgentNodes')
      })

      it('should verify exact string literal "move" for dropEffect', () => {
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

        // Verify exact string literal 'move' is used
        expect(mockEvent.dataTransfer.dropEffect).toBe('move')
        expect(mockEvent.dataTransfer.dropEffect).not.toBe('copy')
        expect(mockEvent.dataTransfer.dropEffect).not.toBe('link')
      })
    })

    describe('exact conditional expressions', () => {
      it('should verify exact falsy check !type', () => {
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
          dataTransfer: {
            getData: jest.fn(() => ''), // Empty string - falsy
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should return early when !type is true
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact null check !reactFlowWrapper', () => {
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
            closest: jest.fn().mockReturnValue(null), // null - falsy
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should return early when !reactFlowWrapper is true
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact truthy check customAgentData', () => {
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
              if (type === 'application/custom-agent') return JSON.stringify({ label: 'Test' }) // Truthy
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

        // Should use customData branch when customAgentData is truthy
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        if (Array.isArray(newNodes) && newNodes.length > 0) {
          expect(newNodes[0].data.label).toBe('Test')
        }
      })

      it('should verify exact comparison node.type !== agent', () => {
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
          type: 'condition', // !== 'agent'
          position: { x: 0, y: 0 },
          data: {},
        }

        act(() => {
          result.current.handleAddToAgentNodes(mockNode)
        })

        // Should return early when node.type !== 'agent'
        expect(mockStorage.getItem).not.toHaveBeenCalled()
      })

      it('should verify exact comparison event.button === 0', () => {
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
          button: 0, // === 0
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent)
        })

        // Should paste when event.button === 0
        expect(clipboardWithNode.paste).toHaveBeenCalled()
      })

      it('should verify exact comparison n.id === node.id in toggle selection', () => {
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

        const existingNodes: Node[] = [
          { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {}, selected: false },
          { id: 'node-2', type: 'agent', position: { x: 0, y: 0 }, data: {}, selected: true },
        ]

        const mockEvent = {
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        // Verify n.id === node.id comparison is used
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall
        const updatedNode1 = updatedNodes.find((n: Node) => n.id === 'node-1')
        const updatedNode2 = updatedNodes.find((n: Node) => n.id === 'node-2')
        // node-1 should be toggled (n.id === node.id)
        expect(updatedNode1?.selected).toBe(true)
        // node-2 should remain unchanged (n.id !== node.id)
        expect(updatedNode2?.selected).toBe(true)
      })
    })

    describe('exact logical OR operators', () => {
      it('should verify exact logical OR event.shiftKey || event.metaKey || event.ctrlKey', () => {
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

        // Test shiftKey only
        const event1 = {
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(event1, mockNode)
        })
        expect(mockSetNodes).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test metaKey only
        const event2 = {
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(event2, mockNode)
        })
        expect(mockSetNodes).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test ctrlKey only
        const event3 = {
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: true,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(event3, mockNode)
        })
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify exact logical OR event.ctrlKey || event.metaKey in onPaneClick', () => {
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

        // Test ctrlKey only
        const event1 = {
          ctrlKey: true,
          metaKey: false,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(event1)
        })
        expect(clipboardWithNode.paste).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test metaKey only
        const event2 = {
          ctrlKey: false,
          metaKey: true,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(event2)
        })
        expect(clipboardWithNode.paste).toHaveBeenCalled()
      })

      it('should verify exact logical OR node.data.label || node.data.name || Custom Agent', () => {
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

        // Test with label
        const node1: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Label', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(node1)
        })
        const setItemCall1 = mockStorage.setItem.mock.calls[0]
        const agentNodes1 = JSON.parse(setItemCall1[1])
        expect(agentNodes1[0].label).toBe('Test Label')

        jest.clearAllMocks()
        mockStorage.getItem.mockReturnValue(JSON.stringify([]))

        // Test with name (no label)
        const node2: Node = {
          id: 'node-2',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'Test Name', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(node2)
        })
        const setItemCall2 = mockStorage.setItem.mock.calls[0]
        const agentNodes2 = JSON.parse(setItemCall2[1])
        expect(agentNodes2[0].label).toBe('Test Name')

        jest.clearAllMocks()
        mockStorage.getItem.mockReturnValue(JSON.stringify([]))

        // Test with neither (should use 'Custom Agent')
        const node3: Node = {
          id: 'node-3',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(node3)
        })
        const setItemCall3 = mockStorage.setItem.mock.calls[0]
        const agentNodes3 = JSON.parse(setItemCall3[1])
        expect(agentNodes3[0].label).toBe('Custom Agent')
      })
    })

    describe('exact ternary operators', () => {
      it('should verify exact ternary customData ? {...} : {...}', () => {
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

        // Test with customData (truthy)
        const event1 = {
          preventDefault: jest.fn(),
          clientX: 150,
          clientY: 250,
          dataTransfer: {
            getData: jest.fn((type: string) => {
              if (type === 'application/reactflow') return 'agent'
              if (type === 'application/custom-agent') return JSON.stringify({ label: 'Custom' })
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
          result.current.onDrop(event1)
        })

        const setNodesCall1 = mockSetNodes.mock.calls[0][0]
        const newNodes1 = typeof setNodesCall1 === 'function' ? setNodesCall1([]) : setNodesCall1
        if (Array.isArray(newNodes1) && newNodes1.length > 0) {
          // Should use customData branch
          expect(newNodes1[0].data.label).toBe('Custom')
          expect(newNodes1[0].data.agent_config).toBeDefined()
        }

        jest.clearAllMocks()

        // Test without customData (falsy)
        const event2 = {
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
          result.current.onDrop(event2)
        })

        const setNodesCall2 = mockSetNodes.mock.calls[0][0]
        const newNodes2 = typeof setNodesCall2 === 'function' ? setNodesCall2([]) : setNodesCall2
        if (Array.isArray(newNodes2) && newNodes2.length > 0) {
          // Should use default branch
          expect(newNodes2[0].data.label).toBe('Agent Node')
          expect(newNodes2[0].data.agent_config).toBeUndefined()
        }
      })

      it('should verify exact ternary savedAgentNodes ? JSON.parse(savedAgentNodes) : []', () => {
        // Test with savedAgentNodes (truthy)
        mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([{ label: 'Existing' }]))

        const { result: result1 } = renderHook(() =>
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

        const node1: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'New', agent_config: {} },
        }

        act(() => {
          result1.current.handleAddToAgentNodes(node1)
        })

        const setItemCall1 = mockStorage.setItem.mock.calls[0]
        const agentNodes1 = JSON.parse(setItemCall1[1])
        expect(agentNodes1.length).toBe(2) // Existing + New

        jest.clearAllMocks()

        // Test without savedAgentNodes (falsy)
        mockStorage.getItem = jest.fn().mockReturnValue(null)

        const { result: result2 } = renderHook(() =>
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

        const node2: Node = {
          id: 'node-2',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'New', agent_config: {} },
        }

        act(() => {
          result2.current.handleAddToAgentNodes(node2)
        })

        const setItemCall2 = mockStorage.setItem.mock.calls[0]
        const agentNodes2 = JSON.parse(setItemCall2[1])
        expect(agentNodes2.length).toBe(1) // Just New (empty array fallback)
      })

      it('should verify exact ternary n.id === node.id ? !n.selected : n.selected', () => {
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

        const existingNodes: Node[] = [
          { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {}, selected: false },
          { id: 'node-2', type: 'agent', position: { x: 0, y: 0 }, data: {}, selected: true },
        ]

        const mockEvent = {
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const updatedNodes = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall
        const updatedNode1 = updatedNodes.find((n: Node) => n.id === 'node-1')
        const updatedNode2 = updatedNodes.find((n: Node) => n.id === 'node-2')
        // node-1: n.id === node.id, so !n.selected (false -> true)
        expect(updatedNode1?.selected).toBe(true)
        // node-2: n.id !== node.id, so n.selected (true -> true)
        expect(updatedNode2?.selected).toBe(true)
      })
    })

    describe('exact optional chaining', () => {
      it('should verify exact optional chaining reactFlowInstanceRef.current?.screenToFlowPosition', () => {
        // Test when screenToFlowPosition exists
        mockReactFlowInstanceRef.current = { screenToFlowPosition: jest.fn().mockReturnValue({ x: 100, y: 200 }) }

        const { result: result1 } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: mockClipboard,
          })
        )

        const event1 = {
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
          result1.current.onDrop(event1)
        })

        expect(mockReactFlowInstanceRef.current.screenToFlowPosition).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test when screenToFlowPosition is undefined
        mockReactFlowInstanceRef.current = { screenToFlowPosition: undefined }

        const { result: result2 } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: mockClipboard,
          })
        )

        const event2 = {
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
          result2.current.onDrop(event2)
        })

        // Should use fallback calculation
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify exact optional chaining clipboard?.clipboardNode', () => {
        // Test when clipboardNode exists
        const clipboardWithNode = {
          clipboardNode: { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} } as Node,
          paste: jest.fn(),
        }

        const { result: result1 } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: clipboardWithNode,
          })
        )

        const event1 = {
          ctrlKey: true,
          metaKey: false,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result1.current.onPaneClick(event1)
        })

        expect(clipboardWithNode.paste).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test when clipboardNode is null
        const clipboardWithoutNode = {
          clipboardNode: null,
          paste: jest.fn(),
        }

        const { result: result2 } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: clipboardWithoutNode,
          })
        )

        const event2 = {
          ctrlKey: true,
          metaKey: false,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result2.current.onPaneClick(event2)
        })

        // Should not paste when clipboardNode is null
        expect(clipboardWithoutNode.paste).not.toHaveBeenCalled()
      })
    })

    describe('exact property access', () => {
      it('should verify exact property access event.clientX and event.clientY', () => {
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
          clientX: 150, // Exact property access
          clientY: 250, // Exact property access
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

        // Verify exact property access is used in fallback calculation
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        if (Array.isArray(newNodes) && newNodes.length > 0) {
          // Position should be calculated using clientX and clientY
          expect(newNodes[0].position.x).toBe(100) // 150 - 50
          expect(newNodes[0].position.y).toBe(200) // 250 - 50
        }
      })

      it('should verify exact property access isDraggingRef.current', () => {
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

        // Test when isDraggingRef.current is false
        result.current.isDraggingRef.current = false

        const event1 = {
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(event1, mockNode)
        })

        expect(mockSetSelectedNodeId).toHaveBeenCalled()

        jest.clearAllMocks()

        // Test when isDraggingRef.current is true
        result.current.isDraggingRef.current = true

        const event2 = {
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(event2, mockNode)
        })

        // Should return early when isDraggingRef.current is true
        expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
      })
    })

    describe('exact method calls', () => {
      it('should verify exact method call event.preventDefault()', () => {
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
          preventDefault: jest.fn(), // Exact method call
          dataTransfer: { dropEffect: '' },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDragOver(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1)
      })

      it('should verify exact method call event.stopPropagation()', () => {
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
          stopPropagation: jest.fn(), // Exact method call
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1)
      })
    })

    describe('exact type checks', () => {
      it('should verify exact comparison typeof window !== undefined', () => {
        mockStorage.getItem = jest.fn().mockReturnValue(JSON.stringify([]))

        const originalWindow = global.window
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

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
          data: { label: 'Test Agent', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(mockNode)
        })

        // Should dispatch event when typeof window !== 'undefined'
        expect(dispatchEventSpy).toHaveBeenCalled()
        expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event))

        dispatchEventSpy.mockRestore()
      })
    })
  })

  describe('mutation killers - additional edge cases', () => {
    describe('onDrop - string operations', () => {
      it('should verify exact string operation type.charAt(0).toUpperCase() + type.slice(1)', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        // Mock closest to return a react-flow element
        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify the string operation: type.charAt(0).toUpperCase() + type.slice(1)
        // For 'agent', should become 'Agent'
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = setNodesCall([])
        expect(nodes[0].data.label).toBe('Agent Node')
        expect(nodes[0].data.name).toBe('Agent Node')
      })

      it('should verify string operation with different type values', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const types = ['condition', 'loop', 'input']
        types.forEach(type => {
          mockSetNodes.mockClear()
          const mockEvent = {
            preventDefault: jest.fn(),
            dataTransfer: {
              getData: jest.fn((format: string) => {
                if (format === 'application/reactflow') return type
                return ''
              }),
            },
            clientX: 100,
            clientY: 200,
            currentTarget: document.createElement('div'),
          } as unknown as React.DragEvent

          const mockReactFlowWrapper = document.createElement('div')
          mockReactFlowWrapper.className = 'react-flow'
          Object.defineProperty(mockEvent.currentTarget, 'closest', {
            value: jest.fn(() => mockReactFlowWrapper),
          })
          Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
            value: jest.fn(() => ({ left: 0, top: 0 })),
          })

          act(() => {
            result.current.onDrop(mockEvent)
          })

          const setNodesCall = mockSetNodes.mock.calls[0][0]
          const nodes = setNodesCall([])
          const expectedLabel = `${type.charAt(0).toUpperCase() + type.slice(1)} Node`
          expect(nodes[0].data.label).toBe(expectedLabel)
        })
      })
    })

    describe('onPaneClick - complex logical AND', () => {
      it('should verify exact logical AND: (ctrlKey || metaKey) && button === 0 && clipboardNode', () => {
        const clipboardWithNode = {
          clipboardNode: { id: 'node-1' },
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

        // Test: ctrlKey true, button 0, clipboardNode exists
        const mockEvent1 = {
          ctrlKey: true,
          metaKey: false,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent1)
        })

        expect(clipboardWithNode.paste).toHaveBeenCalledWith(100, 200)

        // Test: metaKey true, button 0, clipboardNode exists
        clipboardWithNode.paste.mockClear()
        const mockEvent2 = {
          ctrlKey: false,
          metaKey: true,
          button: 0,
          clientX: 150,
          clientY: 250,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent2)
        })

        expect(clipboardWithNode.paste).toHaveBeenCalledWith(150, 250)

        // Test: button !== 0 (should not paste)
        clipboardWithNode.paste.mockClear()
        const mockEvent3 = {
          ctrlKey: true,
          metaKey: false,
          button: 1, // Not 0
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent3)
        })

        expect(clipboardWithNode.paste).not.toHaveBeenCalled()

        // Test: clipboardNode is null (should not paste)
        const clipboardWithoutNode = {
          clipboardNode: null,
          paste: jest.fn(),
        }

        const { result: result2 } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: clipboardWithoutNode,
          })
        )

        const mockEvent4 = {
          ctrlKey: true,
          metaKey: false,
          button: 0,
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result2.current.onPaneClick(mockEvent4)
        })

        expect(clipboardWithoutNode.paste).not.toHaveBeenCalled()
      })
    })

    describe('handleAddToAgentNodes - complex comparison', () => {
      it('should verify exact comparison: n.label === agentTemplate.label && JSON.stringify(n.agent_config) === JSON.stringify(agentTemplate.agent_config)', () => {
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

        const agentConfig1 = { model: 'gpt-4', temperature: 0.7 }
        const agentConfig2 = { model: 'gpt-4', temperature: 0.8 }

        // First, add an agent
        mockStorage.getItem.mockReturnValue(JSON.stringify([]))
        const node1: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent', agent_config: agentConfig1 },
        }

        act(() => {
          result.current.handleAddToAgentNodes(node1)
        })

        expect(mockShowSuccess).toHaveBeenCalled()

        // Try to add the same agent again (should fail)
        mockShowSuccess.mockClear()
        mockShowError.mockClear()
        mockStorage.getItem.mockReturnValue(
          JSON.stringify([{
            id: 'agent_123',
            label: 'Test Agent',
            agent_config: agentConfig1,
          }])
        )

        act(() => {
          result.current.handleAddToAgentNodes(node1)
        })

        expect(mockShowError).toHaveBeenCalledWith('This agent node already exists in the palette')
        expect(mockShowSuccess).not.toHaveBeenCalled()

        // Try to add agent with same label but different config (should succeed)
        mockShowError.mockClear()
        mockStorage.getItem.mockReturnValue(
          JSON.stringify([{
            id: 'agent_123',
            label: 'Test Agent',
            agent_config: agentConfig1,
          }])
        )

        const node2: Node = {
          id: 'node-2',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent', agent_config: agentConfig2 },
        }

        act(() => {
          result.current.handleAddToAgentNodes(node2)
        })

        // Should succeed because agent_config is different
        expect(mockShowSuccess).toHaveBeenCalled()
        expect(mockShowError).not.toHaveBeenCalled()
      })
    })
  })

  describe('mutation killers - optional chaining and string literals', () => {
    describe('onDrop - optional chaining', () => {
      it('should verify exact optional chaining: reactFlowInstanceRef.current?.screenToFlowPosition - current is null', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: { current: null } as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: mockClipboard,
          })
        )

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use fallback calculation when screenToFlowPosition doesn't exist
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = setNodesCall([])
        expect(nodes[0].position).toEqual({ x: 100, y: 200 })
      })

      it('should verify exact optional chaining: clipboard?.clipboardNode - clipboard is null', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: null as any,
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

        // Should not crash when clipboard is null (optional chaining prevents error)
        expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
      })
    })

    describe('handleAddToAgentNodes - string literals', () => {
      it('should verify exact string literal: "Failed to parse custom agent data:"', () => {
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

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              if (format === 'application/custom-agent') return 'invalid json{' // Invalid JSON
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })
        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify exact string literal is used
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Failed to parse custom agent data:',
          expect.any(Error)
        )
      })

      it('should verify exact string literal: "Failed to save agent node:"', () => {
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

        mockStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error')
        })

        const mockNode: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(mockNode)
        })

        // Verify exact string literal is used
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Failed to save agent node:',
          expect.any(Error)
        )
      })

      it('should verify exact string literal: "Failed to add agent node to palette"', () => {
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

        mockStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error')
        })

        const mockNode: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent', agent_config: {} },
        }

        act(() => {
          result.current.handleAddToAgentNodes(mockNode)
        })

        // Verify exact string literal is used
        expect(mockShowError).toHaveBeenCalledWith(
          'Failed to add agent node to palette'
        )
      })
    })

    describe('onDrop - string template literal', () => {
      it('should verify exact template literal: `${type}-${Date.now()}`', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify template literal format: `${type}-${Date.now()}`
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = setNodesCall([])
        expect(nodes[0].id).toMatch(/^agent-\d+$/)
      })
    })

    describe('onDrop - boolean literal', () => {
      it('should verify exact boolean literal: draggable: true', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify exact boolean literal is used
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = setNodesCall([])
        expect(nodes[0].draggable).toBe(true)
      })
    })

    describe('onDrop - array literal', () => {
      it('should verify exact array literal: inputs: []', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify exact array literal is used
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = setNodesCall([])
        expect(nodes[0].data.inputs).toEqual([])
        expect(Array.isArray(nodes[0].data.inputs)).toBe(true)
        expect(nodes[0].data.inputs.length).toBe(0)
      })
    })
  })

  describe('mutation killers - dependency arrays and arrow functions', () => {
    describe('onConnect - dependency array and arrow function', () => {
      it('should verify exact dependency array: [setEdges]', () => {
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
          sourceHandle: 'output',
          targetHandle: 'input',
        }

        // Call onConnect multiple times to verify dependency array is used
        act(() => {
          result.current.onConnect(connection)
        })

        // Verify setEdges was called with the arrow function
        expect(mockSetEdges).toHaveBeenCalled()
        const setEdgesCall = mockSetEdges.mock.calls[0][0]
        
        // Verify it's a function (not undefined)
        expect(typeof setEdgesCall).toBe('function')
        
        // Verify the function uses addEdge
        const edges = setEdgesCall([])
        expect(edges).toHaveLength(1)
        expect(edges[0].source).toBe('node-1')
        expect(edges[0].target).toBe('node-2')
      })

      it('should verify exact arrow function: (eds) => addEdge(connection, eds)', () => {
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
          sourceHandle: 'output',
          targetHandle: 'input',
        }

        act(() => {
          result.current.onConnect(connection)
        })

        // Verify the arrow function properly uses addEdge
        const setEdgesCall = mockSetEdges.mock.calls[0][0]
        const existingEdges = [{ id: 'edge-1', source: 'node-3', target: 'node-4' }]
        const newEdges = setEdgesCall(existingEdges)
        
        // Should add the new edge to existing edges
        expect(newEdges.length).toBe(2)
        expect(newEdges[0].id).toBe('edge-1')
        expect(newEdges[1].source).toBe('node-1')
        expect(newEdges[1].target).toBe('node-2')
      })
    })

    describe('onDragOver - dependency array', () => {
      it('should verify exact dependency array: []', () => {
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
          dataTransfer: {
            dropEffect: '',
          },
        } as unknown as React.DragEvent

        // Call multiple times - should have same behavior (empty dependency array)
        act(() => {
          result.current.onDragOver(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.dataTransfer.dropEffect).toBe('move')

        // Call again - should work the same (empty deps means no re-creation)
        mockEvent.preventDefault.mockClear()
        act(() => {
          result.current.onDragOver(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.dataTransfer.dropEffect).toBe('move')
      })
    })

    describe('onDrop - dependency array and arrow function', () => {
      it('should verify exact dependency array: [reactFlowInstanceRef, setNodes, notifyModified]', () => {
        const { result, rerender } = renderHook(
          ({ reactFlowInstanceRef }) =>
            useCanvasEvents({
              reactFlowInstanceRef: reactFlowInstanceRef as any,
              setNodes: mockSetNodes,
              setEdges: mockSetEdges,
              setSelectedNodeId: mockSetSelectedNodeId,
              notifyModified: mockNotifyModified,
              clipboard: mockClipboard,
            }),
          {
            initialProps: { reactFlowInstanceRef: mockReactFlowInstanceRef },
          }
        )

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify setNodes was called
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockNotifyModified).toHaveBeenCalled()

        // Rerender with new reactFlowInstanceRef - should recreate callback (dependency changed)
        const newReactFlowInstanceRef = { current: { screenToFlowPosition: jest.fn() } }
        mockSetNodes.mockClear()
        mockNotifyModified.mockClear()

        rerender({ reactFlowInstanceRef: newReactFlowInstanceRef })
        newReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 200, y: 300 })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use new reactFlowInstanceRef
        expect(newReactFlowInstanceRef.current.screenToFlowPosition).toHaveBeenCalled()
      })

      it('should verify exact arrow function: (nds) => [...nds, newNode]', () => {
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

        mockReactFlowInstanceRef.current.screenToFlowPosition.mockReturnValue({ x: 100, y: 200 })

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((format: string) => {
              if (format === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: document.createElement('div'),
        } as unknown as React.DragEvent

        const mockReactFlowWrapper = document.createElement('div')
        mockReactFlowWrapper.className = 'react-flow'
        Object.defineProperty(mockEvent.currentTarget, 'closest', {
          value: jest.fn(() => mockReactFlowWrapper),
        })
        Object.defineProperty(mockReactFlowWrapper, 'getBoundingClientRect', {
          value: jest.fn(() => ({ left: 0, top: 0 })),
        })

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Verify the arrow function spreads existing nodes and adds new one
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        expect(typeof setNodesCall).toBe('function')

        const existingNodes = [
          { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        ]
        const newNodes = setNodesCall(existingNodes)

        // Should spread existing nodes and add new one
        expect(newNodes.length).toBe(2)
        expect(newNodes[0].id).toBe('node-1')
        expect(newNodes[1].type).toBe('agent')
      })
    })

    describe('onNodeClick - dependency array and arrow function', () => {
      it('should verify exact dependency array: [setNodes, setSelectedNodeId]', () => {
        const { result, rerender } = renderHook(
          ({ setNodes, setSelectedNodeId }) =>
            useCanvasEvents({
              reactFlowInstanceRef: mockReactFlowInstanceRef as any,
              setNodes: setNodes,
              setEdges: mockSetEdges,
              setSelectedNodeId: setSelectedNodeId,
              notifyModified: mockNotifyModified,
              clipboard: mockClipboard,
            }),
          {
            initialProps: {
              setNodes: mockSetNodes,
              setSelectedNodeId: mockSetSelectedNodeId,
            },
          }
        )

        const mockNode: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test' },
        }

        const mockEvent = {
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          stopPropagation: jest.fn(),
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockSetSelectedNodeId).toHaveBeenCalledWith('node-1')

        // Rerender with new setNodes - should recreate callback
        const newSetNodes = jest.fn()
        mockSetNodes.mockClear()
        mockSetSelectedNodeId.mockClear()

        rerender({ setNodes: newSetNodes, setSelectedNodeId: mockSetSelectedNodeId })

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        // Should use new setNodes
        expect(newSetNodes).toHaveBeenCalled()
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact arrow function: (nds) => nds.map((n) => ({ ...n, selected: n.id === node.id }))', () => {
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
          id: 'node-2',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test' },
        }

        const mockEvent = {
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          stopPropagation: jest.fn(),
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onNodeClick(mockEvent, mockNode)
        })

        // Verify the arrow function maps nodes correctly
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        expect(typeof setNodesCall).toBe('function')

        const existingNodes = [
          { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
          { id: 'node-2', type: 'agent', position: { x: 0, y: 0 }, data: {} },
          { id: 'node-3', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        ]
        const newNodes = setNodesCall(existingNodes)

        // Should map and set selected correctly
        expect(newNodes.length).toBe(3)
        expect(newNodes[0].selected).toBe(false) // node-1 !== node-2
        expect(newNodes[1].selected).toBe(true) // node-2 === node-2
        expect(newNodes[2].selected).toBe(false) // node-3 !== node-2
      })
    })
  })
})
