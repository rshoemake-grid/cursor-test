/**
 * Safe Property Access Utilities
 * SOLID: Single Responsibility - only handles safe access
 * Kills: OptionalChaining mutations by replacing ?. with explicit checks
 * 
 * These utilities kill OptionalChaining mutations by using explicit null checks
 * instead of optional chaining operators.
 */ import { isNullOrUndefined } from './typeGuards';
// isDefined intentionally not imported - not used in this file
import { coalesce } from './coalesce';
/**
 * Safely get nested property value
 * Kills: OptionalChaining mutations (obj?.prop?.nested)
 * 
 * @param obj - The object to access
 * @param path - Array of property names to traverse
 * @param defaultValue - Default value if path doesn't exist
 * @returns The value at path or defaultValue
 */ export function safeGet(obj, path, defaultValue) {
    // Explicit checks kill mutations
    if (isNullOrUndefined(obj)) {
        return defaultValue;
    }
    let current = obj;
    for (const key of path){
        if (isNullOrUndefined(current)) {
            return defaultValue;
        }
        current = current[key];
    }
    return coalesce(current, defaultValue);
}
/**
 * Safely get a single property value
 * Kills: OptionalChaining mutations (obj?.prop)
 * 
 * @param obj - The object to access
 * @param property - The property name
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or defaultValue
 */ export function safeGetProperty(obj, property, defaultValue) {
    // Explicit checks kill mutations
    if (isNullOrUndefined(obj)) {
        return defaultValue;
    }
    const value = obj[property];
    return coalesce(value, defaultValue);
}
/**
 * Safely call a method if it exists
 * Kills: OptionalChaining mutations (obj?.method?.())
 * 
 * @param obj - The object that may have the method
 * @param methodName - The method name
 * @param args - Arguments to pass to the method
 * @param defaultValue - Default value if method doesn't exist or returns null/undefined
 * @returns The method result or defaultValue
 */ export function safeCall(obj, methodName, args = [], defaultValue) {
    // Explicit checks kill mutations
    if (isNullOrUndefined(obj)) {
        return defaultValue;
    }
    const method = obj[methodName];
    if (typeof method !== 'function') {
        return defaultValue;
    }
    try {
        const result = method.apply(obj, args);
        return coalesce(result, defaultValue);
    } catch  {
        return defaultValue;
    }
}
/**
 * Safely access array element
 * Kills: OptionalChaining mutations (arr?.[index])
 * 
 * @param arr - The array to access
 * @param index - The array index
 * @param defaultValue - Default value if index doesn't exist
 * @returns The array element or defaultValue
 */ export function safeGetArrayElement(arr, index, defaultValue) {
    // Explicit checks kill mutations
    if (isNullOrUndefined(arr)) {
        return defaultValue;
    }
    if (!Array.isArray(arr)) {
        return defaultValue;
    }
    if (index < 0 || index >= arr.length) {
        return defaultValue;
    }
    const value = arr[index];
    return coalesce(value, defaultValue);
}
