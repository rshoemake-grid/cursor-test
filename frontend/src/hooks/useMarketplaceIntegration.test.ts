import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketplaceIntegration } from './useMarketplaceIntegration'
import { logger } from '../utils/logger'
import type { Node } from '@xyflow/react'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}))

const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>

describe('useMarketplaceIntegration', () => {
  let mockSetNodes: jest.Mock
  let mockNotifyModified: jest.Mock
  let mockSaveDraftsToStorage: jest.Mock
  let mockTabDraftsRef: React.MutableRefObject<Record<string, any>>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockSetNodes = jest.fn()
    mockNotifyModified = jest.fn()
    mockSaveDraftsToStorage = jest.fn()
    mockTabDraftsRef = {
      current: {
        'tab-1': {
          nodes: [],
          edges: [],
          workflowId: null,
          workflowName: 'Test Workflow',
          workflowDescription: 'Test Description',
          isUnsaved: false,
        },
      },
    }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('addAgentsToCanvas', () => {
    it('should add agents to canvas', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Test Description',
          agent_config: { model: 'gpt-4' },
        },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      expect(mockSetNodes).toHaveBeenCalled()
      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes).toHaveLength(1)
      expect(newNodes[0].type).toBe('agent')
      expect(newNodes[0].data.label).toBe('Test Agent')
    })

    it('should position agents when no existing nodes', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        { id: 'agent-1', name: 'Agent 1' },
        { id: 'agent-2', name: 'Agent 2' },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes[0].position.x).toBe(250)
      expect(newNodes[0].position.y).toBe(250)
      expect(newNodes[1].position.y).toBe(400) // 250 + 150
    })

    it('should position agents after existing nodes', () => {
      const existingNodes: Node[] = [
        {
          id: 'node-1',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: {},
        },
        {
          id: 'node-2',
          type: 'agent',
          position: { x: 500, y: 200 },
          data: {},
        },
      ]

      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [{ id: 'agent-1', name: 'Agent 1' }]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall
      // Should be positioned after max x (500) + 200 = 700
      expect(newNodes[newNodes.length - 1].position.x).toBe(700)
    })

    it('should use label when name is not available', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        {
          id: 'agent-1',
          label: 'Agent Label',
          description: 'Test Description',
        },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes[0].data.label).toBe('Agent Label')
      expect(newNodes[0].data.name).toBe('Agent Label')
    })

    it('should use fallback label when neither name nor label available', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        {
          id: 'agent-1',
          agent_config: {},
        },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes[0].data.label).toBe('Agent Node')
      expect(newNodes[0].data.name).toBe('Agent Node')
    })

    it('should update draft storage after adding agents', async () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: 'workflow-1',
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: true,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          agent_config: {},
        },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
        jest.advanceTimersByTime(0)
      })

      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
      })

      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0]
      expect(savedDrafts['tab-1'].nodes.length).toBeGreaterThan(0)
      expect(savedDrafts['tab-1'].workflowId).toBe('workflow-1')
      expect(savedDrafts['tab-1'].isUnsaved).toBe(true)
    })

    it('should preserve existing edges in draft', async () => {
      mockTabDraftsRef.current['tab-1'] = {
        nodes: [],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
        workflowId: null,
        workflowName: 'Test Workflow',
        workflowDescription: 'Test Description',
        isUnsaved: false,
      }

      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [{ id: 'agent-1', name: 'Test Agent', agent_config: {} }]

      act(() => {
        result.current.addAgentsToCanvas(agents)
        jest.advanceTimersByTime(0)
      })

      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
      })

      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0]
      expect(savedDrafts['tab-1'].edges).toHaveLength(1)
      expect(savedDrafts['tab-1'].edges[0].id).toBe('edge-1')
    })

    it('should call notifyModified', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [{ id: 'agent-1', name: 'Test Agent', agent_config: {} }]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      expect(mockNotifyModified).toHaveBeenCalled()
    })

    it('should set isAddingAgentsRef flag', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [{ id: 'agent-1', name: 'Test Agent', agent_config: {} }]

      act(() => {
        result.current.addAgentsToCanvas(agents)
        expect(result.current.isAddingAgentsRef.current).toBe(true)
        jest.advanceTimersByTime(100)
      })

      expect(result.current.isAddingAgentsRef.current).toBe(false)
    })

    it('should handle empty agents array', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      act(() => {
        result.current.addAgentsToCanvas([])
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes).toHaveLength(0)
    })

    it('should handle multiple agents with proper spacing', () => {
      const { result } = renderHook(() =>
        useMarketplaceIntegration({
          tabId: 'tab-1',
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage,
        })
      )

      const agents = [
        { id: 'agent-1', name: 'Agent 1', agent_config: {} },
        { id: 'agent-2', name: 'Agent 2', agent_config: {} },
        { id: 'agent-3', name: 'Agent 3', agent_config: {} },
      ]

      act(() => {
        result.current.addAgentsToCanvas(agents)
      })

      const setNodesCall = mockSetNodes.mock.calls[0][0]
      const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
      expect(newNodes).toHaveLength(3)
      expect(newNodes[0].position.y).toBe(250)
      expect(newNodes[1].position.y).toBe(400) // 250 + 150
      expect(newNodes[2].position.y).toBe(550) // 250 + 300
    })

    it('should use current state values in draft update', async () => {
      const { result, rerender } = renderHook(
        ({ localWorkflowId, localWorkflowName, tabIsUnsaved }) =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId,
            localWorkflowName,
            localWorkflowDescription: 'Test Description',
            tabIsUnsaved,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage,
          }),
        {
          initialProps: {
            localWorkflowId: null,
            localWorkflowName: 'Initial Name',
            tabIsUnsaved: false,
          },
        }
      )

      // Update props
      rerender({
        localWorkflowId: 'workflow-1',
        localWorkflowName: 'Updated Name',
        tabIsUnsaved: true,
      })

      const agents = [{ id: 'agent-1', name: 'Test Agent', agent_config: {} }]

      act(() => {
        result.current.addAgentsToCanvas(agents)
        jest.advanceTimersByTime(0)
      })

      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
      })

      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0]
      expect(savedDrafts['tab-1'].workflowId).toBe('workflow-1')
      expect(savedDrafts['tab-1'].workflowName).toBe('Updated Name')
      expect(savedDrafts['tab-1'].isUnsaved).toBe(true)
    })
  })
})
