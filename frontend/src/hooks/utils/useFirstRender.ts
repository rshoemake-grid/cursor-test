/**
 * First Render Hook
 * Generic hook for detecting first render
 * Single Responsibility: Only handles first render detection
 * DRY: Reusable first render pattern
 */

import { useRef } from 'react'

/**
 * Check if this is the first render
 * Mutation-resistant: explicit checks
 * 
 * @returns Object with isFirstRender flag and markAsRendered function
 */
export function useFirstRender(): {
  isFirstRender: boolean
  markAsRendered: () => void
} {
  const isFirstRenderRef = useRef(true)

  const markAsRendered = () => {
    isFirstRenderRef.current = false
  }

  return {
    isFirstRender: isFirstRenderRef.current,
    markAsRendered,
  }
}
