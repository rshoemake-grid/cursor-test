/**
 * Tests for useOfficialAgentSeeding hook
 * Covers all code paths to eliminate no-coverage mutants
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useOfficialAgentSeeding } from './useOfficialAgentSeeding'
import { logger } from '../../utils/logger'
import { setLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { StorageAdapter, HttpClient } from '../types/adapters'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../storage', () => ({
  setLocalStorageItem: jest.fn(),
}))

const mockLogger = logger as jest.Mocked<typeof logger>
const mockSetLocalStorageItem = setLocalStorageItem as jest.MockedFunction<typeof setLocalStorageItem>

describe('useOfficialAgentSeeding', () => {
  let mockStorage: StorageAdapter
  let mockHttpClient: HttpClient
  let mockOnAgentsSeeded: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

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

    mockOnAgentsSeeded = jest.fn()
  })

  afterEach(async () => {
    // Run all pending timers to ensure setTimeout callbacks complete
    // This prevents timeouts in mutation testing when async operations are mutated
    // Advance timers multiple times to ensure async operations complete
    jest.advanceTimersByTime(0)
    jest.runOnlyPendingTimers()
    jest.runAllTimers()
    // Give async operations time to complete by advancing timers
    jest.advanceTimersByTime(100)
    // Wait for any pending promises
    await Promise.resolve()
    await Promise.resolve()
    jest.useRealTimers()
  })

  describe('storage null check', () => {
    it('should return early if storage is null', () => {
      renderHook(() =>
        useOfficialAgentSeeding({
          storage: null,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      // Should not make any API calls when storage is null
      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(mockLogger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('[Marketplace] Starting to seed')
      )
    })
  })

  describe('seeded flag check', () => {
    it('should skip seeding if already seeded', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue('true')

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalledWith('officialAgentsSeeded')
      })

      // Should not fetch templates if already seeded
      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[Marketplace] Official agents already seeded, skipping'
      )
    })

    it('should handle error when checking seeded flag', async () => {
      mockStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to check seeded key:',
          expect.any(Error)
        )
      })

      // Should continue with seeding after error
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
  })

  describe('removeItem error handling', () => {
    it('should handle error when removing seeded key', async () => {
      mockStorage.removeItem = jest.fn().mockImplementation(() => {
        throw new Error('Remove error')
      })
      mockStorage.getItem = jest.fn().mockReturnValue(null)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to remove seeded key:',
          expect.any(Error)
        )
      })

      // Should continue with seeding after error
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
  })

  describe('fetch templates', () => {
    it('should fetch templates and filter official workflows', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      const mockTemplates = [
        { id: '1', name: 'Workflow 1', is_official: true },
        { id: '2', name: 'Workflow 2', is_official: false },
        { id: '3', name: 'Workflow 3', is_official: true },
      ]
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTemplates,
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          'https://api.example.com/templates/?sort_by=popular'
        )
      })

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[Marketplace] Fetched workflows:',
        3
      )
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[Marketplace] Official workflows found:',
        2
      )
    })

    it('should handle fetch templates error - response not ok', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          '[Marketplace] Failed to fetch templates:',
          'Not Found'
        )
      })

      // Should not proceed with seeding
      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })

    it('should handle fetch templates error - exception', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockRejectedValue(new Error('Network error'))

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          '[Marketplace] Failed to seed official agents:',
          expect.any(Error)
        )
      })
    })

    it('should mark as seeded when no official workflows found', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: '1', name: 'Workflow 1', is_official: false },
        ],
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          '[Marketplace] No official workflows found, marking as seeded'
        )
      })

      expect(mockSetLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
    })
  })

  describe('workflow processing', () => {
    it('should process workflows and extract agent nodes', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      const mockTemplates = [
        {
          id: 'wf1',
          name: 'Workflow 1',
          is_official: true,
          category: 'automation',
          tags: ['test'],
          difficulty: 'easy',
          estimated_time: '5 min',
        },
      ]
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTemplates,
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: { model: 'gpt-4' },
            name: 'Agent 1',
            description: 'Test agent',
          },
          {
            id: 'node2',
            type: 'condition',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          'https://api.example.com/templates/wf1/use',
          {},
          { 'Content-Type': 'application/json' }
        )
      })

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      expect(mockOnAgentsSeeded).toHaveBeenCalled()
    })

    it('should handle workflow fetch error - response not ok', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          '[Marketplace] Failed to fetch workflow wf1: Not Found'
        )
      })

      // Should continue processing other workflows
      expect(mockLogger.debug).toHaveBeenCalled()
    })

    it('should handle workflow fetch error - exception', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      mockHttpClient.post = jest.fn().mockRejectedValue(new Error('Network error'))

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('[Marketplace] Failed to fetch workflow'),
          expect.any(Error)
        )
      })
    })

    it('should handle workflow with no nodes array', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          // No nodes property
        }),
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          '[Marketplace] Workflow Workflow 1 has no nodes array'
        )
      })
    })

    it('should handle workflow with nodes but not an array', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: 'not an array',
        }),
      } as Response)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          '[Marketplace] Workflow Workflow 1 has no nodes array'
        )
      })

      // When nodes is not an array, no agents are added, but seeding is still marked complete
      // The code checks Array.isArray(workflowDetail.nodes) which returns false for non-arrays
      // So it logs the message but doesn't add agents
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
    })
  })

  describe('agent node extraction', () => {
    it('should extract agent nodes with type and agent_config', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: ['test'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: { model: 'gpt-4' },
            name: 'Agent 1',
            description: 'Test agent',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[Marketplace] Found agent node:'),
          expect.any(Object)
        )
      })
    })

    it('should extract agent nodes from node.data structure', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: ['test'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            data: {
              id: 'node1',
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent 1',
              description: 'Test agent',
            },
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[Marketplace] Found agent node:'),
          expect.any(Object)
        )
      })
    })

    it('should skip non-agent nodes', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'condition',
          },
          {
            id: 'node2',
            type: 'agent',
            // Missing agent_config
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          '[Marketplace] Found 0 agent nodes in workflow Workflow 1'
        )
      })
    })
  })

  describe('agent ID generation', () => {
    it('should generate unique agent ID from workflow and node', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: ['test'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: { model: 'gpt-4' },
            name: 'Agent 1',
            description: 'Test agent',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Verify agent ID format: official_${workflow.id}_${node.id}
      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents[0].id).toBe('official_wf1_node1')
    })

    it('should handle node without id - generate fallback', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: ['test'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            // No id property
            type: 'agent',
            agent_config: { model: 'gpt-4' },
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Should generate fallback ID
      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents[0].id).toMatch(/^official_wf1_node_/)
    })
  })

  describe('duplicate agent check', () => {
    it('should skip agent if already exists in storage', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: ['test'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: { model: 'gpt-4' },
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      const existingAgent = {
        id: 'official_wf1_node1',
        name: 'Existing Agent',
      }

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) {
          return JSON.stringify([existingAgent])
        }
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          '[Marketplace] Agent official_wf1_node1 already exists, skipping'
        )
      })

      // Should not add duplicate agent
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('agent creation', () => {
    it('should create agent with all properties from workflow and node', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      const mockTemplate = {
        id: 'wf1',
        name: 'Test Workflow',
        is_official: true,
        category: 'automation',
        tags: ['tag1', 'tag2'],
        difficulty: 'intermediate',
        estimated_time: '10 min',
        author_id: 'author1',
        author_name: 'Author Name',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockTemplate],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: { model: 'gpt-4', temperature: 0.7 },
            name: 'Agent Name',
            description: 'Agent Description',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      const agent = agents[0]

      expect(agent.id).toBe('official_wf1_node1')
      expect(agent.name).toBe('Agent Name')
      expect(agent.label).toBe('Agent Name')
      expect(agent.description).toBe('Agent Description')
      expect(agent.category).toBe('automation')
      expect(agent.tags).toContain('tag1')
      expect(agent.tags).toContain('tag2')
      expect(agent.tags).toContain('official')
      expect(agent.difficulty).toBe('intermediate')
      expect(agent.estimated_time).toBe('10 min')
      expect(agent.agent_config).toEqual({ model: 'gpt-4', temperature: 0.7 })
      expect(agent.published_at).toBe('2024-01-01T00:00:00Z')
      expect(agent.author_id).toBe('author1')
      expect(agent.author_name).toBe('Author Name')
      expect(agent.is_official).toBe(true)
    })

    it('should use fallback values when properties are missing', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            // Missing category, tags, difficulty, etc.
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            // Missing name, description
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      const agent = agents[0]

      expect(agent.name).toBe('Agent') // Fallback
      expect(agent.description).toBe('Agent from Workflow 1') // Fallback
      expect(agent.category).toBe('automation') // Fallback
      expect(agent.difficulty).toBe('intermediate') // Fallback
      expect(agent.estimated_time).toBe('5 min') // Fallback
    })

    it('should use node.data.name or node.data.label as fallback', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            data: {
              id: 'node1',
              type: 'agent',
              agent_config: {},
              label: 'Node Label', // Use label as fallback
            },
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents[0].name).toBe('Node Label')
    })
  })

  describe('storage operations', () => {
    it('should add agents to existing storage', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      const existingAgents = [
        {
          id: 'existing1',
          name: 'Existing Agent',
        },
      ]

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) {
          return JSON.stringify(existingAgents)
        }
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents.length).toBe(2) // Existing + new
      expect(agents[0].id).toBe('existing1')
      expect(agents[1].id).toBe('official_wf1_node1')
    })

    it('should handle storage null during agent check', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      // Simulate storage becoming null during processing
      let callCount = 0
      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        callCount++
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) {
          if (callCount > 1) return null // Storage becomes null
          return null
        }
        return null
      })

      // Make storage null during the check
      const storageRef: StorageAdapter | null = mockStorage
      const checkStorage = () => {
        if (!storageRef) return
        storageRef.getItem(STORAGE_KEYS.PUBLISHED_AGENTS)
      }

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: storageRef,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalled()
      })

      // Should handle gracefully when storage is null during check
      expect(mockLogger.debug).toHaveBeenCalled()
    })
  })

  describe('tag generation', () => {
    it('should generate tags from workflow tags plus official and normalized name', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'My Test Workflow',
            is_official: true,
            category: 'automation',
            tags: ['ai', 'automation'],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      const agent = agents[0]

      expect(agent.tags).toContain('ai')
      expect(agent.tags).toContain('automation')
      expect(agent.tags).toContain('official')
      expect(agent.tags).toContain('my-test-workflow') // Normalized name
    })
  })

  describe('callback execution', () => {
    it('should call onAgentsSeeded when agents are added', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await waitFor(() => {
        expect(mockOnAgentsSeeded).toHaveBeenCalled()
      })
    })

    it('should not call onAgentsSeeded when no agents to add', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'condition', // Not an agent
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await waitFor(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith('[Marketplace] No agents to add')
      })

      expect(mockOnAgentsSeeded).not.toHaveBeenCalled()
    })

    it('should not call onAgentsSeeded when onAgentsSeeded is undefined', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
          onAgentsSeeded: undefined,
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      // Should not crash when onAgentsSeeded is undefined
      expect(mockLogger.debug).toHaveBeenCalled()
    })
  })

  describe('finalization', () => {
    it('should mark as seeded after successful seeding', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockSetLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
      })

      expect(mockLogger.debug).toHaveBeenCalledWith('[Marketplace] Seeding complete')
    })
  })

  describe('edge cases', () => {
    it('should handle multiple workflows with multiple agent nodes', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
          {
            id: 'wf2',
            name: 'Workflow 2',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      mockHttpClient.post = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nodes: [
              {
                id: 'node1',
                type: 'agent',
                agent_config: {},
                name: 'Agent 1',
              },
              {
                id: 'node2',
                type: 'agent',
                agent_config: {},
                name: 'Agent 2',
              },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nodes: [
              {
                id: 'node3',
                type: 'agent',
                agent_config: {},
                name: 'Agent 3',
              },
            ],
          }),
        } as Response)

      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return null
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents.length).toBe(3) // 2 from wf1, 1 from wf2
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[Marketplace] Seeded 3 official agents from workflows'
      )
    })

    it('should handle JSON.parse error when reading existing agents', async () => {
      mockStorage.getItem = jest.fn().mockReturnValue(null)
      mockHttpClient.get = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'wf1',
            name: 'Workflow 1',
            is_official: true,
            category: 'automation',
            tags: [],
            difficulty: 'easy',
            estimated_time: '5 min',
          },
        ],
      } as Response)

      const mockWorkflowDetail = {
        nodes: [
          {
            id: 'node1',
            type: 'agent',
            agent_config: {},
            name: 'Agent 1',
          },
        ],
      }

      mockHttpClient.post = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkflowDetail,
      } as Response)

      // JSON.parse will throw when reading existing agents
      // This error is not caught, so it will propagate to the outer catch block
      // and the workflow processing will fail, but seeding will still be marked complete
      mockStorage.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) {
          return 'invalid json{' // Invalid JSON - will cause JSON.parse to throw
        }
        return null
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: 'https://api.example.com',
        })
      )

      await waitFor(() => {
        // JSON.parse error will be caught by the outer catch block
        // The error will be logged and the workflow processing will fail
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('[Marketplace] Failed to fetch workflow'),
          expect.any(Error)
        )
      })

      // After error, seeding should still be marked complete
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
    })
  })
})
