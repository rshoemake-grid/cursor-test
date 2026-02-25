/**
 * React Query Client Configuration
 * SOLID: Single Responsibility - only configures query client
 * DRY: Centralized query client setup
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure React Query client
 * Provides caching, stale-while-revalidate, and automatic refetching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000, // 5 seconds - data is fresh for 5 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
      refetchOnMount: true, // Refetch when component mounts
    },
  },
})
