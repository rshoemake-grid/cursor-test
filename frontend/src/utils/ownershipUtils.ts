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
 * Check if a user owns an item
 * Compares user.id with item.author_id using string comparison for safety
 * 
 * @param item - The item to check ownership for
 * @param user - The user to check ownership against
 * @returns true if the user owns the item, false otherwise
 */
export function isOwner(item: OwnableItem | null | undefined, user: User | null): boolean {
  if (!user || !item || !item.author_id || !user.id) {
    return false
  }
  
  // Use string comparison to handle different types (number vs string)
  return String(item.author_id) === String(user.id)
}

/**
 * Filter items to only those owned by the user
 * 
 * @param items - Array of items to filter
 * @param user - The user to filter by
 * @returns Array of items owned by the user
 */
export function filterOwnedItems<T extends OwnableItem>(items: T[], user: User | null): T[] {
  if (!user || !user.id) {
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
    if (item.is_official) {
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
