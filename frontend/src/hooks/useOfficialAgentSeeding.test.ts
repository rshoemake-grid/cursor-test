/**
 * Tests for useOfficialAgentSeeding hook
 */

import { renderHook, act } from '@testing-library/react'
import { useOfficialAgentSeeding } from './useOfficialAgentSeeding'
import { setLocalStorageItem } from './useLocalStorage'
import { STORAGE_KEYS } from '../config/constants'
import { logger } from '../utils/logger'
import type { StorageAdapter, HttpClient } from '../types/adapters'

// Mock useLocalStorage
jest.mock('./useLocalStorage', () => ({
  setLocalStorageItem: jest.fn(),
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}))

describe('useOfficialAgentSeeding', () => {
  let mockStorage: StorageAdapter
  let mockHttpClient: HttpClient
  const apiBaseUrl = 'http://api.test'
  const mockOnAgentsSeeded = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('seeding logic', () => {
    it('should return early if storage is null', async () => {
      renderHook(() =>
        useOfficialAgentSeeding({
          storage: null,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(mockOnAgentsSeeded).not.toHaveBeenCalled()
    })

    it('should skip seeding if already seeded', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue('true')

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Official agents already seeded, skipping'
      )
    })

    it('should handle error when checking seeded key', async () => {
      const error = new Error('Storage error')
      ;(mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw error
      })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith('Failed to check seeded key:', error)
      // Should still proceed with seeding
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should handle error when removing seeded key', async () => {
      const error = new Error('Remove error')
      ;(mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw error
      })
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)

      const mockResponse = {
        ok: true,
        json: async () => [] as any[],
      }
      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith('Failed to remove seeded key:', error)
      // Should still proceed with seeding
      expect(mockHttpClient.get).toHaveBeenCalled()
    })

    it('should fetch templates and filter official workflows', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
        { id: '2', name: 'Regular Workflow', is_official: false },
        { id: '3', name: 'Another Official', is_official: true },
      ]

      const mockResponse = {
        ok: true,
        json: async () => mockTemplates,
      }
      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `${apiBaseUrl}/templates/?sort_by=popular`
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Fetched workflows:',
        3
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Official workflows found:',
        2
      )
    })

    it('should handle API error when fetching templates', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)

      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      }
      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith(
        '[Marketplace] Failed to fetch templates:',
        'Not Found'
      )
      expect(mockOnAgentsSeeded).not.toHaveBeenCalled()
    })

    it('should mark as seeded when no official workflows found', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)

      const mockResponse = {
        ok: true,
        json: async () => [
          { id: '1', name: 'Regular Workflow', is_official: false },
        ],
      }
      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] No official workflows found, marking as seeded'
      )
      expect(setLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
      expect(mockOnAgentsSeeded).not.toHaveBeenCalled()
    })

    it('should process workflow and extract agent nodes', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent Node',
              description: 'Agent Description',
            },
            {
              id: 'node-2',
              type: 'condition',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${apiBaseUrl}/templates/1/use`,
        {},
        { 'Content-Type': 'application/json' }
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Processing workflow: Official Workflow (1)'
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Workflow Official Workflow has 2 nodes'
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Found agent node: node-1',
        expect.objectContaining({
          type: 'agent',
          hasConfig: true,
          name: 'Agent Node',
        })
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Found 1 agent nodes in workflow Official Workflow'
      )
    })

    it('should handle workflow with nodes in data property', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {
                id: 'node-1',
                type: 'agent',
                agent_config: { model: 'gpt-4' },
                name: 'Agent Node',
                description: 'Agent Description',
              },
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Found agent node: node-1',
        expect.any(Object)
      )
    })

    it('should skip agent if it already exists', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) {
          return JSON.stringify([
            { id: 'official_1_node-1', name: 'Existing Agent' },
          ])
        }
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent Node',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Agent official_1_node-1 already exists, skipping'
      )
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should create agent with correct properties', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        {
          id: '1',
          name: 'Official Workflow',
          is_official: true,
          category: 'automation',
          tags: ['tag1', 'tag2'],
          difficulty: 'intermediate',
          estimated_time: '10 min',
          author_id: 'user-1',
          author_name: 'Test Author',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: { model: 'gpt-4', temperature: 0.7 },
              name: 'Agent Node',
              description: 'Agent Description',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PUBLISHED_AGENTS,
        expect.stringContaining('official_1_node-1')
      )

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      const agent = agents[0]

      expect(agent).toMatchObject({
        id: 'official_1_node-1',
        name: 'Agent Node',
        label: 'Agent Node',
        description: 'Agent Description',
        category: 'automation',
        difficulty: 'intermediate',
        estimated_time: '10 min',
        agent_config: { model: 'gpt-4', temperature: 0.7 },
        author_id: 'user-1',
        author_name: 'Test Author',
        is_official: true,
      })
      expect(agent.tags).toContain('tag1')
      expect(agent.tags).toContain('tag2')
      expect(agent.tags).toContain('official')
      expect(agent.tags).toContain('official-workflow')
    })

    it('should use default values when workflow properties are missing', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: {},
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      const agent = agents[0]

      expect(agent.name).toBe('Agent')
      expect(agent.label).toBe('Agent')
      expect(agent.description).toBe('Agent from Official Workflow')
      expect(agent.category).toBe('automation')
      expect(agent.difficulty).toBe('intermediate')
      expect(agent.estimated_time).toBe('5 min')
      expect(agent.author_name).toBe('System')
    })

    it('should handle workflow fetch error and continue', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
        { id: '2', name: 'Another Official', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const error = new Error('Failed to fetch workflow')
      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nodes: [] }),
        })

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith(
        '[Marketplace] Failed to fetch workflow 1:',
        error
      )
      // Should continue processing other workflows
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2)
    })

    it('should handle workflow response error', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: false,
        statusText: 'Not Found',
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith(
        '[Marketplace] Failed to fetch workflow 1: Not Found'
      )
    })

    it('should handle workflow with no nodes array', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({}),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Workflow Official Workflow has no nodes array'
      )
    })

    it('should call onAgentsSeeded when agents are added', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent Node',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockOnAgentsSeeded).toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith(
        '[Marketplace] Seeded 1 official agents from workflows'
      )
    })

    it('should not call onAgentsSeeded when no agents are added', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'condition',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockOnAgentsSeeded).not.toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('[Marketplace] No agents to add')
    })

    it('should handle general error during seeding', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      const error = new Error('General error')
      ;(mockHttpClient.get as jest.Mock).mockRejectedValue(error)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(logger.error).toHaveBeenCalledWith(
        '[Marketplace] Failed to seed official agents:',
        error
      )
    })

    it('should mark as seeded after successful completion', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node-1',
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent Node',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(setLocalStorageItem).toHaveBeenCalledWith('officialAgentsSeeded', 'true')
      expect(logger.debug).toHaveBeenCalledWith('[Marketplace] Seeding complete')
    })

    it('should handle node without id and generate one', async () => {
      ;(mockStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(mockStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'officialAgentsSeeded') return null
        if (key === STORAGE_KEYS.PUBLISHED_AGENTS) return JSON.stringify([])
        return null
      })

      const mockTemplates = [
        { id: '1', name: 'Official Workflow', is_official: true },
      ]

      const mockTemplatesResponse = {
        ok: true,
        json: async () => mockTemplates,
      }

      const mockWorkflowResponse = {
        ok: true,
        json: async () => ({
          nodes: [
            {
              type: 'agent',
              agent_config: { model: 'gpt-4' },
              name: 'Agent Node',
            },
          ],
        }),
      }

      ;(mockHttpClient.get as jest.Mock).mockResolvedValue(mockTemplatesResponse)
      ;(mockHttpClient.post as jest.Mock).mockResolvedValue(mockWorkflowResponse)

      renderHook(() =>
        useOfficialAgentSeeding({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl,
          onAgentsSeeded: mockOnAgentsSeeded,
        })
      )

      await act(async () => {
        await Promise.resolve()
      })

      const setItemCall = (mockStorage.setItem as jest.Mock).mock.calls[0]
      const agents = JSON.parse(setItemCall[1])
      expect(agents[0].id).toMatch(/^official_1_node_/)
    })
  })
})
