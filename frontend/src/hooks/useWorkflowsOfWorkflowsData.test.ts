/**
 * Tests for useWorkflowsOfWorkflowsData Hook
 */

import { renderHook } from '@testing-library/react'
import { useWorkflowsOfWorkflowsData } from './useWorkflowsOfWorkflowsData'
import { logger } from '../utils/logger'
import type { Template } from './useMarketplaceData'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useWorkflowsOfWorkflowsData', () => {
  let mockHttpClient: any

  const mockTemplate: Template = {
    id: 'template-1',
    name: 'Test Template',
    description: 'Test Description',
    category: 'automation',
    tags: ['test'],
    difficulty: 'beginner',
    estimated_time: '5 min',
    is_official: false,
    uses_count: 10,
    likes_count: 5,
    rating: 4.5,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
    }
  })

  it('should return fetchWorkflowsOfWorkflows function', () => {
    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    expect(result.current.fetchWorkflowsOfWorkflows).toBeDefined()
    expect(typeof result.current.fetchWorkflowsOfWorkflows).toBe('function')
  })

  it('should fetch and filter workflows of workflows', async () => {
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([mockTemplate]),
    }
    const mockWorkflowDetail = {
      nodes: [
        {
          data: { workflow_id: 'workflow-2' },
        },
      ],
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockWorkflowDetail),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(mockHttpClient.get).toHaveBeenCalled()
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining(`/templates/${mockTemplate.id}/use`),
      {},
      { 'Content-Type': 'application/json' }
    )
    expect(workflows).toEqual([mockTemplate])
  })

  it('should filter workflows by description', async () => {
    const templateWithDescription = {
      ...mockTemplate,
      description: 'This is a workflow of workflows',
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithDescription]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([templateWithDescription])
  })

  it('should handle errors when checking individual workflows', async () => {
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([mockTemplate]),
    }
    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([])
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('should handle non-ok responses', async () => {
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([mockTemplate]),
    }
    const mockWorkflowResponse = {
      ok: false,
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([])
  })

  it('should filter workflows by tags containing workflow', async () => {
    const templateWithTags = {
      ...mockTemplate,
      tags: ['workflow-of-workflows', 'automation'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithTags]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([templateWithTags])
  })

  it('should handle workflows without tags', async () => {
    const templateWithoutTags = {
      ...mockTemplate,
      tags: undefined,
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithoutTags]),
    }
    const mockWorkflowDetail = {
      nodes: [
        {
          data: { workflow_id: 'workflow-2' },
        },
      ],
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockWorkflowDetail),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    // Should still match because of workflow_id in node data
    expect(workflows).toEqual([templateWithoutTags])
  })

  it('should filter workflows by tags when tags exist', async () => {
    const templateWithWorkflowTag = {
      ...mockTemplate,
      tags: ['workflow-of-workflows', 'other-tag'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithWorkflowTag]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([templateWithWorkflowTag])
  })

  it('should not match workflow when tags do not contain workflow keyword', async () => {
    const templateWithoutWorkflowTag = {
      ...mockTemplate,
      tags: ['automation', 'data-processing'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithoutWorkflowTag]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([])
  })

  it('should handle workflow tags check when tags array exists but no workflow keyword', async () => {
    const templateWithNonWorkflowTags = {
      ...mockTemplate,
      tags: ['automation', 'integration'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithNonWorkflowTags]),
    }
    const mockWorkflowDetail = {
      nodes: [
        {
          data: {},
          description: '',
          name: '',
        },
      ],
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockWorkflowDetail),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    // Should not match because tags don't contain 'workflow' and no other indicators
    expect(workflows).toEqual([])
  })

  it('should match workflow when tags array contains workflow keyword', async () => {
    const templateWithWorkflowInTags = {
      ...mockTemplate,
      tags: ['workflow-integration', 'automation'],
      description: 'This is a workflow of workflows',
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithWorkflowInTags]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([templateWithWorkflowInTags])
  })

  it('should match workflow when tags contain workflow keyword in node check', async () => {
    const templateWithWorkflowInTags = {
      ...mockTemplate,
      tags: ['workflow-integration', 'automation'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithWorkflowInTags]),
    }
    const mockWorkflowDetail = {
      nodes: [
        {
          data: {},
          description: '',
          name: '',
        },
      ],
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockWorkflowDetail),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    // Should match because tags contain 'workflow' keyword
    expect(workflows).toEqual([templateWithWorkflowInTags])
  })

  it('should handle nodes without data property', async () => {
    const template: Template = {
      ...mockTemplate,
      tags: [],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([template]),
    }
    const mockWorkflowDetail = {
      nodes: [
        {
          // No data property
          workflow_id: 'workflow-2',
        },
      ],
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockWorkflowDetail),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([template])
  })

  it('should handle workflows without description', async () => {
    const templateWithoutDescription = {
      ...mockTemplate,
      description: undefined,
      tags: ['workflow-of-workflows'],
    }
    const mockTemplatesResponse = {
      json: jest.fn().mockResolvedValue([templateWithoutDescription]),
    }
    const mockWorkflowResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ nodes: [] }),
    }

    mockHttpClient.get.mockResolvedValue(mockTemplatesResponse)
    mockHttpClient.post.mockResolvedValue(mockWorkflowResponse)

    const { result } = renderHook(() =>
      useWorkflowsOfWorkflowsData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    const workflows = await result.current.fetchWorkflowsOfWorkflows()

    expect(workflows).toEqual([templateWithoutDescription])
  })
})
