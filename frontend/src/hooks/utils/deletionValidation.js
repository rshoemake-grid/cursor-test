/**
 * Deletion Validation Utilities
 * Extracted from deletion hooks for better testability and mutation resistance
 * Single Responsibility: Only validates deletion conditions
 */ import { hasArrayItems, getArrayLength } from './arrayValidation';
/**
 * Check if there are official items that cannot be deleted
 * Mutation-resistant: explicit length check
 */ export function hasOfficialItems(items) {
    const officialItems = items.filter((item)=>item.is_official === true);
    return hasArrayItems(officialItems);
}
/**
 * Check if user owns any deletable items
 * Mutation-resistant: explicit length check
 */ export function hasUserOwnedItems(userOwnedItems) {
    return hasArrayItems(userOwnedItems);
}
/**
 * Check if user owns no items (empty array)
 * Mutation-resistant: explicit length check
 */ export function hasNoUserOwnedItems(userOwnedItems) {
    return !hasUserOwnedItems(userOwnedItems);
}
/**
 * Check if user owns all selected items
 * Mutation-resistant: explicit length comparison
 */ export function ownsAllItems(userOwnedCount, totalDeletableCount) {
    return userOwnedCount === totalDeletableCount && userOwnedCount > 0;
}
/**
 * Check if user owns some but not all items (partial ownership)
 * Mutation-resistant: explicit length comparison
 */ export function ownsPartialItems(userOwnedCount, totalDeletableCount) {
    return userOwnedCount > 0 && userOwnedCount < totalDeletableCount;
}
/**
 * Check if there are items with author_id set
 * Mutation-resistant: explicit filter and length check
 */ export function hasItemsWithAuthorId(items) {
    const itemsWithAuthorId = items.filter((item)=>item.author_id != null && item.author_id !== '');
    return hasArrayItems(itemsWithAuthorId);
}
/**
 * Get count of items with author_id
 * Mutation-resistant: explicit filter and length
 */ export function getItemsWithAuthorIdCount(items) {
    const itemsWithAuthorId = items.filter((item)=>item.author_id != null && item.author_id !== '');
    return getArrayLength(itemsWithAuthorId);
}
