/**
 * Sync State Hook
 * Generic hook for syncing external state to local state
 * DRY: Eliminates duplicate useEffect sync patterns
 * Single Responsibility: Only handles state synchronization
 */

import { useEffect, useRef } from 'react'

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
  // Use refs to store stable references and prevent infinite loops
  const setterRef = useRef(setter)
  const conditionRef = useRef(condition)
  
  // Update refs when values change (safe to do during render)
  setterRef.current = setter
  conditionRef.current = condition
  
  useEffect(() => {
    if (conditionRef.current !== undefined) {
      if (conditionRef.current(source)) {
        setterRef.current(source as T)
      }
    } else {
      // Default: sync if source is truthy (matches original behavior: if (data) { setData(data) })
      if (source) {
        setterRef.current(source)
      }
    }
  }, [source])
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
  // Use refs to store stable references and prevent infinite loops
  const setterRef = useRef(setter)
  const defaultValueRef = useRef(defaultValue)
  
  // Update refs when they change (safe to do during render)
  setterRef.current = setter
  defaultValueRef.current = defaultValue
  
  useEffect(() => {
    if (source === null || source === undefined) {
      setterRef.current(defaultValueRef.current)
    } else {
      setterRef.current(source)
    }
  }, [source]) // Only depend on source to prevent infinite loops
}
