/**
 * Tests for Value Comparison Utilities
 * Tests value comparison functionality
 */

import {
  defaultComparisonStrategy,
  hasValueChanged,
} from './useValueComparison'

describe('defaultComparisonStrategy', () => {
  it('should return false for identical primitives', () => {
    expect(defaultComparisonStrategy('test', 'test')).toBe(false)
    expect(defaultComparisonStrategy(123, 123)).toBe(false)
    expect(defaultComparisonStrategy(true, true)).toBe(false)
  })

  it('should return true for different primitives', () => {
    expect(defaultComparisonStrategy('test', 'test2')).toBe(true)
    expect(defaultComparisonStrategy(123, 456)).toBe(true)
    expect(defaultComparisonStrategy(true, false)).toBe(true)
  })

  it('should compare objects using JSON.stringify', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, b: 2 }
    const obj3 = { a: 1, b: 3 }

    expect(defaultComparisonStrategy(obj1, obj2)).toBe(false)
    expect(defaultComparisonStrategy(obj1, obj3)).toBe(true)
  })

  it('should compare arrays using JSON.stringify', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [1, 2, 3]
    const arr3 = [1, 2, 4]

    expect(defaultComparisonStrategy(arr1, arr2)).toBe(false)
    expect(defaultComparisonStrategy(arr1, arr3)).toBe(true)
  })

  it('should handle null values', () => {
    expect(defaultComparisonStrategy(null, null)).toBe(false)
    expect(defaultComparisonStrategy(null, {})).toBe(true)
    expect(defaultComparisonStrategy({}, null)).toBe(true)
  })

  it('should handle nested objects', () => {
    const obj1 = { a: { b: 1 } }
    const obj2 = { a: { b: 1 } }
    const obj3 = { a: { b: 2 } }

    expect(defaultComparisonStrategy(obj1, obj2)).toBe(false)
    expect(defaultComparisonStrategy(obj1, obj3)).toBe(true)
  })

  it('should handle empty objects', () => {
    expect(defaultComparisonStrategy({}, {})).toBe(false)
    expect(defaultComparisonStrategy({}, { a: 1 })).toBe(true)
  })

  it('should handle empty arrays', () => {
    expect(defaultComparisonStrategy([], [])).toBe(false)
    expect(defaultComparisonStrategy([], [1])).toBe(true)
  })
})

describe('hasValueChanged', () => {
  it('should use defaultComparisonStrategy by default', () => {
    expect(hasValueChanged('test', 'test')).toBe(false)
    expect(hasValueChanged('test', 'test2')).toBe(true)
  })

  it('should use custom strategy when provided', () => {
    const customStrategy = jest.fn((a: string, b: string) => a.length !== b.length)
    
    expect(hasValueChanged('test', 'test', customStrategy)).toBe(false)
    expect(customStrategy).toHaveBeenCalledWith('test', 'test')
    
    expect(hasValueChanged('test', 'test2', customStrategy)).toBe(true)
    expect(customStrategy).toHaveBeenCalledWith('test', 'test2')
  })

  it('should handle object comparison with default strategy', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 1 }
    const obj3 = { a: 2 }

    expect(hasValueChanged(obj1, obj2)).toBe(false)
    expect(hasValueChanged(obj1, obj3)).toBe(true)
  })

  it('should handle array comparison with default strategy', () => {
    const arr1 = [1, 2]
    const arr2 = [1, 2]
    const arr3 = [1, 3]

    expect(hasValueChanged(arr1, arr2)).toBe(false)
    expect(hasValueChanged(arr1, arr3)).toBe(true)
  })

  it('should handle null and undefined', () => {
    expect(hasValueChanged(null, null)).toBe(false)
    expect(hasValueChanged(null, undefined)).toBe(true)
    expect(hasValueChanged(undefined, undefined)).toBe(false)
  })

  it('should handle custom strategy for deep equality', () => {
    const deepEqualStrategy = (a: any, b: any) => {
      return JSON.stringify(a) !== JSON.stringify(b)
    }

    const obj1 = { a: { b: 1 } }
    const obj2 = { a: { b: 1 } }
    const obj3 = { a: { b: 2 } }

    expect(hasValueChanged(obj1, obj2, deepEqualStrategy)).toBe(false)
    expect(hasValueChanged(obj1, obj3, deepEqualStrategy)).toBe(true)
  })

  it('should handle custom strategy for reference equality', () => {
    const referenceEqualStrategy = (a: any, b: any) => a !== b

    const obj1 = { a: 1 }
    const obj2 = { a: 1 } // Different reference, same content
    const obj3 = obj1 // Same reference

    expect(hasValueChanged(obj1, obj2, referenceEqualStrategy)).toBe(true)
    expect(hasValueChanged(obj1, obj3, referenceEqualStrategy)).toBe(false)
  })

  it('should handle edge cases with custom strategy', () => {
    const alwaysTrueStrategy = () => true
    const alwaysFalseStrategy = () => false

    expect(hasValueChanged('a', 'a', alwaysTrueStrategy)).toBe(true)
    expect(hasValueChanged('a', 'b', alwaysFalseStrategy)).toBe(false)
  })
})
