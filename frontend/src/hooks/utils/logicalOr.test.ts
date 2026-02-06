/**
 * Tests for Logical OR Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import {
  logicalOr,
  logicalOrToNull,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray,
} from './logicalOr'

describe('logicalOr', () => {
  it('should return value when truthy', () => {
    expect(logicalOr('test', 'default')).toBe('test')
    expect(logicalOr(1, 0)).toBe(1)
    expect(logicalOr(true, false)).toBe(true)
  })

  it('should return fallback when value is falsy', () => {
    expect(logicalOr(null, 'default')).toBe('default')
    expect(logicalOr(undefined, 'default')).toBe('default')
    expect(logicalOr('', 'default')).toBe('default')
    expect(logicalOr(0, 1)).toBe(1)
    expect(logicalOr(false, true)).toBe(true)
  })

  it('should handle undefined fallback', () => {
    expect(logicalOr(null, undefined)).toBeUndefined()
    expect(logicalOr(undefined, undefined)).toBeUndefined()
    expect(logicalOr('test', undefined)).toBe('test')
  })
})

describe('logicalOrToNull', () => {
  it('should return value when truthy', () => {
    expect(logicalOrToNull('test')).toBe('test')
    expect(logicalOrToNull(1)).toBe(1)
    expect(logicalOrToNull(true)).toBe(true)
  })

  it('should return null when value is falsy', () => {
    expect(logicalOrToNull(null)).toBeNull()
    expect(logicalOrToNull(undefined)).toBeNull()
    expect(logicalOrToNull('')).toBeNull()
    expect(logicalOrToNull(0)).toBeNull()
    expect(logicalOrToNull(false)).toBeNull()
  })
})

describe('logicalOrToEmptyObject', () => {
  it('should return value when truthy', () => {
    const obj = { a: 1 }
    expect(logicalOrToEmptyObject(obj)).toBe(obj)
  })

  it('should return empty object when value is falsy', () => {
    expect(logicalOrToEmptyObject(null)).toEqual({})
    expect(logicalOrToEmptyObject(undefined)).toEqual({})
  })
})

describe('logicalOrToEmptyArray', () => {
  it('should return value when truthy', () => {
    const arr = [1, 2, 3]
    expect(logicalOrToEmptyArray(arr)).toBe(arr)
  })

  it('should return empty array when value is falsy', () => {
    expect(logicalOrToEmptyArray(null)).toEqual([])
    expect(logicalOrToEmptyArray(undefined)).toEqual([])
  })
})
