/**
 * Enhanced mutation tests for useMarketplaceData
 * Focuses on killing remaining 5 surviving mutants through:
 * 1. Testing complex loading state logic independently
 * 2. Testing tab routing conditionals
 * 3. Testing data syncing conditionals
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMarketplaceData } from './useMarketplaceData'
import { useTemplatesData } from './useTemplatesData'
import { useAgentsData } from './useAgentsData'
import { useRepositoryAgentsData } from './useRepositoryAgentsData'
import { useWorkflowsOfWorkflowsData } from './useWorkflowsOfWorkflowsData'
import { useDataFetching } from './utils/useDataFetching'

jest.mock('./useTemplatesData')
jest.mock('./useAgentsData')
jest.mock('./useRepositoryAgentsData')
jest.mock('./useWorkflowsOfWorkflowsData')
jest.mock('./utils/useDataFetching')

const mockUseTemplatesData = useTemplatesData as jest.MockedFunction<typeof useTemplatesData>
const mockUseAgentsData = useAgentsData as jest.MockedFunction<typeof useAgentsData>
const mockUseRepositoryAgentsData = useRepositoryAgentsData as jest.MockedFunction<typeof useRepositoryAgentsData>
const mockUseWorkflowsOfWorkflowsData = useWorkflowsOfWorkflowsData as jest.MockedFunction<typeof useWorkflowsOfWorkflowsData>
const mockUseDataFetching = useDataFetching as jest.MockedFunction<typeof useDataFetching>

const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

describe('useMarketplaceData - Enhanced Mutation Killers', () => {
  let mockStorage: any
  let mockHttpClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }

    // Default mock implementations
    mockUseTemplatesData.mockReturnValue({
      fetchTemplates: jest.fn(),
    } as any)

    mockUseAgentsData.mockReturnValue({
      fetchAgents: jest.fn(),
    } as any)

    mockUseRepositoryAgentsData.mockReturnValue({
      fetchRepositoryAgents: jest.fn(),
    } as any)

    mockUseWorkflowsOfWorkflowsData.mockReturnValue({
      fetchWorkflowsOfWorkflows: jest.fn(),
    } as any)

    mockUseDataFetching.mockImplementation(({ initialData }) => ({
      data: initialData,
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(initialData),
    }))
  })

  describe('Loading State Calculation - Independent Condition Testing', () => {
    /**
     * The loading state calculation uses calculateLoadingState function
     * which tests each condition independently
     * 
     * We need to test each branch independently by mocking the loading states
     */

    describe('Repository/Workflows branch', () => {
      it('should return loading true when repository/workflows and templates loading', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // First call is templates
          if (callIndex === 1) {
            return {
              data: initialData,
              loading: true, // Loading
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'repository',
            repositorySubTab: 'workflows',
          })
        )

        // Should return loading true (repository && workflows && templatesLoading)
        expect(result.current.loading).toBe(true)
      })

      it('should return loading false when repository/workflows but templates not loading', () => {
        mockUseDataFetching.mockImplementation(({ initialData }) => ({
          data: initialData,
          loading: false, // Not loading
          error: null,
          refetch: jest.fn(),
        }))

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'popular',
            user: null,
            activeTab: 'repository',
            repositorySubTab: 'workflows',
          })
        )

        // Should return loading false (templatesLoading is false)
        expect(result.current.loading).toBe(false)
      })

      it('should return loading false when repository but agents sub-tab', () => {
        mockUseDataFetching.mockImplementation(({ initialData }) => ({
          data: initialData,
          loading: true, // Loading, but wrong sub-tab
          error: null,
          refetch: jest.fn(),
        }))

        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
            category: '',
            searchQuery: '',
            sortBy: 'popular',
            user: null,
            activeTab: 'repository',
            repositorySubTab: 'agents', // Wrong sub-tab
          })
        )

        // Should check repository agents loading, not templates
        // Since we're mocking all as false by default, should be false
        expect(result.current.loading).toBe(false)
      })
    })

    describe('Repository/Agents branch', () => {
      it('should return loading true when repository/agents and repository agents loading', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Second call is for repository agents (after templates)
          if (callIndex === 2) {
            return {
              data: initialData,
              loading: true, // Loading
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'repository',
            repositorySubTab: 'agents',
          })
        )

        // Should return loading true (repository && agents && repositoryAgentsLoading)
        expect(result.current.loading).toBe(true)
      })
    })

    describe('Workflows-of-Workflows branch', () => {
      it('should return loading true when workflows-of-workflows tab and loading', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Third call is for workflows-of-workflows (after templates, repository agents)
          if (callIndex === 3) {
            return {
              data: initialData,
              loading: true, // Loading
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            repositorySubTab: 'workflows',
          })
        )

        // Should return loading true (workflows-of-workflows && loading)
        expect(result.current.loading).toBe(true)
      })
    })

    describe('Agents branch', () => {
      it('should return loading true when agents tab and loading', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Fourth call is for agents (after templates, repository agents, workflows-of-workflows)
          if (callIndex === 4) {
            return {
              data: initialData,
              loading: true, // Loading
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        // Should return loading true (agents && loading)
        expect(result.current.loading).toBe(true)
      })
    })
  })

  describe('Data Syncing Conditionals', () => {
    describe('workflowsOfWorkflowsFetching.data conditional', () => {
      it('should verify exact truthy check - data is truthy', () => {
        const mockData = [{ id: '1', name: 'Template' }]
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Third call is workflows-of-workflows
          if (callIndex === 3) {
            return {
              data: mockData, // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            repositorySubTab: 'workflows',
          })
        )

        // Should sync data (data is truthy)
        expect(result.current.workflowsOfWorkflows).toEqual(mockData)
      })

      it('should verify exact truthy check - data is null', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Third call is workflows-of-workflows
          if (callIndex === 3) {
            return {
              data: null, // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            repositorySubTab: 'workflows',
          })
        )

        // Should not sync data (data is falsy)
        expect(result.current.workflowsOfWorkflows).toEqual([]) // Initial empty array
      })

      it('should verify exact truthy check - data is undefined', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Third call is workflows-of-workflows
          if (callIndex === 3) {
            return {
              data: undefined, // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            repositorySubTab: 'workflows',
          })
        )

        // Should not sync data (data is falsy)
        expect(result.current.workflowsOfWorkflows).toEqual([]) // Initial empty array
      })
    })

    describe('agentsFetching.data conditional', () => {
      it('should verify exact truthy check - data is truthy', () => {
        const mockData = [{ id: '1', name: 'Agent' }]
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Fourth call is agents
          if (callIndex === 4) {
            return {
              data: mockData, // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        // Should sync data (data is truthy)
        expect(result.current.agents).toEqual(mockData)
      })

      it('should verify exact truthy check - data is falsy', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Fourth call is agents
          if (callIndex === 4) {
            return {
              data: null, // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'agents',
            repositorySubTab: 'workflows',
          })
        )

        // Should not sync data (data is falsy)
        expect(result.current.agents).toEqual([]) // Initial empty array
      })
    })

    describe('repositoryAgentsFetching.data conditional', () => {
      it('should verify exact truthy check - data is truthy', () => {
        const mockData = [{ id: '1', name: 'Agent' }]
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Second call is repository agents
          if (callIndex === 2) {
            return {
              data: mockData, // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'repository',
            repositorySubTab: 'agents',
          })
        )

        // Should sync data (data is truthy)
        expect(result.current.repositoryAgents).toEqual(mockData)
      })

      it('should verify exact truthy check - data is falsy', () => {
        let callIndex = 0
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++
          // Second call is repository agents
          if (callIndex === 2) {
            return {
              data: null, // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            }
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          }
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
            activeTab: 'repository',
            repositorySubTab: 'agents',
          })
        )

        // Should not sync data (data is falsy)
        expect(result.current.repositoryAgents).toEqual([]) // Initial empty array
      })
    })
  })

  describe('Tab Routing - Independent Condition Testing', () => {
    it('should route to templates when repository/workflows', async () => {
      let callIndex = 0
      let templatesRefetchCalled = false
      
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++
        const refetch = jest.fn().mockImplementation(() => {
          // First call is templates
          if (callIndex === 1) {
            templatesRefetchCalled = true
          }
          return Promise.resolve(initialData)
        })
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        }
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'workflows',
        })
      )

      await waitForWithTimeout(() => {
        expect(templatesRefetchCalled).toBe(true)
      })
    })

    it('should route to repository agents when repository/agents', async () => {
      let callIndex = 0
      let repositoryAgentsRefetchCalled = false
      
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++
        const refetch = jest.fn().mockImplementation(() => {
          // Second call is repository agents
          if (callIndex === 2) {
            repositoryAgentsRefetchCalled = true
          }
          return Promise.resolve(initialData)
        })
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        }
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'repository',
          repositorySubTab: 'agents',
        })
      )

      await waitForWithTimeout(() => {
        expect(repositoryAgentsRefetchCalled).toBe(true)
      })
    })

    it('should route to workflows-of-workflows when workflows-of-workflows tab', async () => {
      let callIndex = 0
      let workflowsOfWorkflowsRefetchCalled = false
      
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++
        const refetch = jest.fn().mockImplementation(() => {
          // Third call is workflows-of-workflows
          if (callIndex === 3) {
            workflowsOfWorkflowsRefetchCalled = true
          }
          return Promise.resolve(initialData)
        })
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        }
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'workflows-of-workflows',
          repositorySubTab: 'workflows',
        })
      )

      await waitForWithTimeout(() => {
        expect(workflowsOfWorkflowsRefetchCalled).toBe(true)
      })
    })

    it('should route to agents when agents tab', async () => {
      let callIndex = 0
      let agentsRefetchCalled = false
      
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++
        const refetch = jest.fn().mockImplementation(() => {
          // Fourth call is agents
          if (callIndex === 4) {
            agentsRefetchCalled = true
          }
          return Promise.resolve(initialData)
        })
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        }
      })

      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category: '',
          searchQuery: '',
          sortBy: 'popular',
          user: null,
          activeTab: 'agents',
          repositorySubTab: 'workflows',
        })
      )

      await waitForWithTimeout(() => {
        expect(agentsRefetchCalled).toBe(true)
      })
    })
  })
})
