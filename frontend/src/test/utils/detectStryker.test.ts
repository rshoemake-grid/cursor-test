/**
 * Tests for Stryker detection utility
 */

import { isRunningUnderStryker, getStrykerSandboxId } from './detectStryker'

describe('detectStryker', () => {
  const originalEnv = process.env
  const originalCwd = process.cwd
  const originalArgv = process.argv

  // Skip these tests when actually running under Stryker (they would always fail)
  const isActuallyRunningUnderStryker = () => {
    try {
      const cwd = process.cwd()
      return cwd.includes('.stryker-tmp') || cwd.includes('sandbox-')
    } catch {
      return false
    }
  }

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
    // Reset cwd mock
    if (typeof process.cwd !== 'function') {
      process.cwd = originalCwd
    }
  })

  afterEach(() => {
    process.env = originalEnv
    process.cwd = originalCwd
    process.argv = originalArgv
  })

  describe('isRunningUnderStryker', () => {
    // Skip tests that check for "not under Stryker" when actually running under Stryker
    const skipIfUnderStryker = isActuallyRunningUnderStryker() ? it.skip : it

    skipIfUnderStryker('should return false when STRYKER_MUTATOR is not set', () => {
      delete process.env.STRYKER_MUTATOR
      // Mock cwd to not be in sandbox
      const mockCwd = jest.fn(() => '/normal/path')
      process.cwd = mockCwd as any
      // Clear argv
      process.argv = ['node', 'jest', 'test']
      expect(isRunningUnderStryker()).toBe(false)
    })

    it('should return true when STRYKER_MUTATOR is "true"', () => {
      process.env.STRYKER_MUTATOR = 'true'
      expect(isRunningUnderStryker()).toBe(true)
    })

    it('should return true when STRYKER_MUTATOR is "1"', () => {
      process.env.STRYKER_MUTATOR = '1'
      expect(isRunningUnderStryker()).toBe(true)
    })

    skipIfUnderStryker('should return false when STRYKER_MUTATOR is "false"', () => {
      process.env.STRYKER_MUTATOR = 'false'
      // Mock cwd to not be in sandbox
      const mockCwd = jest.fn(() => '/normal/path')
      process.cwd = mockCwd as any
      // Clear argv
      process.argv = ['node', 'jest', 'test']
      expect(isRunningUnderStryker()).toBe(false)
    })

    it('should return true when process.argv contains "stryker"', () => {
      process.argv = ['node', 'stryker', 'run']
      // Mock cwd to not be in sandbox (to isolate argv check)
      const mockCwd = jest.fn(() => '/normal/path')
      process.cwd = mockCwd as any
      delete process.env.STRYKER_MUTATOR
      expect(isRunningUnderStryker()).toBe(true)
    })

    it('should return true when process.argv contains "STRYKER"', () => {
      process.argv = ['node', 'STRYKER', 'run']
      // Mock cwd to not be in sandbox (to isolate argv check)
      const mockCwd = jest.fn(() => '/normal/path')
      process.cwd = mockCwd as any
      delete process.env.STRYKER_MUTATOR
      expect(isRunningUnderStryker()).toBe(true)
    })

    skipIfUnderStryker('should return false when process.argv does not contain stryker', () => {
      process.argv = ['node', 'jest', 'test']
      // Mock cwd to not be in sandbox
      const mockCwd = jest.fn(() => '/normal/path')
      process.cwd = mockCwd as any
      delete process.env.STRYKER_MUTATOR
      expect(isRunningUnderStryker()).toBe(false)
    })
  })

  describe('getStrykerSandboxId', () => {
    it('should return null when not running under Stryker', () => {
      delete process.env.STRYKER_MUTATOR
      expect(getStrykerSandboxId()).toBeNull()
    })

    it('should extract sandbox ID from cwd when present', () => {
      process.env.STRYKER_MUTATOR = 'true'
      // Mock process.cwd to return a path with sandbox
      const mockCwd = jest.fn(() => '/path/to/.stryker-tmp/sandbox-ABC123/src')
      process.cwd = mockCwd as any
      
      expect(getStrykerSandboxId()).toBe('ABC123')
    })

    it('should return null when sandbox ID not found in cwd', () => {
      process.env.STRYKER_MUTATOR = 'true'
      const mockCwd = jest.fn(() => '/path/to/src')
      process.cwd = mockCwd as any
      
      expect(getStrykerSandboxId()).toBeNull()
    })
  })
})
