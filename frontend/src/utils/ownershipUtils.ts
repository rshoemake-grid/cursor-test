/**
 * Ownership Utilities
 * Shared utilities for checking ownership of agents and templates
 */

export interface OwnableItem {
  id: string
  author_id?: string | null
  is_official?: boolean
}

export interface User {
  id: string
  username?: string
  email?: string
}

/**
 * Compare two IDs using string conversion for type safety
 * Handles different ID types (string, number) by converting both to strings
 * 
 * @param id1 - First ID to compare (string | number | null | undefined)
 * @param id2 - Second ID to compare (string | number | null | undefined)
 * @returns True if IDs are equal after string conversion, false otherwise
 */
export function compareIds(
  id1: string | number | null | undefined,
  id2: string | number | null | undefined
): boolean {
  // Explicit null/undefined checks for both parameters
  if (id1 === null || id1 === undefined) {
    return false
  }
  if (id2 === null || id2 === undefined) {
    return false
  }
  
  // Explicit type checks before String conversion
  const isId1Valid = typeof id1 === 'string' || typeof id1 === 'number'
  const isId2Valid = typeof id2 === 'string' || typeof id2 === 'number'
  
  if (isId1Valid === false || isId2Valid === false) {
    return false
  }
  
  // Use explicit string comparison
  return String(id1) === String(id2)
}

/**
 * Check if a user owns an item
 * Uses compareIds helper for consistent ID comparison
 * 
 * @param item - The item to check ownership for
 * @param user - The user to check ownership against
 * @returns true if the user owns the item, false otherwise
 */
export function isOwner(item: OwnableItem | null | undefined, user: User | null): boolean {
  // Explicit checks to prevent mutation survivors - each condition tested independently
  if (user === null || user === undefined) {
    return false
  }
  if (item === null || item === undefined) {
    return false
  }
  if (item.author_id === null || item.author_id === undefined) {
    return false
  }
  if (user.id === null || user.id === undefined) {
    return false
  }
  
  // Use compareIds helper for consistent ID comparison
  return compareIds(item.author_id, user.id)
}

/**
 * Filter items to only those owned by the user
 * 
 * @param items - Array of items to filter
 * @param user - The user to filter by
 * @returns Array of items owned by the user
 */
export function filterOwnedItems<T extends OwnableItem>(items: T[], user: User | null): T[] {
  // Explicit checks to prevent mutation survivors
  if (user === null || user === undefined) {
    return []
  }
  if (user.id === null || user.id === undefined) {
    return []
  }
  
  return items.filter(item => isOwner(item, user))
}

/**
 * Filter items to separate official and deletable items
 * 
 * @param items - Array of items to filter
 * @returns Object with official and deletable arrays
 */
export function separateOfficialItems<T extends OwnableItem>(items: T[]): {
  official: T[]
  deletable: T[]
} {
  const official: T[] = []
  const deletable: T[] = []
  
  for (const item of items) {
    // Explicit boolean check to prevent mutation survivors
    const isOfficial = item.is_official === true
    if (isOfficial === true) {
      official.push(item)
    } else {
      deletable.push(item)
    }
  }
  
  return { official, deletable }
}

/**
 * Filter items to only those owned by the user, excluding official items
 * 
 * @param items - Array of items to filter
 * @param user - The user to filter by
 * @returns Array of user-owned, non-official items
 */
export function filterUserOwnedDeletableItems<T extends OwnableItem>(
  items: T[],
  user: User | null
): T[] {
  const { deletable } = separateOfficialItems(items)
  return filterOwnedItems(deletable, user)
}
