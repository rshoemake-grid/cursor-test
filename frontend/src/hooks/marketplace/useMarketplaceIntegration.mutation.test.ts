/**
 * Mutation tests to kill surviving mutants in useMarketplaceIntegration
 * Focuses on conditional expressions, logical operators, mathematical operations, and edge cases
 */

import { renderHook, act } from '@testing-library/react'
import { useMarketplaceIntegration } from './useMarketplaceIntegration'
import { logger } from '../../utils/logger'
import type { Node } from '@xyflow/react'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useMarketplaceIntegration - Mutation Killers', () => {
  let mockSetNodes: jest.Mock
  let mockNotifyModified: jest.Mock
  let mockSaveDraftsToStorage: jest.Mock
  let mockTabDraftsRef: React.MutableRefObject<Record<string, any>>
  let mockStorage: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockSetNodes = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater([])
      }
      return updater
    })
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
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Conditional expression edge cases', () => {
    describe('currentNodes.length > 0 vs === 0', () => {
      it('should verify exact boundary - length === 0', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test Agent' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        // Should use default startX = 250 (length === 0)
        expect(newNodes[0].position.x).toBe(250)
      })

      it('should verify exact boundary - length > 0', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test Agent' }]
        const existingNodes: Node[] = [
          { id: 'node-1', type: 'agent', position: { x: 100, y: 100 }, data: {} },
        ]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall
        // Should calculate startX from existing nodes (length > 0)
        expect(newNodes[newNodes.length - 1].position.x).toBe(300) // Math.max(100) + 200
      })
    })

    describe('pending.tabId === tabId && Date.now() - pending.timestamp < 10000', () => {
      it('should verify exact AND - both conditions true', () => {
        const pendingData = {
          tabId: 'tab-1', // Matches
          timestamp: Date.now() - 5000, // Less than 10000ms ago
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should add agents (both conditions true)
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
      })

      it('should verify exact AND - first true, second false', () => {
        const pendingData = {
          tabId: 'tab-1', // Matches
          timestamp: Date.now() - 15000, // More than 10000ms ago
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should not add agents (timestamp too old)
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
      })

      it('should verify exact AND - first false', () => {
        const pendingData = {
          tabId: 'tab-2', // Different tab
          timestamp: Date.now() - 5000,
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should not add agents (different tab)
        expect(mockSetNodes).not.toHaveBeenCalled()
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
      })
    })

    describe('checkCount >= maxChecks', () => {
      it('should verify exact boundary - checkCount === maxChecks', () => {
        mockStorage.getItem.mockReturnValue(null)

        const { unmount } = renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // Initial call on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Advance timers to trigger 10 interval checks (maxChecks = 10)
        act(() => {
          jest.advanceTimersByTime(10000) // 10 seconds = 10 interval checks
        })

        // Verify checkPendingAgents was called: 1 initial + 10 interval = 11 total
        expect(mockStorage.getItem).toHaveBeenCalledTimes(11)

        // Cleanup should clear interval
        unmount()

        // Advance more time - interval should be cleared
        act(() => {
          jest.advanceTimersByTime(2000)
        })

        // Should not call getItem after cleanup
        expect(mockStorage.getItem).toHaveBeenCalledTimes(11) // No new calls
      })

      it('should verify exact boundary - checkCount < maxChecks', () => {
        mockStorage.getItem.mockReturnValue(null)

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // Initial call on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Advance timers to trigger 5 interval checks (less than maxChecks)
        act(() => {
          jest.advanceTimersByTime(5000) // 5 seconds = 5 interval checks
        })

        // Should still be checking (checkCount < maxChecks)
        expect(mockStorage.getItem).toHaveBeenCalledTimes(6) // 1 initial + 5 interval checks
      })
    })
  })

  describe('Logical OR operators', () => {
    describe('agent.name || agent.label || "Agent Node"', () => {
      it('should verify OR chain - name exists', () => {
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

        const agents = [{ id: 'agent-1', name: 'Agent Name', label: 'Agent Label' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.label).toBe('Agent Name') // Uses name
      })

      it('should verify OR chain - name null, label exists', () => {
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

        const agents = [{ id: 'agent-1', name: null, label: 'Agent Label' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.label).toBe('Agent Label') // Uses label
      })

      it('should verify OR chain - name null, label null', () => {
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

        const agents = [{ id: 'agent-1', name: null, label: null }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.label).toBe('Agent Node') // Uses fallback
      })

      it('should verify OR chain - name undefined, label undefined', () => {
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

        const agents = [{ id: 'agent-1' }] // name and label missing

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.label).toBe('Agent Node') // Uses fallback
      })
    })

    describe('agent.description || ""', () => {
      it('should verify OR operator - description is null', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test', description: null }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.description).toBe('') // Uses empty string fallback
      })

      it('should verify OR operator - description is undefined', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test' }] // description missing

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.description).toBe('') // Uses empty string fallback
      })

      it('should verify OR operator - description is empty string', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test', description: '' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.description).toBe('') // Uses empty string (falsy but still string)
      })
    })

    describe('agent.agent_config || {}', () => {
      it('should verify OR operator - agent_config is null', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test', agent_config: null }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.agent_config).toEqual({}) // Uses empty object fallback
      })

      it('should verify OR operator - agent_config is undefined', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test' }] // agent_config missing

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        expect(newNodes[0].data.agent_config).toEqual({}) // Uses empty object fallback
      })
    })

    describe('currentDraft?.edges || []', () => {
      it('should verify OR operator - currentDraft is null', () => {
        mockTabDraftsRef.current['tab-1'] = null as any

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

        const agents = [{ id: 'agent-1', name: 'Test' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Should use empty array fallback for edges
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
        const savedDraft = mockTabDraftsRef.current['tab-1']
        expect(savedDraft.edges).toEqual([])
      })

      it('should verify OR operator - currentDraft exists but edges missing', () => {
        mockTabDraftsRef.current['tab-1'] = {
          nodes: [],
          // edges missing
          workflowId: null,
          workflowName: 'Test',
          workflowDescription: 'Test',
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

        const agents = [{ id: 'agent-1', name: 'Test' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Should use empty array fallback for edges
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
        const savedDraft = mockTabDraftsRef.current['tab-1']
        expect(savedDraft.edges).toEqual([])
      })
    })
  })

  describe('Optional chaining', () => {
    describe('currentDraft?.edges', () => {
      it('should verify optional chaining - currentDraft is null', () => {
        mockTabDraftsRef.current['tab-1'] = null as any

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

        const agents = [{ id: 'agent-1', name: 'Test' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Should handle null gracefully (optional chaining)
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
      })

      it('should verify optional chaining - currentDraft exists', () => {
        mockTabDraftsRef.current['tab-1'] = {
          nodes: [],
          edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
          workflowId: null,
          workflowName: 'Test',
          workflowDescription: 'Test',
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

        const agents = [{ id: 'agent-1', name: 'Test' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        // Advance timers to trigger setTimeout
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Should use existing edges
        expect(mockSaveDraftsToStorage).toHaveBeenCalled()
        const savedDraft = mockTabDraftsRef.current['tab-1']
        expect(savedDraft.edges).toHaveLength(1)
      })
    })
  })

  describe('Mathematical operations', () => {
    describe('Math.max(...currentNodes.map(n => n.position.x))', () => {
      it('should verify empty array edge case', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test' }]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall([]) : setNodesCall
        // Should use default startX = 250 when array is empty
        expect(newNodes[0].position.x).toBe(250)
      })

      it('should verify Math.max with multiple nodes', () => {
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

        const agents = [{ id: 'agent-1', name: 'Test' }]
        const existingNodes: Node[] = [
          { id: 'node-1', type: 'agent', position: { x: 100, y: 100 }, data: {} },
          { id: 'node-2', type: 'agent', position: { x: 300, y: 200 }, data: {} },
          { id: 'node-3', type: 'agent', position: { x: 200, y: 300 }, data: {} },
        ]

        act(() => {
          result.current.addAgentsToCanvas(agents)
        })

        expect(mockSetNodes).toHaveBeenCalled()
        const setNodesCall = mockSetNodes.mock.calls[0][0]
        const newNodes = typeof setNodesCall === 'function' ? setNodesCall(existingNodes) : setNodesCall
        // Should use Math.max(100, 300, 200) + 200 = 500
        expect(newNodes[newNodes.length - 1].position.x).toBe(500)
      })
    })
  })

  describe('Comparison operators', () => {
    describe('pending.tabId !== tabId', () => {
      it('should verify exact comparison - tabId does not match', () => {
        const pendingData = {
          tabId: 'tab-2', // Different tab
          timestamp: Date.now() - 5000,
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should clear storage (tabId !== tabId)
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
        // Should not add agents
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact comparison - tabId matches', () => {
        const pendingData = {
          tabId: 'tab-1', // Matches
          timestamp: Date.now() - 5000,
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should add agents (tabId matches)
        expect(mockSetNodes).toHaveBeenCalled()
      })
    })

    describe('Date.now() - pending.timestamp >= 10000', () => {
      it('should verify exact boundary - exactly 10000ms', () => {
        const pendingData = {
          tabId: 'tab-1',
          timestamp: Date.now() - 10000, // Exactly 10000ms ago
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should clear storage (timestamp >= 10000)
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
        // Should not add agents (too old)
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify exact boundary - less than 10000ms', () => {
        const pendingData = {
          tabId: 'tab-1',
          timestamp: Date.now() - 9999, // Just under 10000ms
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should add agents (timestamp < 10000)
        expect(mockSetNodes).toHaveBeenCalled()
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
      })
    })
  })

  describe('Type checks', () => {
    describe('typeof window !== "undefined"', () => {
      it('should verify exact type check - window is defined', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        const { unmount } = renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // Should add event listener (window is defined)
        expect(addEventListenerSpy).toHaveBeenCalledWith('addAgentsToWorkflow', expect.any(Function))

        unmount()

        // Should remove event listener
        expect(removeEventListenerSpy).toHaveBeenCalledWith('addAgentsToWorkflow', expect.any(Function))

        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
      })
    })
  })

  describe('Error handling', () => {
    describe('JSON.parse error handling', () => {
      it('should verify error handling - JSON.parse throws SyntaxError', () => {
        mockStorage.getItem.mockReturnValue('invalid json')

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents is called immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should handle error gracefully
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Failed to process pending agents:',
          expect.any(SyntaxError)
        )
        // Should clear storage on error
        expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingAgentsToAdd')
      })

      it('should verify error handling - storage.removeItem when storage is null in catch', () => {
        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: null, // Storage is null
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

        // This test verifies the code path exists
        // When storage is null, checkPendingAgents returns early
        // So JSON.parse error won't occur, but we verify the null check
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Should not throw (storage is null, early return)
        expect(mockLoggerError).not.toHaveBeenCalled()
      })
    })
  })

  describe('Object property access', () => {
    describe('pending.tabId - property missing vs null vs undefined', () => {
      it('should verify property access - tabId is missing', () => {
        const pendingData = {
          // tabId missing
          timestamp: Date.now() - 5000,
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents runs immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should handle missing property gracefully
        // pending.tabId === undefined, so !== tabId check fails, but timestamp check also fails
        // Code should handle undefined gracefully
        expect(mockSetNodes).not.toHaveBeenCalled()
      })

      it('should verify property access - tabId is null', () => {
        const pendingData = {
          tabId: null,
          timestamp: Date.now() - 5000,
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents runs immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should handle null property gracefully
        expect(mockSetNodes).not.toHaveBeenCalled()
      })
    })

    describe('pending.timestamp - property missing vs null vs undefined', () => {
      it('should verify property access - timestamp is missing', () => {
        const pendingData = {
          tabId: 'tab-1',
          // timestamp missing
          agents: [{ id: 'agent-1', name: 'Test Agent' }],
        }

        mockStorage.getItem.mockReturnValue(JSON.stringify(pendingData))

        renderHook(() =>
          useMarketplaceIntegration({
            tabId: 'tab-1',
            storage: mockStorage,
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

        // checkPendingAgents runs immediately on mount
        act(() => {
          jest.advanceTimersByTime(0)
        })

        // Should handle missing timestamp gracefully
        // Date.now() - undefined = NaN, which is not < 10000
        expect(mockSetNodes).not.toHaveBeenCalled()
      })
    })
  })
})
