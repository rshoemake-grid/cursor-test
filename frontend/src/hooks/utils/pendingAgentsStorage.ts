/**
 * Pending Agents Storage Utilities
 * Extracted storage operations to improve DRY compliance
 * Single Responsibility: Only handles pending agents storage operations
 */

import type { StorageAdapter } from '../../types/adapters'
import { PENDING_AGENTS_STORAGE_KEY } from './marketplaceConstants'

/**
 * Clear pending agents from storage
 * DRY: Centralized storage operation
 * Mutation-resistant: explicit null/undefined checks
 */
export function clearPendingAgents(
  storage: StorageAdapter | null
): void {
  if (storage !== null && storage !== undefined) {
    storage.removeItem(PENDING_AGENTS_STORAGE_KEY)
  }
}
