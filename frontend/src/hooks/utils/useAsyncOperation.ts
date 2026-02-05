/**
 * Async Operation Hook
 * Handles async operations with loading, error, and success states
 * Follows Single Responsibility Principle
 */

import { useState, useCallback } from 'react'
import { logger } from '../../utils/logger'

export interface UseAsyncOperationOptions<TArgs extends any[], TResult> {
  operation: (...args: TArgs) => Promise<TResult>
  onSuccess?: (result: TResult) => void
  onError?: (error: any) => void
  logger?: typeof logger
}

export interface UseAsyncOperationResult<TArgs extends any[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | null>
  loading: boolean
  error: Error | null
  reset: () => void
}

/**
 * Generic hook for async operations with loading and error states
 * Single Responsibility: Only manages async operation state
 */
export function useAsyncOperation<TArgs extends any[], TResult>({
  operation,
  onSuccess,
  onError,
  logger: injectedLogger = logger,
}: UseAsyncOperationOptions<TArgs, TResult>): UseAsyncOperationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await operation(...args)
        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        injectedLogger.error('Async operation failed:', error)
        onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [operation, onSuccess, onError, injectedLogger]
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    execute,
    loading,
    error,
    reset,
  }
}
