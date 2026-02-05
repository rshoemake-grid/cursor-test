/**
 * Keyboard Shortcuts Utility Functions
 * Extracted from useKeyboardShortcuts.ts to improve testability
 */

/**
 * Check if target element is an input field
 */
export function isInputElement(target: HTMLElement): boolean {
  return target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.isContentEditable === true
}

/**
 * Check if modifier keys are pressed (Ctrl or Cmd)
 */
export function hasModifierKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey
}

/**
 * Check if key combination matches
 */
export function matchesKeyCombination(
  event: KeyboardEvent,
  key: string,
  requireModifier: boolean = true
): boolean {
  if (requireModifier && !hasModifierKey(event)) {
    return false
  }
  return event.key.toLowerCase() === key.toLowerCase()
}

/**
 * Check if delete key is pressed (Delete or Backspace)
 */
export function isDeleteKey(event: KeyboardEvent): boolean {
  return event.key === 'Delete' || event.key === 'Backspace'
}
