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
  })
})
