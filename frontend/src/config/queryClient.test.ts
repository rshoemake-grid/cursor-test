/**
 * Tests for QueryClient Configuration
 * Follows SOLID, DRY, and DIP principles
 */

import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('should be an instance of QueryClient', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should have default options configured', () => {
    const defaultOptions = queryClient.getDefaultOptions()

    expect(defaultOptions.queries).toBeDefined()
    expect(defaultOptions.queries?.staleTime).toBe(5 * 1000) // 5 seconds
    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000) // 10 minutes
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
    expect(defaultOptions.queries?.retry).toBe(1)
    expect(defaultOptions.queries?.refetchOnMount).toBe(true)
  })

  it('should have staleTime set to 5 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(5000)
  })

  it('should have gcTime set to 10 minutes', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.gcTime).toBe(600000) // 10 minutes in milliseconds
  })

  it('should not refetch on window focus', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
  })

  it('should retry failed requests once', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.retry).toBe(1)
  })

  it('should refetch on mount', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.refetchOnMount).toBe(true)
  })

  it('should be a singleton instance', () => {
    // Import again to verify it's the same instance
    const { queryClient: queryClient2 } = require('./queryClient')
    expect(queryClient).toBe(queryClient2)
  })
})
