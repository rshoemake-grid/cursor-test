/**
 * Tests for Safe Ref Access Helpers
 * Tests mutation-resistant ref access helpers
 */

import { safeGetTabsRefCurrent } from './safeRefs'

describe('safeGetTabsRefCurrent', () => {
  it('should return null when tabsRef is null', () => {
    const result = safeGetTabsRefCurrent(null)
    expect(result).toBeNull()
  })

  it('should return null when tabsRef is undefined', () => {
    const result = safeGetTabsRefCurrent(undefined)
    expect(result).toBeNull()
  })

  it('should return null when tabsRef.current is null', () => {
    const tabsRef = {
      current: null,
    } as React.MutableRefObject<any[]>
    const result = safeGetTabsRefCurrent(tabsRef)
    expect(result).toBeNull()
  })

  it('should return null when tabsRef.current is undefined', () => {
    const tabsRef = {
      current: undefined,
    } as React.MutableRefObject<any[]>
    const result = safeGetTabsRefCurrent(tabsRef)
    expect(result).toBeNull()
  })

  it('should return valid array when tabsRef.current is valid', () => {
    const validArray = [{ id: '1' }, { id: '2' }]
    const tabsRef = {
      current: validArray,
    } as React.MutableRefObject<any[]>
    const result = safeGetTabsRefCurrent(tabsRef)
    expect(result).toBe(validArray)
    expect(result).toEqual(validArray)
  })

  it('should catch and handle property access errors', () => {
    // Create a proxy that throws on property access
    const tabsRef = new Proxy(
      {} as React.MutableRefObject<any[]>,
      {
        get: () => {
          throw new Error('Property access error')
        },
      }
    )
    const result = safeGetTabsRefCurrent(tabsRef)
    expect(result).toBeNull()
  })

  it('should return valid value for non-array types', () => {
    const validObject = { test: 'value' }
    const tabsRef = {
      current: validObject,
    } as React.MutableRefObject<any>
    const result = safeGetTabsRefCurrent(tabsRef)
    expect(result).toBe(validObject)
  })
})
