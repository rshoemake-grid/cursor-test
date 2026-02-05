/**
 * Selection Manager Hook
 * DRY: Reusable selection management for any ID-based selection
 * Single Responsibility: Only manages selection state
 */

import { useState, useCallback } from 'react'

/**
 * Generic selection manager hook
 * 
 * @template T - Type of IDs being selected (typically string)
 * @returns Selection management functions and state
 */
export function useSelectionManager<T extends string = string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set())

  const toggle = useCallback((id: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const add = useCallback((id: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.add(id)
      return newSet
    })
  }, [])

  const remove = useCallback((id: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const has = useCallback((id: T) => {
    return selectedIds.has(id)
  }, [selectedIds])

  return {
    selectedIds,
    setSelectedIds,
    toggle,
    clear,
    add,
    remove,
    has,
    size: selectedIds.size,
  }
}
