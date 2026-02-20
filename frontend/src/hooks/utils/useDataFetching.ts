/**
 * Generic Data Fetching Hook
 * Follows Single Responsibility Principle - only handles data fetching state
 * Can be composed with other hooks for complete functionality
 */

import { useState, useCallback } from 'react'
import { logger } from '../../utils/logger'
import { nullishCoalesce } from './nullishCoalescing'
import { isRunningUnderStryker } from '../../test/utils/detectStryker'

export interface UseDataFetchingOptions<T> {
  fetchFn: () => Promise<T>
  initialData?: T
  onError?: (error: any) => void
  logger?: typeof logger
}

export interface UseDataFetchingResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Generic hook for data fetching with loading and error states
 * Single Responsibility: Only manages fetch state
 */
export function useDataFetching<T>({
  fetchFn,
  initialData,
  onError,
  logger: injectedLogger = logger,
}: UseDataFetchingOptions<T>): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(nullishCoalesce(initialData, null))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Guard: Add timeout to prevent hanging fetches
      // Under Stryker, use longer timeout due to instrumentation overhead
      const timeoutMs = isRunningUnderStryker() ? 120000 : 30000 // 120s for Stryker, 30s otherwise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs)
      })
      
      const result = await Promise.race([
        fetchFn(),
        timeoutPromise
      ])
      
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      injectedLogger.error('Data fetch failed:', error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onError, injectedLogger])

  return {
    data,
    loading,
    error,
    refetch,
  }
}
