/**
 * Tests for Nullish Coalescing Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import { nullishCoalesce, nullishCoalesceToNull } from './nullishCoalescing'

describe('nullishCoalesce', () => {
  it('should return value when not null/undefined', () => {
    expect(nullishCoalesce('test', 'default')).toBe('test')
    expect(nullishCoalesce(0, 1)).toBe(0)
    expect(nullishCoalesce(false, true)).toBe(false)
    expect(nullishCoalesce('', 'default')).toBe('')
  })

  it('should return default when value is null', () => {
    expect(nullishCoalesce(null, 'default')).toBe('default')
    expect(nullishCoalesce(null, 0)).toBe(0)
  })

  it('should return default when value is undefined', () => {
    expect(nullishCoalesce(undefined, 'default')).toBe('default')
    expect(nullishCoalesce(undefined, 0)).toBe(0)
  })
})

describe('nullishCoalesceToNull', () => {
  it('should return value when not null/undefined', () => {
    expect(nullishCoalesceToNull('test')).toBe('test')
    expect(nullishCoalesceToNull(0)).toBe(0)
    expect(nullishCoalesceToNull(false)).toBe(false)
  })

  it('should return null when value is null', () => {
    expect(nullishCoalesceToNull(null)).toBeNull()
  })

  it('should return null when value is undefined', () => {
    expect(nullishCoalesceToNull(undefined)).toBeNull()
  })
})
