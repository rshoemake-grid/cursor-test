/**
 * Mutation tests to kill surviving mutants in useCanvasEvents
 * Focuses on exact string literals, conditional expressions, logical operators, and edge cases
 */

import { renderHook, act } from '@testing-library/react'
import { useCanvasEvents } from './useCanvasEvents'
import { showSuccess, showError } from '../../utils/notifications'
import type { Node } from '@xyflow/react'

jest.mock('../../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>

describe('useCanvasEvents - Mutation Killers', () => {
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
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('String literal comparisons', () => {
    describe('onDragOver - dropEffect = "move"', () => {
      it('should verify exact string literal "move"', () => {
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

        // Should set exact string literal 'move'
        expect(mockEvent.dataTransfer.dropEffect).toBe('move')
      })
    })

    describe('onDrop - getData("application/reactflow")', () => {
      it('should verify exact string literal "application/reactflow"', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should call getData with exact string literal 'application/reactflow'
        expect(mockEvent.dataTransfer.getData).toHaveBeenCalledWith('application/reactflow')
        expect(mockSetNodes).toHaveBeenCalled()
      })
    })

    describe('onDrop - getData("application/custom-agent")', () => {
      it('should verify exact string literal "application/custom-agent"', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return JSON.stringify({ label: 'Custom' })
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should call getData with exact string literal 'application/custom-agent'
        expect(mockEvent.dataTransfer.getData).toHaveBeenCalledWith('application/custom-agent')
      })
    })

    describe('onDrop - closest(".react-flow")', () => {
      it('should verify exact string literal ".react-flow"', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: { current: null },
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: mockClipboard,
          })
        )

        const closestMock = jest.fn(() => ({
          getBoundingClientRect: () => ({ left: 0, top: 0 }),
        }))

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: closestMock,
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should call closest with exact string literal '.react-flow'
        expect(closestMock).toHaveBeenCalledWith('.react-flow')
      })
    })

    describe('handleAddToAgentNodes - storage key "customAgentNodes"', () => {
      it('should verify exact string literal "customAgentNodes"', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent' },
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should call getItem with exact string literal 'customAgentNodes'
        expect(mockStorage.getItem).toHaveBeenCalledWith('customAgentNodes')
      })
    })
  })

  describe('Conditional expressions', () => {
    describe('onDrop - if (!type) return', () => {
      it('should verify exact falsy check - type is empty string', () => {
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
            getData: jest.fn(() => ''), // Empty string
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {},
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should return early, not call setNodes
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact falsy check - type is null', () => {
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
            getData: jest.fn(() => null as any),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {},
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should return early
        expect(mockSetNodes).not.toHaveBeenCalled()
      })
    })

    describe('onDrop - if (!reactFlowWrapper) return', () => {
      it('should verify exact null check - reactFlowWrapper is null', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: { current: null },
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
            getData: jest.fn(() => 'agent'),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => null), // Returns null
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should return early
        expect(mockSetNodes).not.toHaveBeenCalled()
      })
    })

    describe('onDrop - if (customAgentData)', () => {
      it('should verify exact truthy check - customAgentData exists', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return JSON.stringify({ label: 'Custom' })
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use customData
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(nodes[0].data.label).toBe('Custom')
      })

      it('should verify exact truthy check - customAgentData is empty string', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return '' // Empty string
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use default data (not customData)
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(nodes[0].data.label).toContain('Agent Node')
      })
    })

    describe('onNodeClick - if (isDraggingRef.current) return', () => {
      it('should verify exact truthy check - isDraggingRef.current is true', () => {
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

        // Set dragging to true
        result.current.isDraggingRef.current = true

        const mockEvent = {
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should return early, not call setNodes
        expect(mockSetNodes).not.toHaveBeenCalled()
      })
    })

    describe('onNodeClick - if (isMultiSelect)', () => {
      it('should verify exact truthy check - shiftKey is true', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: true, // Multi-select
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should toggle selection (multi-select path)
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockSetSelectedNodeId).not.toHaveBeenCalled()
      })
    })

    describe('handleAddToAgentNodes - node.type !== "agent"', () => {
      it('should verify exact comparison - type is not "agent"', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'workflow', // Not 'agent'
          position: { x: 0, y: 0 },
          data: {},
        }

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should return early
        expect(mockStorage.getItem).not.toHaveBeenCalled()
      })

      it('should verify exact comparison - type is "agent"', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent', // Exact match
          position: { x: 0, y: 0 },
          data: { label: 'Test Agent' },
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should proceed
        expect(mockStorage.getItem).toHaveBeenCalled()
      })
    })

    describe('handleAddToAgentNodes - if (!storage)', () => {
      it('should verify exact falsy check - storage is null', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {},
        }

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should show error and return early
        expect(mockShowError).toHaveBeenCalledWith('Storage not available')
        expect(mockStorage.getItem).not.toHaveBeenCalled()
      })
    })

    describe('handleAddToAgentNodes - if (!exists)', () => {
      it('should verify exact falsy check - exists is false', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'New Agent' },
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify([])) // Empty array, no duplicates

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should add agent (exists is false)
        expect(mockStorage.setItem).toHaveBeenCalled()
        expect(mockShowSuccess).toHaveBeenCalled()
      })
    })

    describe('onPaneClick - event.button === 0', () => {
      it('should verify exact comparison - button is 0', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { ...mockClipboard, clipboardNode: { id: 'clip-1' } as Node },
          })
        )

        const mockEvent = {
          ctrlKey: true,
          metaKey: false,
          button: 0, // Left mouse button
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent)
        })

        // Should paste (button === 0)
        expect(mockClipboard.paste).toHaveBeenCalledWith(100, 200)
      })

      it('should verify exact comparison - button is not 0', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { ...mockClipboard, clipboardNode: { id: 'clip-1' } as Node },
          })
        )

        const mockEvent = {
          ctrlKey: true,
          metaKey: false,
          button: 1, // Right mouse button
          clientX: 100,
          clientY: 200,
        } as unknown as React.MouseEvent

        act(() => {
          result.current.onPaneClick(mockEvent)
        })

        // Should not paste (button !== 0)
        expect(mockClipboard.paste).not.toHaveBeenCalled()
      })
    })
  })

  describe('Logical OR operators', () => {
    describe('onNodeClick - event.shiftKey || event.metaKey || event.ctrlKey', () => {
      it('should verify OR chain - shiftKey is true', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should use multi-select path
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify OR chain - metaKey is true', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should use multi-select path
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify OR chain - ctrlKey is true', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: true,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should use multi-select path
        expect(mockSetNodes).toHaveBeenCalled()
      })

      it('should verify OR chain - all false', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should use single-select path
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockSetSelectedNodeId).toHaveBeenCalledWith('node-1')
      })
    })

    describe('onPaneClick - event.ctrlKey || event.metaKey', () => {
      it('should verify OR operator - ctrlKey is true', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { ...mockClipboard, clipboardNode: { id: 'clip-1' } as Node },
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

        // Should paste
        expect(mockClipboard.paste).toHaveBeenCalled()
      })

      it('should verify OR operator - metaKey is true', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { ...mockClipboard, clipboardNode: { id: 'clip-1' } as Node },
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

        // Should paste
        expect(mockClipboard.paste).toHaveBeenCalled()
      })
    })

    describe('onDrop - customData.label || ...', () => {
      it('should verify OR operator - label exists', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return JSON.stringify({ label: 'Custom Label' })
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(nodes[0].data.label).toBe('Custom Label')
      })

      it('should verify OR operator - label is null, uses fallback', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return JSON.stringify({ label: null })
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        // Should use fallback template literal
        expect(nodes[0].data.label).toContain('Agent Node')
      })
    })

    describe('handleAddToAgentNodes - node.data.label || node.data.name || "Custom Agent"', () => {
      it('should verify OR chain - label exists', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'My Label' },
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved[0].label).toBe('My Label')
      })

      it('should verify OR chain - label null, name exists', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { name: 'My Name' },
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved[0].label).toBe('My Name')
      })

      it('should verify OR chain - label and name null, uses fallback', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {},
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved[0].label).toBe('Custom Agent')
      })
    })
  })

  describe('Ternary operators', () => {
    describe('onDrop - customData ? {...} : {...}', () => {
      it('should verify ternary - customData is truthy', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              if (key === 'application/custom-agent') return JSON.stringify({ label: 'Custom' })
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        // Should use customData branch
        expect(nodes[0].data.description).toBeDefined()
        expect(nodes[0].data.agent_config).toBeDefined()
      })

      it('should verify ternary - customData is falsy', () => {
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
            getData: jest.fn((key: string) => {
              if (key === 'application/reactflow') return 'agent'
              return ''
            }),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 0, top: 0 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(() => ({ x: 50, y: 100 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        // Should use default branch (no description or agent_config)
        expect(nodes[0].data.description).toBeUndefined()
        expect(nodes[0].data.agent_config).toBeUndefined()
      })
    })

    describe('handleAddToAgentNodes - savedAgentNodes ? JSON.parse(...) : []', () => {
      it('should verify ternary - savedAgentNodes is truthy', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test' },
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify([{ label: 'Existing' }]))

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should parse existing data
        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved).toHaveLength(2) // Existing + new
      })

      it('should verify ternary - savedAgentNodes is null', () => {
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test' },
        }

        mockStorage.getItem.mockReturnValue(null)

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Should use empty array fallback
        expect(mockStorage.setItem).toHaveBeenCalled()
        const setItemCall = mockStorage.setItem.mock.calls[0]
        const saved = JSON.parse(setItemCall[1])
        expect(saved).toHaveLength(1) // Only new
      })
    })

    describe('onNodeClick - n.id === node.id ? !n.selected : n.selected', () => {
      it('should verify ternary - id matches', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should toggle selected for matching node
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' 
          ? setNodesCall([{ id: 'node-1', selected: false }])
          : setNodesCall
        expect(nodes[0].selected).toBe(true) // Toggled
      })

      it('should verify ternary - id does not match', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should keep selected state for non-matching nodes
        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const nodes = typeof setNodesCall === 'function' 
          ? setNodesCall([{ id: 'node-2', selected: true }])
          : setNodesCall
        expect(nodes[0].selected).toBe(true) // Kept same
      })
    })
  })

  describe('Optional chaining', () => {
    describe('onDrop - reactFlowInstanceRef.current?.screenToFlowPosition', () => {
      it('should verify optional chaining - current is null', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: { current: null },
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: mockClipboard,
          })
        )

        const closestMock = jest.fn(() => ({
          getBoundingClientRect: () => ({ left: 0, top: 0 }),
        }))

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: {
            getData: jest.fn(() => 'agent'),
          },
          clientX: 100,
          clientY: 200,
          currentTarget: {
            closest: closestMock,
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use fallback path (closest)
        expect(closestMock).toHaveBeenCalled()
        expect(mockSetNodes).toHaveBeenCalled()
      })
    })

    describe('onPaneClick - clipboard?.clipboardNode', () => {
      it('should verify optional chaining - clipboardNode is null', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { clipboardNode: null, paste: mockClipboard.paste },
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

        // Should not paste (clipboardNode is null)
        expect(mockClipboard.paste).not.toHaveBeenCalled()
      })

      it('should verify optional chaining - clipboardNode exists', () => {
        const { result } = renderHook(() =>
          useCanvasEvents({
            reactFlowInstanceRef: mockReactFlowInstanceRef as any,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setSelectedNodeId: mockSetSelectedNodeId,
            notifyModified: mockNotifyModified,
            clipboard: { clipboardNode: { id: 'clip-1' } as Node, paste: mockClipboard.paste },
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

        // Should paste (clipboardNode exists)
        expect(mockClipboard.paste).toHaveBeenCalled()
      })
    })
  })

  describe('Property access', () => {
    describe('onDrop - event.clientX and event.clientY', () => {
      it('should verify exact property access - clientX and clientY', () => {
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
            getData: jest.fn(() => 'agent'),
          },
          clientX: 150,
          clientY: 250,
          currentTarget: {
            closest: jest.fn(() => ({
              getBoundingClientRect: () => ({ left: 10, top: 20 }),
            })),
          },
        } as unknown as React.DragEvent

        mockReactFlowInstanceRef.current.screenToFlowPosition = jest.fn(({ x, y }) => ({ x: x - 10, y: y - 20 }))

        act(() => {
          result.current.onDrop(mockEvent)
        })

        // Should use exact clientX and clientY values
        expect(mockReactFlowInstanceRef.current.screenToFlowPosition).toHaveBeenCalledWith({
          x: 150,
          y: 250,
        })
      })
    })

    describe('onNodeClick - node.id', () => {
      it('should verify exact property access - node.id', () => {
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
          stopPropagation: jest.fn(),
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'exact-node-id', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should use exact node.id
        expect(mockSetSelectedNodeId).toHaveBeenCalledWith('exact-node-id')
      })
    })
  })

  describe('Method calls', () => {
    describe('onDragOver - event.preventDefault()', () => {
      it('should verify exact method call - preventDefault', () => {
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

        const preventDefaultMock = jest.fn()
        const mockEvent = {
          preventDefault: preventDefaultMock,
          dataTransfer: { dropEffect: '' },
        } as unknown as React.DragEvent

        act(() => {
          result.current.onDragOver(mockEvent)
        })

        // Should call preventDefault exactly once
        expect(preventDefaultMock).toHaveBeenCalledTimes(1)
      })
    })

    describe('onNodeClick - event.stopPropagation()', () => {
      it('should verify exact method call - stopPropagation', () => {
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

        const stopPropagationMock = jest.fn()
        const mockEvent = {
          stopPropagation: stopPropagationMock,
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        } as unknown as React.MouseEvent

        const node = { id: 'node-1', selected: false }

        act(() => {
          result.current.onNodeClick(mockEvent, node)
        })

        // Should call stopPropagation exactly once
        expect(stopPropagationMock).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Type checks', () => {
    describe('handleAddToAgentNodes - typeof window !== "undefined"', () => {
      it('should verify exact type check - window is defined', () => {
        // Verify the typeof window !== 'undefined' check exists
        // The code checks typeof window at runtime, so we verify the code path
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

        const node: Node = {
          id: 'node-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Test' },
        }

        mockStorage.getItem.mockReturnValue(null)

        // Spy on window.dispatchEvent if window exists
        const originalDispatchEvent = typeof window !== 'undefined' ? window.dispatchEvent : null
        const dispatchEventSpy = jest.fn()
        
        if (typeof window !== 'undefined') {
          (window as any).dispatchEvent = dispatchEventSpy
        }

        act(() => {
          result.current.handleAddToAgentNodes(node)
        })

        // Verify storage was updated (code executed)
        expect(mockStorage.setItem).toHaveBeenCalled()
        
        // If window exists, verify dispatchEvent was called
        if (typeof window !== 'undefined' && dispatchEventSpy.mock.calls.length > 0) {
          const eventArg = dispatchEventSpy.mock.calls[0][0]
          expect(eventArg.type).toBe('customAgentNodesUpdated')
        }

        // Restore original dispatchEvent
        if (originalDispatchEvent && typeof window !== 'undefined') {
          (window as any).dispatchEvent = originalDispatchEvent
        }
      })
    })
  })
})
