/**
 * Null Check Utilities
 * Centralized null/undefined checking to eliminate DRY violations
 * DRY: Single source of truth for null checks
 */ /**
 * Type guard to check if value is not null or undefined
 * DRY: Replaces repeated (value !== null && value !== undefined) patterns
 */ export function isNotNullOrUndefined(value) {
    return value !== null && value !== undefined;
}
/**
 * Check if a Set has size greater than threshold
 * DRY: Replaces repeated (set !== null && set !== undefined && set.size > threshold) patterns
 */ export function hasSize(set, threshold = 1) {
    return isNotNullOrUndefined(set) && set.size > threshold;
}
/**
 * Check if multiple nodes are selected
 * DRY: Replaces repeated (selectedNodeIds !== null && selectedNodeIds !== undefined && selectedNodeIds.size > 1) patterns
 */ export function hasMultipleSelected(selectedNodeIds) {
    return hasSize(selectedNodeIds, 1);
}
/**
 * Check if value is explicitly false (not just falsy)
 * DRY: Replaces repeated (value === false) patterns
 */ export function isExplicitlyFalse(value) {
    return value === false;
}
/**
 * Check if value is truthy and not empty
 * DRY: Common pattern for checking if values exist
 */ export function isNotEmpty(value) {
    return isNotNullOrUndefined(value) && value !== '';
}
/**
 * Check if array exists and has items
 * DRY: Common pattern for checking arrays
 */ export function hasItems(array) {
    return isNotNullOrUndefined(array) && Array.isArray(array) && array.length > 0;
}
/**
 * Check if array is non-empty (alias for hasItems)
 * DRY: Common pattern for checking arrays
 */ export function isNonEmptyArray(array) {
    return hasItems(array);
}
/**
 * Get safe array (returns empty array if null/undefined)
 * DRY: Replaces repeated (array !== null && array !== undefined && Array.isArray(array) ? array : []) patterns
 */ export function safeArray(array) {
    return isNotNullOrUndefined(array) && Array.isArray(array) ? array : [];
}
/**
 * Get value or default if null/undefined
 * DRY: Replaces repeated ternary patterns
 */ export function getOrDefault(value, defaultValue) {
    return isNotNullOrUndefined(value) ? value : defaultValue;
}
