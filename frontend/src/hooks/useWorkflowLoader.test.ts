/**
 * Tests for useWorkflowLoader hook
 */

import { renderHook, act } from '@testing-library/react'
import { useWorkflowLoader } from './useWorkflowLoader'
import { api } from '../api/client'
import { logger } from '../utils/logger'
import { initializeReactFlowNodes, formatEdgesForReactFlow } from '../utils/workflowFormat'
import type { Node, Edge } from '@xyflow/react'

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    getWorkflow: jest.fn(),
  }
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock workflow format utilities
jest.mock('../utils/workflowFormat', () => ({
  initializeReactFlowNodes: jest.fn((nodes: Node[]) => nodes),
  formatEdgesForReactFlow: jest.fn((edges: Edge[]) => edges),
}))

describe('useWorkflowLoader', () => {
  const mockSetNodes = jest.fn()
  const mockSetEdges = jest.fn()
  const mockSetLocalWorkflowId = jest.fn()
  const mockSetLocalWorkflowName = jest.fn()
  const mockSetLocalWorkflowDescription = jest.fn()
  const mockSetVariables = jest.fn()
  const mockSetSelectedNodeId = jest.fn()
  const mockWorkflowNodeToNode = jest.fn((wfNode: any) => ({
    id: wfNode.id,
    type: wfNode.type,
    data: wfNode.data || {},
    position: { x: 0, y: 0 },
  }))
  const mockOnWorkflowLoaded = jest.fn()
  const mockIsLoadingRef = { current: false }
  const mockLastLoadedWorkflowIdRef = { current: null }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockIsLoadingRef.current = false
    mockLastLoadedWorkflowIdRef.current = null
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('workflow loading', () => {
    it('should not load if workflowId is null', () => {
      renderHook(() =>
        useWorkflowLoader({
          workflowId: null,
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      expect(api.getWorkflow).not.toHaveBeenCalled()
      expect(mockLastLoadedWorkflowIdRef.current).toBeNull()
      expect(mockIsLoadingRef.current).toBe(false)
    })

    it('should not load if workflowId matches lastLoadedWorkflowId', () => {
      mockLastLoadedWorkflowIdRef.current = 'workflow-1'

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should not load if tabIsUnsaved is true', () => {
      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: true,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      expect(api.getWorkflow).not.toHaveBeenCalled()
    })

    it('should load workflow successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [
          { id: 'node-1', type: 'agent', data: {} },
          { id: 'node-2', type: 'condition', data: {} },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
        ],
        variables: { var1: 'value1' },
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      // Wait for async operation
      await act(async () => {
        await Promise.resolve()
      })

      expect(api.getWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(mockSetLocalWorkflowId).toHaveBeenCalledWith('workflow-1')
      expect(mockSetLocalWorkflowName).toHaveBeenCalledWith('Test Workflow')
      expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith('Test Description')
      expect(mockSetVariables).toHaveBeenCalledWith({ var1: 'value1' })
      expect(mockWorkflowNodeToNode).toHaveBeenCalledTimes(2)
      expect(initializeReactFlowNodes).toHaveBeenCalled()
      expect(formatEdgesForReactFlow).toHaveBeenCalledWith(mockWorkflow.edges)
      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
      expect(mockLastLoadedWorkflowIdRef.current).toBe('workflow-1')
    })

    it('should set isLoadingRef to true during loading', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: [],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      // isLoadingRef should be set to true immediately
      expect(mockIsLoadingRef.current).toBe(true)

      await act(async () => {
        await Promise.resolve()
      })

      // Advance timers to trigger setTimeout that sets isLoadingRef to false
      act(() => {
        jest.advanceTimersByTime(100)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockIsLoadingRef.current).toBe(false)
    })

    it('should handle workflow with empty description', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        nodes: [],
        edges: [],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith('')
    })

    it('should handle workflow with null variables', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: [],
        variables: null,
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetVariables).toHaveBeenCalledWith({})
    })

    it('should handle workflow with undefined edges', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: undefined,
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(formatEdgesForReactFlow).toHaveBeenCalledWith([])
    })

    it('should set edges after delay', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      // Edges should not be set immediately
      expect(mockSetEdges).not.toHaveBeenCalled()

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(50)
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('should call onWorkflowLoaded callback when provided', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: [],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockOnWorkflowLoaded).toHaveBeenCalledWith('workflow-1', 'Test Workflow')
    })

    it('should not call onWorkflowLoaded when not provided', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [],
        edges: [],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: undefined,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      // Should not throw error when onWorkflowLoaded is undefined
      expect(api.getWorkflow).toHaveBeenCalled()
    })

    it('should handle API error', async () => {
      const error = new Error('Failed to load workflow')
      ;(api.getWorkflow as jest.Mock).mockRejectedValue(error)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith('Failed to load workflow:', error)
      expect(mockIsLoadingRef.current).toBe(false)
    })

    it('should log loaded nodes', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: '',
        nodes: [
          { id: 'node-1', type: 'agent', data: {} },
          { id: 'node-2', type: 'condition', data: {} },
        ],
        edges: [],
        variables: {},
      }

      ;(api.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)

      renderHook(() =>
        useWorkflowLoader({
          workflowId: 'workflow-1',
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        'Loaded nodes:',
        expect.arrayContaining([
          expect.objectContaining({ id: 'node-1', type: 'agent' }),
          expect.objectContaining({ id: 'node-2', type: 'condition' }),
        ])
      )
    })

    it('should reset lastLoadedWorkflowIdRef when workflowId is null', () => {
      mockLastLoadedWorkflowIdRef.current = 'workflow-1'

      renderHook(() =>
        useWorkflowLoader({
          workflowId: null,
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        })
      )

      expect(mockLastLoadedWorkflowIdRef.current).toBeNull()
      expect(mockIsLoadingRef.current).toBe(false)
    })
  })
})
