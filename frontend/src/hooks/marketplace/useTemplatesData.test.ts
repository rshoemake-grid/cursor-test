/**
 * Tests for useTemplatesData Hook
 */

import { renderHook } from '@testing-library/react'
import { useTemplatesData } from './useTemplatesData'
import type { Template } from './useMarketplaceData'

describe('useTemplatesData', () => {
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
    mockHttpClient = {
      get: jest.fn(),
    }
  })

  it('should return fetchTemplates function', () => {
    const { result } = renderHook(() =>
      useTemplatesData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    expect(result.current.fetchTemplates).toBeDefined()
    expect(typeof result.current.fetchTemplates).toBe('function')
  })

  it('should fetch templates successfully', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue([mockTemplate]),
    }
    mockHttpClient.get.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      useTemplatesData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: 'automation',
        searchQuery: 'test',
        sortBy: 'popular',
      })
    )

    const templates = await result.current.fetchTemplates()

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/templates/?')
    )
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('category=automation')
    )
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    )
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('sort_by=popular')
    )
    expect(templates).toEqual([mockTemplate])
  })

  it('should handle API errors', async () => {
    const error = new Error('API Error')
    mockHttpClient.get.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useTemplatesData({
        httpClient: mockHttpClient,
        apiBaseUrl: 'http://api.test',
        category: '',
        searchQuery: '',
        sortBy: 'popular',
      })
    )

    await expect(result.current.fetchTemplates()).rejects.toThrow('API Error')
  })

  it('should update fetch function when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ category }) =>
        useTemplatesData({
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
          category,
          searchQuery: '',
          sortBy: 'popular',
        }),
      { initialProps: { category: 'automation' } }
    )

    const fetch1 = result.current.fetchTemplates

    rerender({ category: 'data' })

    const fetch2 = result.current.fetchTemplates

    expect(fetch1).not.toBe(fetch2)
  })
})
