/**
 * Logical OR Utilities
 * Extracted for better testability and mutation resistance
 * Single Responsibility: Only handles logical OR operations
 */ /**
 * Get first truthy value or fallback
 * Mutation-resistant: explicit checks
 * 
 * @param value The primary value
 * @param fallback The fallback value
 * @returns value if truthy, otherwise fallback
 */ export function logicalOr(value, fallback) {
    if (value) {
        return value;
    }
    return fallback;
}
/**
 * Get first truthy value or null
 * Mutation-resistant: explicit checks
 * 
 * @param value The primary value
 * @returns value if truthy, otherwise null
 */ export function logicalOrToNull(value) {
    if (value) {
        return value;
    }
    return null;
}
/**
 * Get first truthy value or empty object
 * Mutation-resistant: explicit checks
 * 
 * @param value The primary value
 * @returns value if truthy, otherwise {}
 */ export function logicalOrToEmptyObject(value) {
    if (value) {
        return value;
    }
    return {};
}
/**
 * Get first truthy value or empty array
 * Mutation-resistant: explicit checks
 * 
 * @param value The primary value
 * @returns value if truthy, otherwise []
 */ export function logicalOrToEmptyArray(value) {
    if (value) {
        return value;
    }
    return [];
}
/**
 * Get first truthy value or undefined
 * Mutation-resistant: explicit checks
 * Useful for omitting fields from JSON when falsy
 * 
 * @param value The value to check
 * @returns value if truthy, otherwise undefined
 */ export function logicalOrToUndefined(value) {
    if (value) {
        return value;
    }
    return undefined;
}
