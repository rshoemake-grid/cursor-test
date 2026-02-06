/**
 * Ownership Utilities (Hooks)
 * Re-exports from utils/ownershipUtils for convenience in hooks
 * 
 * This file provides a convenient import path for hooks that need ownership utilities.
 * The actual implementation is in utils/ownershipUtils.ts to avoid duplication.
 */

import { isOwner, type OwnableItem, type User } from '../../utils/ownershipUtils'
import { nullishCoalesceToNull } from './nullishCoalescing'

export type { OwnableItem, User }

/**
 * Re-export existing functions with hook-friendly names
 */
export {
  isOwner as isUserOwned,
  filterOwnedItems as filterUserOwned,
  separateOfficialItems,
  filterUserOwnedDeletableItems,
} from '../../utils/ownershipUtils'

/**
 * Check if user can delete an item
 * Item must be owned by user and not be official
 * 
 * @param item Item to check
 * @param user User to check against
 * @returns True if user can delete the item
 */
export function canUserDelete(item: OwnableItem | null | undefined, user: User | null | undefined): boolean {
  if (!item || item.is_official) {
    return false
  }
  
  // isOwner expects User | null, not undefined
  return isOwner(item, nullishCoalesceToNull(user))
}
