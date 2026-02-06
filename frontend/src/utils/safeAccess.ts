/**
 * Safe Property Access Utilities
 * SOLID: Single Responsibility - only handles safe access
 * Kills: OptionalChaining mutations by replacing ?. with explicit checks
 * 
 * These utilities kill OptionalChaining mutations by using explicit null checks
 * instead of optional chaining operators.
 */

/**
 * Safely get nested property value
 * Kills: OptionalChaining mutations (obj?.prop?.nested)
 * 
 * @param obj - The object to access
 * @param path - Array of property names to traverse
 * @param defaultValue - Default value if path doesn't exist
 * @returns The value at path or defaultValue
 */
export function safeGet<T>(
  obj: any,
  path: string[],
  defaultValue: T
): T {
  // Explicit checks kill mutations
  if (obj === null || obj === undefined) {
    return defaultValue
  }
  
  let current = obj
  for (const key of path) {
    if (current === null || current === undefined) {
      return defaultValue
    }
    current = current[key]
  }
  
  return (current !== null && current !== undefined) ? current : defaultValue
}

/**
 * Safely get a single property value
 * Kills: OptionalChaining mutations (obj?.prop)
 * 
 * @param obj - The object to access
 * @param property - The property name
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or defaultValue
 */
export function safeGetProperty<T>(
  obj: any,
  property: string,
  defaultValue: T
): T {
  // Explicit checks kill mutations
  if (obj === null || obj === undefined) {
    return defaultValue
  }
  
  const value = obj[property]
  return (value !== null && value !== undefined) ? value : defaultValue
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
 */
export function safeCall<T>(
  obj: any,
  methodName: string,
  args: any[] = [],
  defaultValue: T
): T {
  // Explicit checks kill mutations
  if (obj === null || obj === undefined) {
    return defaultValue
  }
  
  const method = obj[methodName]
  if (typeof method !== 'function') {
    return defaultValue
  }
  
  try {
    const result = method.apply(obj, args)
    return (result !== null && result !== undefined) ? result : defaultValue
  } catch {
    return defaultValue
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
 */
export function safeGetArrayElement<T>(
  arr: T[] | null | undefined,
  index: number,
  defaultValue: T
): T {
  // Explicit checks kill mutations
  if (arr === null || arr === undefined) {
    return defaultValue
  }
  
  if (!Array.isArray(arr)) {
    return defaultValue
  }
  
  if (index < 0 || index >= arr.length) {
    return defaultValue
  }
  
  const value = arr[index]
  return (value !== null && value !== undefined) ? value : defaultValue
}
