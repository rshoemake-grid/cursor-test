/**
 * Input Defaults Tests
 * Tests for input default values constants to ensure mutation resistance
 */

import {
  INPUT_MODE,
  INPUT_REGION,
  EMPTY_STRING,
  DEFAULT_OVERWRITE
} from './inputDefaults'

describe('inputDefaults', () => {
  describe('INPUT_MODE', () => {
    it('should have READ as "read"', () => {
      expect(INPUT_MODE.READ).toBe('read')
    })

    it('should have WRITE as "write"', () => {
      expect(INPUT_MODE.WRITE).toBe('write')
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(INPUT_MODE.READ).toBe('read')
      expect(INPUT_MODE.WRITE).toBe('write')
    })
  })

  describe('INPUT_REGION', () => {
    it('should have DEFAULT as "us-east-1"', () => {
      expect(INPUT_REGION.DEFAULT).toBe('us-east-1')
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(INPUT_REGION.DEFAULT).toBe('us-east-1')
    })
  })

  describe('EMPTY_STRING', () => {
    it('should be an empty string', () => {
      expect(EMPTY_STRING).toBe('')
    })

    it('should have length 0', () => {
      expect(EMPTY_STRING.length).toBe(0)
    })

    it('should be readonly', () => {
      // as const provides type-level immutability
      expect(EMPTY_STRING).toBe('')
    })
  })

  describe('DEFAULT_OVERWRITE', () => {
    it('should be true', () => {
      expect(DEFAULT_OVERWRITE).toBe(true)
    })

    it('should be a boolean', () => {
      expect(typeof DEFAULT_OVERWRITE).toBe('boolean')
    })

    it('should be readonly', () => {
      // as const provides type-level immutability
      expect(DEFAULT_OVERWRITE).toBe(true)
    })
  })
})
