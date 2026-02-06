/**
 * User Validation Utilities
 * Extracted from multiple hooks for better testability and mutation resistance
 * Single Responsibility: Only validates user data
 */

import { logicalOr, logicalOrToNull } from './logicalOr'

export interface User {
  id: string
  username?: string
  email?: string
}

/**
 * Check if user exists and has an ID
 * Mutation-resistant: explicit null check and property check
 */
export function isValidUser(user: User | null | undefined): user is User {
  return user != null && user.id != null && user.id !== ''
}

/**
 * Check if user can perform operations (user exists and has ID)
 * Mutation-resistant: explicit validation
 */
export function canUserOperate(user: User | null | undefined): boolean {
  return isValidUser(user)
}

/**
 * Check if user can migrate data (user exists, has ID, and data array has items)
 * Mutation-resistant: explicit checks for each condition
 */
export function canMigrateUserData<T>(
  user: User | null | undefined,
  data: T[] | null | undefined
): boolean {
  if (!isValidUser(user)) {
    return false
  }
  if (data == null) {
    return false
  }
  if (!Array.isArray(data)) {
    return false
  }
  return data.length > 0
}

/**
 * Check if user owns an item (user exists, has ID, and item has matching author_id)
 * Mutation-resistant: explicit checks
 */
export function doesUserOwnItem(
  user: User | null | undefined,
  itemAuthorId: string | null | undefined
): boolean {
  if (!isValidUser(user)) {
    return false
  }
  if (itemAuthorId == null || itemAuthorId === '') {
    return false
  }
  return user.id === itemAuthorId
}

/**
 * Check if user can delete item (user exists, has ID, and item has author_id matching user)
 * Mutation-resistant: explicit checks
 */
export function canUserDeleteItem(
  user: User | null | undefined,
  itemAuthorId: string | null | undefined
): boolean {
  return doesUserOwnItem(user, itemAuthorId)
}

/**
 * Get user ID safely
 * Mutation-resistant: explicit null check
 */
export function getUserId(user: User | null | undefined): string | null {
  if (!isValidUser(user)) {
    return null
  }
  return user.id
}

/**
 * Get user display name (username or email)
 * Mutation-resistant: explicit checks
 */
export function getUserDisplayName(user: User | null | undefined): string | null {
  if (!isValidUser(user)) {
    return null
  }
  return logicalOrToNull(logicalOr(user.username, user.email))
}
