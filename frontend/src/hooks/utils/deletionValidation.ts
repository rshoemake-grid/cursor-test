/**
 * Deletion Validation Utilities
 * Extracted from deletion hooks for better testability and mutation resistance
 * Single Responsibility: Only validates deletion conditions
 */

import { hasArrayItems, getArrayLength } from './arrayValidation'

/**
 * Check if there are official items that cannot be deleted
 * Mutation-resistant: explicit length check
 */
export function hasOfficialItems<T extends { is_official?: boolean }>(
  items: T[]
): boolean {
  const officialItems = items.filter(item => item.is_official === true)
  return hasArrayItems(officialItems)
}

/**
 * Check if user owns any deletable items
 * Mutation-resistant: explicit length check
 */
export function hasUserOwnedItems<T>(userOwnedItems: T[]): boolean {
  return hasArrayItems(userOwnedItems)
}

/**
 * Check if user owns no items (empty array)
 * Mutation-resistant: explicit length check
 */
export function hasNoUserOwnedItems<T>(userOwnedItems: T[]): boolean {
  return !hasUserOwnedItems(userOwnedItems)
}

/**
 * Check if user owns all selected items
 * Mutation-resistant: explicit length comparison
 */
export function ownsAllItems(
  userOwnedCount: number,
  totalDeletableCount: number
): boolean {
  return userOwnedCount === totalDeletableCount && userOwnedCount > 0
}

/**
 * Check if user owns some but not all items (partial ownership)
 * Mutation-resistant: explicit length comparison
 */
export function ownsPartialItems(
  userOwnedCount: number,
  totalDeletableCount: number
): boolean {
  return userOwnedCount > 0 && userOwnedCount < totalDeletableCount
}

/**
 * Check if there are items with author_id set
 * Mutation-resistant: explicit filter and length check
 */
export function hasItemsWithAuthorId<T extends { author_id?: string | null }>(
  items: T[]
): boolean {
  const itemsWithAuthorId = items.filter(item => item.author_id != null && item.author_id !== '')
  return hasArrayItems(itemsWithAuthorId)
}

/**
 * Get count of items with author_id
 * Mutation-resistant: explicit filter and length
 */
export function getItemsWithAuthorIdCount<T extends { author_id?: string | null }>(
  items: T[]
): number {
  const itemsWithAuthorId = items.filter(item => item.author_id != null && item.author_id !== '')
  return getArrayLength(itemsWithAuthorId)
}
