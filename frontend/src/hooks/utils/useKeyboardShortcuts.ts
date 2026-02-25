/**
 * Custom Hook for Keyboard Shortcuts
 * SOLID: Single Responsibility - only manages keyboard shortcuts
 * DRY: Reusable keyboard shortcut logic
 * DIP: Depends on abstractions
 */

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
  target?: HTMLElement | Window | null
}

/**
 * Custom hook for managing keyboard shortcuts
 * 
 * @param options - Keyboard shortcuts configuration
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  target,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          // Don't trigger if typing in input/textarea/contenteditable
          const target = event.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            continue
          }

          event.preventDefault()
          shortcut.handler(event)
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    const targetElement = (target || window) as Window & typeof globalThis

    targetElement.addEventListener('keydown', handleKeyDown as EventListener)

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, enabled, target])
}
