/**
 * Tests for hooks/utils/formUtils.ts
 * This file is a re-export file, so we verify that exports are correctly re-exported
 */

import {
  getNestedValue,
  setNestedValue,
  hasNestedValue,
} from './formUtils'
import {
  getNestedValue as getNestedValueOriginal,
  setNestedValue as setNestedValueOriginal,
  hasNestedValue as hasNestedValueOriginal,
} from '../../utils/formUtils'

describe('hooks/utils/formUtils (re-export)', () => {
  describe('exports verification', () => {
    it('should export getNestedValue', () => {
      expect(getNestedValue).toBeDefined()
      expect(typeof getNestedValue).toBe('function')
    })

    it('should export setNestedValue', () => {
      expect(setNestedValue).toBeDefined()
      expect(typeof setNestedValue).toBe('function')
    })

    it('should export hasNestedValue', () => {
      expect(hasNestedValue).toBeDefined()
      expect(typeof hasNestedValue).toBe('function')
    })
  })

  describe('re-export correctness', () => {
    it('should re-export getNestedValue from utils/formUtils', () => {
      expect(getNestedValue).toBe(getNestedValueOriginal)
    })

    it('should re-export setNestedValue from utils/formUtils', () => {
      expect(setNestedValue).toBe(setNestedValueOriginal)
    })

    it('should re-export hasNestedValue from utils/formUtils', () => {
      expect(hasNestedValue).toBe(hasNestedValueOriginal)
    })
  })

  describe('functionality verification', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
        },
      },
    }

    it('should getNestedValue work correctly', () => {
      expect(getNestedValue(testObj, 'user.profile.name')).toBe('John')
    })

    it('should setNestedValue work correctly', () => {
      const result = setNestedValue(testObj, 'user.profile.name', 'Jane')
      expect(result.user.profile.name).toBe('Jane')
    })

    it('should hasNestedValue work correctly', () => {
      expect(hasNestedValue(testObj, 'user.profile.name')).toBe(true)
      expect(hasNestedValue(testObj, 'user.profile.email')).toBe(false)
    })
  })
})
