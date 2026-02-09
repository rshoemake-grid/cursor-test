/**
 * Tests for environment utilities
 * 
 * Verifies that environment detection correctly identifies browser vs server environments.
 */

import { isBrowserEnvironment, isServerEnvironment } from './environment'

describe('environment utilities', () => {
  describe('isBrowserEnvironment', () => {
    it('should return true when window is defined', () => {
      // In Jest/jsdom, window is always defined
      expect(isBrowserEnvironment()).toBe(true)
    })

    it('should check typeof window correctly', () => {
      // The function checks typeof window !== 'undefined'
      // In jsdom environment, window exists, so this should be true
      expect(typeof window).not.toBe('undefined')
      expect(isBrowserEnvironment()).toBe(true)
    })

    it('should return true even if window is an empty object', () => {
      ;(global as any).window = {}
      expect(isBrowserEnvironment()).toBe(true)
    })

    it('should return true even if window has properties', () => {
      ;(global as any).window = {
        document: {},
        localStorage: {},
      }
      expect(isBrowserEnvironment()).toBe(true)
    })
  })

  describe('isServerEnvironment', () => {
    it('should return false when window is defined', () => {
      // In Jest/jsdom, window is always defined
      expect(isServerEnvironment()).toBe(false)
    })

    it('should check typeof window correctly', () => {
      // The function checks typeof window === 'undefined'
      // In jsdom environment, window exists, so this should be false
      expect(typeof window).not.toBe('undefined')
      expect(isServerEnvironment()).toBe(false)
    })

    it('should return false even if window is an empty object', () => {
      ;(global as any).window = {}
      expect(isServerEnvironment()).toBe(false)
    })

    it('should return false even if window has properties', () => {
      ;(global as any).window = {
        document: {},
        localStorage: {},
      }
      expect(isServerEnvironment()).toBe(false)
    })
  })

  describe('complementary behavior', () => {
    it('should be complementary - isServerEnvironment is opposite of isBrowserEnvironment', () => {
      // Test with window defined
      ;(global as any).window = {}
      expect(isServerEnvironment()).toBe(!isBrowserEnvironment())

      // Test with window undefined
      delete (global as any).window
      expect(isServerEnvironment()).toBe(!isBrowserEnvironment())
    })
  })

  describe('real-world scenarios', () => {
    it('should correctly identify browser environment in typical browser', () => {
      // In Jest/jsdom, window is available (simulating browser)
      expect(isBrowserEnvironment()).toBe(true)
      expect(isServerEnvironment()).toBe(false)
    })

    it('should use typeof check for environment detection', () => {
      // The functions use typeof window checks which work correctly
      // In browser: typeof window !== 'undefined' -> true
      // In server: typeof window === 'undefined' -> true
      // In Jest/jsdom: window exists, so browser environment
      expect(typeof window).not.toBe('undefined')
      expect(isBrowserEnvironment()).toBe(true)
      expect(isServerEnvironment()).toBe(false)
    })

    it('should handle the typeof check correctly', () => {
      // Verify the implementation uses typeof check
      // This is the correct way to check for window in both browser and server
      const windowExists = typeof window !== 'undefined'
      expect(isBrowserEnvironment()).toBe(windowExists)
      expect(isServerEnvironment()).toBe(!windowExists)
    })
  })
})
