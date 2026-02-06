/**
 * Marketplace Actions Hook Tests
 * Tests for action operations hook to ensure proper functionality
 */

import { renderHook, act } from '@testing-library/react'
import { useMarketplaceActions } from './useMarketplaceActions'
import { showError, showSuccess } from '../../utils/notifications'
import { STORAGE_KEYS } from '../../config/constants'
import { PENDING_AGENTS_STORAGE_KEY } from '../utils/marketplaceConstants'
import { MARKETPLACE_EVENTS } from '../utils/marketplaceEventConstants'
import { MARKETPLACE_TABS, REPOSITORY_SUB_TABS } from './useMarketplaceTabs'

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>

describe('useMarketplaceActions', () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }

  const mockUseTemplate = jest.fn()
  const mockDeleteSelectedAgents = jest.fn()
  const mockDeleteSelectedWorkflows = jest.fn()
  const mockDeleteSelectedRepositoryAgents = jest.fn()
  const mockFetchRepositoryAgents = jest.fn()

  const mockTemplateSelection = {
    selectedIds: new Set<string>(),
    clear: jest.fn(),
  }

  const mockAgentSelection = {
    selectedIds: new Set<string>(),
    get size() {
      return this.selectedIds.size
    },
    clear: jest.fn(),
  }

  const mockRepositoryAgentSelection = {
    selectedIds: new Set<string>(),
    get size() {
      return this.selectedIds.size
    },
    clear: jest.fn(),
  }

  const mockAgents = [
    { id: 'agent-1', name: 'Agent 1' },
    { id: 'agent-2', name: 'Agent 2' },
  ]

  const mockRepositoryAgents = [
    { id: 'repo-agent-1', name: 'Repo Agent 1' },
    { id: 'repo-agent-2', name: 'Repo Agent 2' },
  ]

  const defaultOptions = {
    activeTab: MARKETPLACE_TABS.AGENTS,
    repositorySubTab: REPOSITORY_SUB_TABS.WORKFLOWS,
    templateSelection: mockTemplateSelection,
    agentSelection: mockAgentSelection,
    repositoryAgentSelection: mockRepositoryAgentSelection,
    agents: mockAgents,
    repositoryAgents: mockRepositoryAgents,
    storage: mockStorage as any,
    useTemplate: mockUseTemplate,
    deleteSelectedAgents: mockDeleteSelectedAgents,
    deleteSelectedWorkflows: mockDeleteSelectedWorkflows,
    deleteSelectedRepositoryAgents: mockDeleteSelectedRepositoryAgents,
    fetchRepositoryAgents: mockFetchRepositoryAgents,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockTemplateSelection.selectedIds.clear()
    mockAgentSelection.selectedIds.clear()
    mockRepositoryAgentSelection.selectedIds.clear()
    mockTemplateSelection.clear.mockClear()
    mockAgentSelection.clear.mockClear()
    mockRepositoryAgentSelection.clear.mockClear()
    mockStorage.getItem.mockReset()
    mockStorage.setItem.mockReset()
    jest.useFakeTimers()
  })

  afterEach(async () => {
    // Run all pending timers to ensure setTimeout callbacks complete
    // This prevents timeouts in mutation testing when async operations are mutated
    // Advance timers multiple times to ensure async operations complete
    jest.advanceTimersByTime(0)
    jest.runOnlyPendingTimers()
    jest.runAllTimers()
    // Give async operations time to complete by advancing timers
    jest.advanceTimersByTime(1000)
    // Wait for any pending promises
    await Promise.resolve()
    await Promise.resolve()
    jest.useRealTimers()
  })

  describe('hook initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()
      expect(result.current.handleLoadWorkflows).toBeDefined()
      expect(result.current.handleUseAgents).toBeDefined()
      expect(result.current.handleDeleteAgents).toBeDefined()
      expect(result.current.handleDeleteWorkflows).toBeDefined()
      expect(result.current.handleDeleteRepositoryAgents).toBeDefined()
    })
  })

  describe('handleLoadWorkflows', () => {
    it('should load multiple workflows sequentially', async () => {
      mockTemplateSelection.selectedIds.add('template-1')
      mockTemplateSelection.selectedIds.add('template-2')
      mockUseTemplate.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      await act(async () => {
        const promise = result.current.handleLoadWorkflows()
        // Advance timers incrementally to allow promises to resolve
        // Each template has a 100ms delay, so we need at least 200ms for 2 templates
        jest.advanceTimersByTime(50)
        await Promise.resolve() // Allow first useTemplate to resolve
        jest.advanceTimersByTime(100) // Trigger first setTimeout
        await Promise.resolve()
        jest.advanceTimersByTime(50)
        await Promise.resolve() // Allow second useTemplate to resolve
        jest.advanceTimersByTime(100) // Trigger second setTimeout
        await Promise.resolve()
        await promise
      })

      expect(mockUseTemplate).toHaveBeenCalledTimes(2)
      expect(mockUseTemplate).toHaveBeenCalledWith('template-1')
      expect(mockUseTemplate).toHaveBeenCalledWith('template-2')
      expect(mockTemplateSelection.clear).toHaveBeenCalled()
    })

    it('should clear template selection after loading', async () => {
      mockTemplateSelection.selectedIds.add('template-1')
      mockUseTemplate.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      await act(async () => {
        const promise = result.current.handleLoadWorkflows()
        // Advance timers to resolve the setTimeout delay
        jest.advanceTimersByTime(50)
        await Promise.resolve() // Allow useTemplate to resolve
        jest.advanceTimersByTime(100) // Trigger setTimeout
        await Promise.resolve()
        await promise
      })

      expect(mockTemplateSelection.clear).toHaveBeenCalled()
    })

    it('should handle empty template selection', async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleLoadWorkflows()
        // Run any pending timers
        jest.runOnlyPendingTimers()
        await Promise.resolve()
      })

      expect(mockUseTemplate).not.toHaveBeenCalled()
      expect(mockTemplateSelection.clear).toHaveBeenCalled()
    })
  })

  describe('handleUseAgents', () => {
    it('should add agents to workflow from agents tab', () => {
      mockAgentSelection.selectedIds.add('agent-1')
      mockAgentSelection.selectedIds.add('agent-2')
      mockStorage.getItem.mockReturnValue('tab-123')

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      act(() => {
        result.current.handleUseAgents()
      })

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_TAB)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        PENDING_AGENTS_STORAGE_KEY,
        expect.stringContaining('"tabId":"tab-123"')
      )
      expect(mockShowSuccess).toHaveBeenCalledWith('2 agent(s) added to workflow')
      expect(mockAgentSelection.clear).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should add repository agents to workflow from repository agents tab', () => {
      mockRepositoryAgentSelection.selectedIds.add('repo-agent-1')
      mockStorage.getItem.mockReturnValue('tab-123')

      const options = {
        ...defaultOptions,
        activeTab: MARKETPLACE_TABS.REPOSITORY,
        repositorySubTab: REPOSITORY_SUB_TABS.AGENTS,
      }

      const { result } = renderHook(() => useMarketplaceActions(options))
      expect(result.current).not.toBeNull()

      act(() => {
        result.current.handleUseAgents()
      })

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(100)
      })

      const setItemCall = mockStorage.setItem.mock.calls.find(
        call => call[0] === PENDING_AGENTS_STORAGE_KEY
      )
      expect(setItemCall).toBeDefined()
      const storedData = JSON.parse(setItemCall![1])
      expect(storedData.agents).toEqual([mockRepositoryAgents[0]])
      expect(mockShowSuccess).toHaveBeenCalledWith('1 agent(s) added to workflow')
      expect(mockRepositoryAgentSelection.clear).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should show error when storage is not available', () => {
      const options = {
        ...defaultOptions,
        storage: null,
      }

      const { result } = renderHook(() => useMarketplaceActions(options))
      expect(result.current).not.toBeNull()

      act(() => {
        result.current.handleUseAgents()
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should show error when no active workflow tab', () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      act(() => {
        result.current.handleUseAgents()
      })

      expect(mockShowError).toHaveBeenCalledWith('No active workflow found. Please open a workflow first.')
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should dispatch custom event when adding agents', () => {
      mockAgentSelection.selectedIds.add('agent-1')
      mockStorage.getItem.mockReturnValue('tab-123')
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      expect(result.current).not.toBeNull()

      act(() => {
        result.current.handleUseAgents()
      })

      // Advance timers to trigger setTimeout
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(dispatchEventSpy).toHaveBeenCalled()
      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent
      expect(event.type).toBe(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW)
      expect(event.detail.tabId).toBe('tab-123')
      expect(event.detail.agents).toEqual([mockAgents[0]])

      dispatchEventSpy.mockRestore()
    })
  })

  describe('handleDeleteAgents', () => {
    it('should delete selected agents', async () => {
      mockAgentSelection.selectedIds.add('agent-1')
      mockDeleteSelectedAgents.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteAgents()
      })

      expect(mockDeleteSelectedAgents).toHaveBeenCalledWith(mockAgentSelection.selectedIds)
    })

    it('should handle empty selection', async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteAgents()
      })

      expect(mockDeleteSelectedAgents).toHaveBeenCalledWith(new Set())
    })
  })

  describe('handleDeleteWorkflows', () => {
    it('should delete selected workflows', async () => {
      mockTemplateSelection.selectedIds.add('template-1')
      mockDeleteSelectedWorkflows.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteWorkflows()
      })

      expect(mockDeleteSelectedWorkflows).toHaveBeenCalledWith(mockTemplateSelection.selectedIds)
    })

    it('should handle empty selection', async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteWorkflows()
      })

      expect(mockDeleteSelectedWorkflows).toHaveBeenCalledWith(new Set())
    })
  })

  describe('handleDeleteRepositoryAgents', () => {
    it('should delete selected repository agents', async () => {
      mockRepositoryAgentSelection.selectedIds.add('repo-agent-1')
      mockDeleteSelectedRepositoryAgents.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteRepositoryAgents()
      })

      expect(mockDeleteSelectedRepositoryAgents).toHaveBeenCalledWith(
        mockRepositoryAgentSelection.selectedIds,
        mockFetchRepositoryAgents
      )
    })

    it('should handle empty selection', async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions))
      
      // Ensure hook is initialized
      expect(result.current).not.toBeNull()

      await act(async () => {
        await result.current.handleDeleteRepositoryAgents()
      })

      expect(mockDeleteSelectedRepositoryAgents).toHaveBeenCalledWith(
        new Set(),
        mockFetchRepositoryAgents
      )
    })
  })
})
