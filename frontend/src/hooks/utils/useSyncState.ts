/**
 * Sync State Hook
 * Generic hook for syncing external state to local state
 * DRY: Eliminates duplicate useEffect sync patterns
 * Single Responsibility: Only handles state synchronization
 */

import { useEffect } from 'react'

/**
 * Sync external state to local state setter
 * DRY: Reusable pattern for syncing data fetching results to local state
 * 
 * @template T - Type of value being synced
 * @param source - Source value to sync from
 * @param setter - State setter function
 * @param condition - Optional condition function to check before syncing
 */
export function useSyncState<T>(
  source: T | null | undefined,
  setter: (value: T) => void,
  condition?: (value: T | null | undefined) => boolean
): void {
  useEffect(() => {
    if (condition !== undefined) {
      if (condition(source)) {
        setter(source as T)
      }
    } else {
      // Default: sync if source is truthy (matches original behavior: if (data) { setData(data) })
      if (source) {
        setter(source)
      }
    }
  }, [source, setter, condition])
}

/**
 * Sync state with null coalescing
 * Syncs source to setter, using nullishCoalesce for default value
 * 
 * @template T - Type of value being synced
 * @param source - Source value to sync from
 * @param setter - State setter function
 * @param defaultValue - Default value if source is null/undefined
 */
export function useSyncStateWithDefault<T>(
  source: T | null | undefined,
  setter: (value: T | null) => void,
  defaultValue: T | null = null
): void {
  useEffect(() => {
    if (source === null || source === undefined) {
      setter(defaultValue)
    } else {
      setter(source)
    }
     
  }, [source, setter, defaultValue])
}
