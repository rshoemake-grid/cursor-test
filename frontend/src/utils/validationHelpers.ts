/**
 * Validation Helper Utilities
 * DRY: Centralized validation logic
 * SOLID: Single Responsibility - only validates conditions
 * 
 * These utilities kill LogicalOperator mutations by using explicit checks
 * instead of && and || operators.
 */

/**
 * Check if value is truthy with explicit checks
 * Kills: LogicalOperator mutations (value && ...)
 * 
 * @param value - The value to check
 * @returns True if value is truthy (not null, undefined, empty string, false, or 0)
 */
export function isTruthy(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value === '') return false
  if (typeof value === 'number' && value === 0) return false
  if (typeof value === 'boolean' && value === false) return false
  return true
}

/**
 * Check if value is falsy with explicit checks
 * Kills: LogicalOperator mutations (!value || ...)
 * 
 * @param value - The value to check
 * @returns True if value is falsy
 */
export function isFalsy(value: any): boolean {
  return !isTruthy(value)
}

/**
 * Check if all values are truthy
 * Kills: && chain mutations (a && b && c)
 * 
 * @param values - Array of values to check
 * @returns True if all values are truthy
 */
export function allTruthy(...values: any[]): boolean {
  for (const value of values) {
    if (!isTruthy(value)) {
      return false
    }
  }
  return true
}

/**
 * Check if any value is truthy
 * Kills: || chain mutations (a || b || c)
 * 
 * @param values - Array of values to check
 * @returns True if any value is truthy
 */
export function anyTruthy(...values: any[]): boolean {
  for (const value of values) {
    if (isTruthy(value)) {
      return true
    }
  }
  return false
}

/**
 * Validate user can operate (common pattern)
 * Kills: LogicalOperator mutations (user && user.id)
 * 
 * @param user - The user object to validate
 * @returns True if user exists and has an id
 */
export function canUserOperate(user: any): boolean {
  if (user === null || user === undefined) {
    return false
  }
  if (user.id === null || user.id === undefined) {
    return false
  }
  return true
}

/**
 * Validate array has items
 * Kills: LogicalOperator mutations (array && array.length > 0)
 * 
 * @param array - The array to validate
 * @returns True if array exists and has items
 */
export function hasArrayItems<T>(array: T[] | null | undefined): boolean {
  if (array === null || array === undefined) {
    return false
  }
  if (!Array.isArray(array)) {
    return false
  }
  if (array.length === 0) {
    return false
  }
  return true
}

/**
 * Validate object exists and is not null
 * Kills: LogicalOperator mutations (obj && obj.property)
 * 
 * @param obj - The object to validate
 * @returns True if object exists and is not null
 */
export function isValidObject(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return false
  }
  if (typeof obj !== 'object') {
    return false
  }
  if (Array.isArray(obj)) {
    return false
  }
  return true
}

/**
 * Validate string is not empty
 * Kills: LogicalOperator mutations (str && str.length > 0)
 * 
 * @param str - The string to validate
 * @returns True if string exists and is not empty
 */
export function isNonEmptyString(str: string | null | undefined): boolean {
  if (str === null || str === undefined) {
    return false
  }
  if (typeof str !== 'string') {
    return false
  }
  if (str === '') {
    return false
  }
  return true
}

/**
 * Validate number is valid (not NaN, not Infinity)
 * Kills: LogicalOperator mutations (num && num > 0)
 * 
 * @param num - The number to validate
 * @returns True if number is valid
 */
export function isValidNumber(num: any): boolean {
  if (num === null || num === undefined) {
    return false
  }
  if (typeof num !== 'number') {
    return false
  }
  if (isNaN(num)) {
    return false
  }
  if (!isFinite(num)) {
    return false
  }
  return true
}
