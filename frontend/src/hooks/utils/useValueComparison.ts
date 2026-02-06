/**
 * Value Comparison Utilities
 * Extracted for better testability, mutation resistance, and SRP compliance
 * Single Responsibility: Only handles value comparison logic
 * Open/Closed: Accepts comparison strategy function for extensibility
 */

/**
 * Default comparison strategy for objects/arrays
 * Uses JSON.stringify for shallow comparison
 * 
 * @template T - Type of value being compared
 * @param current - Current value
 * @param previous - Previous value
 * @returns True if values are different
 */
export function defaultComparisonStrategy<T>(current: T, previous: T): boolean {
  if (typeof current === 'object' && current !== null) {
    return JSON.stringify(current) !== JSON.stringify(previous)
  }
  return current !== previous
}

/**
 * Check if value has changed
 * Mutation-resistant: explicit checks
 * OCP: Accepts comparison strategy function for extensibility
 * 
 * @template T - Type of value being compared
 * @param current - Current value
 * @param previous - Previous value
 * @param strategy - Optional comparison strategy function
 * @returns True if value has changed
 */
export function hasValueChanged<T>(
  current: T,
  previous: T,
  strategy: (current: T, previous: T) => boolean = defaultComparisonStrategy
): boolean {
  return strategy(current, previous)
}
