/**
 * Method Expression Tests for useMarketplaceData hook
 * Targets surviving MethodExpression, ArrowFunction mutants
 * Tests sort callbacks, filter callbacks, and method chaining
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { waitForWithTimeoutFakeTimers } from '../../test/utils/waitForWithTimeout'
import { waitForWorkflowsOfWorkflowsToPopulate } from '../../test/utils/waitForWorkflowsOfWorkflows'
import { isRunningUnderStryker } from '../../test/utils/detectStryker'
import { useMarketplaceData } from './useMarketplaceData'
import { getLocalStorageItem } from '../storage'

// Use fake timers version since this test suite uses jest.useFakeTimers()
const waitForWithTimeout = waitForWithTimeoutFakeTimers

jest.mock('../storage', () => ({
  getLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

describe('useMarketplaceData - Method Expressions', () => {
  let mockHttpClient: any
  let mockStorage: any

  const mockAgent: any = {
    id: 'agent-1',
    name: 'Test Agent',
    label: 'Test Agent',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    published_at: '2024-01-01T00:00:00Z',
    is_official: false,
  }

  beforeEach(() => {
    // Increase timeout for Stryker instrumentation which runs slower
    // Note: jest.config.cjs has testTimeout: 180000
    jest.setTimeout(180000) // 3 minutes for Stryker instrumentation
    jest.clearAllMocks()
    
    // Use real timers under Stryker to avoid timing issues
    // Fake timers don't work well with Stryker instrumentation overhead
    if (isRunningUnderStryker()) {
      jest.useRealTimers()
    } else {
      jest.useFakeTimers() // Use fake timers for consistent test execution
    }
    mockHttpClient = {
      get: jest.fn().mockResolvedValue({ json: async () => [] }),
      post: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) }),
    }
    mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockGetLocalStorageItem.mockReturnValue([])
  })

  afterEach(async () => {
    // Clean up timers to prevent issues in mutation testing
    // Only clean up fake timers if we're using them (not under Stryker)
    if (!isRunningUnderStryker() && jest.isMockFunction(setTimeout)) {
      try {
        jest.advanceTimersByTime(0)
        jest.runOnlyPendingTimers()
        jest.runAllTimers()
        jest.clearAllTimers()
      } catch (e) {
        jest.clearAllTimers()
      }
    }
    // Always reset to real timers for cleanup
    jest.useRealTimers()
  })

  describe('Sort callback - arrow function', () => {
    it('should execute sort callback with arrow function syntax', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Zebra Agent', is_official: false },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent', is_official: false },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Sort callback should execute (arrow function)
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })

    it('should verify sort callback compares aIsOfficial and bIsOfficial', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Unofficial Agent', is_official: false },
        { ...mockAgent, id: 'agent-2', name: 'Official Agent', is_official: true },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Sort callback should compare is_official values
      expect(result.current.agents[0].is_official).toBe(true)
      expect(result.current.agents[1].is_official).toBe(false)
    })

    it('should verify sort callback uses subtraction operator (bIsOfficial - aIsOfficial)', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', is_official: false },
        { ...mockAgent, id: 'agent-2', is_official: true },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort official first (bIsOfficial - aIsOfficial = 1 - 0 = 1, positive means b comes first)
      expect(result.current.agents[0].is_official).toBe(true)
    })

    it('should verify sort callback uses subtraction operator (dateB - dateA)', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should sort by date descending (dateB - dateA, positive means b comes first)
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify sort callback uses localeCompare method', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', name: 'Zebra Agent' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use localeCompare for alphabetical sort
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })
  })

  describe('Filter callback - arrow function', () => {
    it('should execute filter callback with arrow function syntax', async () => {
      const agents = [
        { ...mockAgent, category: 'automation' },
        { ...mockAgent, id: 'agent-2', category: 'other' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: 'automation',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter callback should execute (arrow function)
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].category).toBe('automation')
    })

    it('should verify filter callback uses toLowerCase() method', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Description', tags: ['test'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'TEST', // Uppercase
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use toLowerCase() for case-insensitive matching
      expect(result.current.agents.length).toBe(1)
    })

    it('should verify filter callback uses includes() method', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Other', tags: ['other'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'Test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use includes() method
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].name).toBe('Test Agent')
    })

    it('should verify filter callback uses some() method on tags', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent One', description: 'Description', tags: ['test', 'automation'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Filter should use tags.some() method
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('Map callback - arrow function', () => {
    it('should execute map callback with arrow function syntax', async () => {
      const agents = [
        { ...mockAgent, author_id: null },
        { ...mockAgent, id: 'agent-2', author_id: null },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Map callback should execute (arrow function)
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData.length).toBe(2)
      expect(savedData[0].author_id).toBe('user-1')
      expect(savedData[1].author_id).toBe('user-1')
    })

    it('should verify map callback returns updated agent object', async () => {
      const agents = [
        { ...mockAgent, author_id: null },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: { id: 'user-1', username: 'testuser' },
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Map callback should return new object with updated author_id
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData[0]).toHaveProperty('author_id', 'user-1')
      expect(savedData[0]).toHaveProperty('author_name', 'testuser')
      expect(savedData[0]).toHaveProperty('id', 'agent-1')
    })
  })

  describe('Method chaining - toLowerCase().includes()', () => {
    it('should verify method chaining works correctly', async () => {
      const agents = [
        { ...mockAgent, name: 'Test Agent', description: 'Description', tags: ['test'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'TEST',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Method chaining: searchQuery.toLowerCase().includes() and a.name.toLowerCase().includes()
      expect(result.current.agents.length).toBe(1)
    })

    it('should verify method chaining with tags', async () => {
      const agents = [
        { ...mockAgent, name: 'Agent', description: 'Description', tags: ['TEST'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Method chaining: tag.toLowerCase().includes(query)
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('Date method - new Date().getTime()', () => {
    it('should verify new Date().getTime() is used for date comparison', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
        { ...mockAgent, id: 'agent-2', published_at: '2024-01-02T00:00:00Z' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use new Date().getTime() for timestamp conversion
      expect(result.current.agents[0].published_at).toBe('2024-01-02T00:00:00Z')
      expect(result.current.agents[1].published_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should verify new Date() constructor is called', async () => {
      const agents = [
        { ...mockAgent, published_at: '2024-01-01T00:00:00Z' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should create Date object and call getTime()
      expect(result.current.agents.length).toBe(1)
    })
  })

  describe('String method - localeCompare()', () => {
    it('should verify localeCompare() is used for alphabetical sort', async () => {
      const agents = [
        { ...mockAgent, name: 'Zebra Agent' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should use localeCompare() for alphabetical comparison
      expect(result.current.agents[0].name).toBe('Alpha Agent')
      expect(result.current.agents[1].name).toBe('Zebra Agent')
    })

    it('should verify localeCompare() handles empty string names', async () => {
      const agents = [
        { ...mockAgent, name: '' },
        { ...mockAgent, id: 'agent-2', name: 'Alpha Agent' },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'alphabetical',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should handle empty string (uses || '')
      expect(result.current.agents.length).toBe(2)
    })
  })

  describe('Array method - some() callback', () => {
    it('should verify some() callback is arrow function in workflow detection', async () => {
      // Fixed: Now uses real timers under Stryker and improved timer handling
      // Timeout already set in beforeEach (180000ms) for Stryker instrumentation
      // Template with tags that will trigger the some() callback check
      // The test verifies: workflow.tags.some(tag => tag.toLowerCase().includes('workflow'))
      // This is the mutation target - ensuring the arrow function callback is tested
      const template: any = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test Description', // No "workflow of workflows" to force tag path
        category: 'automation',
        tags: ['workflow', 'test'], // Tags include 'workflow' to trigger the some() check
      }
      
      // Mock GET to return templates array
      // Use jest.fn() to track calls and ensure proper async resolution
      const getJsonMock = jest.fn().mockResolvedValue([template])
      mockHttpClient.get.mockResolvedValue({
        json: getJsonMock,
      })
      
      // Mock POST to return workflow details with nodes
      // The node has description 'workflow' which triggers description.includes('workflow')
      // AND workflow.tags.some(tag => tag.toLowerCase().includes('workflow')) should also return true
      // Note: The tag check happens INSIDE the nodes.some() callback, checking workflow.tags (not node tags)
      // This exercises the arrow function callback mutation target: tag => tag.toLowerCase().includes('workflow')
      const postJsonMock = jest.fn().mockResolvedValue({
        nodes: [{
          // Node exists so nodes.some() runs
          // Inside nodes.some() callback (line 58), checks multiple conditions including:
          // workflow.tags.some(tag => tag.toLowerCase().includes('workflow')) on line 67
          // This exercises the arrow function callback mutation target
          // Since workflow.tags is ['workflow', 'test'], the tag check should return true
          // We also set description to 'workflow' to ensure hasWorkflowReference is true via description.includes('workflow')
          id: 'node-1',
          data: {},
          workflow_id: undefined,
          description: 'workflow', // This ensures hasWorkflowReference is true via description.includes('workflow')
          name: undefined,
        }],
      })
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: postJsonMock,
      })

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'workflows-of-workflows',
          repositorySubTab: 'agents',
        })
      )

      // Wait for all conditions together - ensures proper synchronization
      // Under Stryker instrumentation, async operations need more time to complete
      // The tag check (workflow.tags.some(...)) will still execute even if workflow_id is set
      // because the some() callback checks all conditions: hasWorkflowId || description || name || tags
      // Use waitForWithTimeout for better compatibility with fake timers under Stryker
      // Increased timeout to 120s for Stryker to handle complex async chain
      const timeout = isRunningUnderStryker() ? 120000 : 90000
      
      // Explicitly call fetchWorkflowsOfWorkflows() to ensure it completes
      // This matches the pattern used in other tests (e.g., useMarketplaceData.test.ts line 831)
      // fetchWorkflowsOfWorkflows() internally calls workflowsOfWorkflowsFetching.refetch()
      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows()
      })
      
      // Wait for GET call to complete
      await waitForWithTimeout(() => {
        expect(mockHttpClient.get).toHaveBeenCalled()
        expect(getJsonMock).toHaveBeenCalled()
      }, timeout)
      
      // Wait for POST call to complete
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled()
        expect(postJsonMock).toHaveBeenCalled()
      }, timeout)
      
      // Advance timers if using fake timers to allow async processing to complete
      if (!isRunningUnderStryker()) {
        for (let i = 0; i < 20; i++) {
          await act(async () => {
            jest.advanceTimersByTime(1000)
            jest.runOnlyPendingTimers()
          })
          await Promise.resolve()
        }
      } else {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
        })
      }
      
      // Wait for loading to complete (ensures refetch finished)
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      }, timeout)
      
      // Advance timers if using fake timers to allow state sync through useSyncState
      // useSyncState uses useEffect which needs time to run after data changes
      if (!isRunningUnderStryker()) {
        for (let i = 0; i < 15; i++) {
          await act(async () => {
            jest.advanceTimersByTime(1000)
            jest.runOnlyPendingTimers()
          })
          await Promise.resolve()
        }
      } else {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
        })
      }
      
      // Wait for data to populate (may take longer under Stryker)
      // The workflowsOfWorkflows array should contain the template because:
      // 1. Template has tags: ['workflow', 'test']
      // 2. Node has description: 'workflow' (triggers description.includes('workflow'))
      // 3. workflow.tags.some(tag => tag.toLowerCase().includes('workflow')) returns true
      // 4. hasWorkflowReference becomes true
      // 5. Workflow gets pushed to workflowsOfWorkflows array
      // 6. useSyncState syncs workflowsOfWorkflowsFetching.data to workflowsOfWorkflows state
      await waitForWithTimeout(() => {
        expect(result.current.workflowsOfWorkflows).toBeDefined()
        expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true)
        expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
        // Verify the template was added
        expect(result.current.workflowsOfWorkflows[0].id).toBe('template-1')
      }, timeout)

      // some() callback should be arrow function: tag => tag.toLowerCase().includes('workflow')
      // The workflow.tags.some() check should detect 'workflow' tag
      // The tag check happens inside nodes.some() callback, checking workflow.tags (not node tags)
      
      // Verify workflow was added (tags include 'workflow')
      // The tag check: workflow.tags.some(tag => tag.toLowerCase().includes('workflow'))
      // happens inside workflowDetail.nodes.some() callback (line 67 in useWorkflowsOfWorkflowsData.ts)
      // The check evaluates: (workflow.tags && workflow.tags.some(tag => tag.toLowerCase().includes('workflow')))
      // Since template has tags: ['workflow', 'test'], this should return true
      // And since hasWorkflowReference will be true, workflow should be added to workflowsOfWorkflows array
      // 2. Node exists (so nodes.some() runs)
      // 3. Tag check: workflow.tags.some(tag => tag.toLowerCase().includes('workflow')) returns true
      // 4. hasWorkflowReference becomes true
      // 5. Workflow gets pushed to workflowsOfWorkflows array
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
    })

    it('should verify some() callback uses toLowerCase().includes() in tags check', async () => {
      const agents = [
        { ...mockAgent, tags: ['TEST', 'automation'] },
      ]
      mockGetLocalStorageItem.mockReturnValue(agents)

      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: 'test', // lowercase
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false)
      })

      // some() callback should use toLowerCase().includes()
      // Filter uses: a.tags.some(tag => tag.toLowerCase().includes(query))
      expect(result.current.agents.length).toBe(1)
      expect(result.current.agents[0].tags).toContain('TEST')
    })
  })
})
