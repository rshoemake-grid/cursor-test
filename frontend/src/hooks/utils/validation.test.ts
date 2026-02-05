/**
 * Tests for validation utilities
 * These tests ensure mutation-resistant validation functions work correctly
 */

import {
  validateWorkflowName,
  sanitizeName,
  isValidName,
  hasNameChanged,
} from './validation'

describe('validation', () => {
  describe('validateWorkflowName', () => {
    it('should return valid for a normal name', () => {
      const result = validateWorkflowName('My Workflow')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for empty string', () => {
      const result = validateWorkflowName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Workflow name cannot be empty.')
    })

    it('should return invalid for whitespace-only string', () => {
      const result = validateWorkflowName('   ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Workflow name cannot be empty.')
    })

    it('should return invalid for name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101)
      const result = validateWorkflowName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Workflow name cannot exceed 100 characters.')
    })

    it('should return valid for name exactly 100 characters', () => {
      const name = 'a'.repeat(100)
      const result = validateWorkflowName(name)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should trim whitespace before validation', () => {
      const result = validateWorkflowName('  My Workflow  ')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle names with special characters', () => {
      const result = validateWorkflowName('Workflow-123_Test')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle single character names', () => {
      const result = validateWorkflowName('A')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('sanitizeName', () => {
    it('should trim whitespace from both ends', () => {
      expect(sanitizeName('  Test Name  ')).toBe('Test Name')
    })

    it('should return empty string for whitespace-only input', () => {
      expect(sanitizeName('   ')).toBe('')
    })

    it('should return original string if no whitespace', () => {
      expect(sanitizeName('TestName')).toBe('TestName')
    })

    it('should handle empty string', () => {
      expect(sanitizeName('')).toBe('')
    })

    it('should trim tabs and newlines', () => {
      expect(sanitizeName('\tTest\n')).toBe('Test')
    })

    it('should preserve internal spaces', () => {
      expect(sanitizeName('  Test  Name  ')).toBe('Test  Name')
    })
  })

  describe('isValidName', () => {
    it('should return true for valid name', () => {
      expect(isValidName('My Workflow')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidName('')).toBe(false)
    })

    it('should return false for whitespace-only string', () => {
      expect(isValidName('   ')).toBe(false)
    })

    it('should return true for trimmed valid name', () => {
      expect(isValidName('  Valid Name  ')).toBe(true)
    })

    it('should return false for tabs/newlines only', () => {
      expect(isValidName('\t\n')).toBe(false)
    })

    it('should return true for single character', () => {
      expect(isValidName('A')).toBe(true)
    })
  })

  describe('hasNameChanged', () => {
    it('should return true when names are different', () => {
      expect(hasNameChanged('New Name', 'Old Name')).toBe(true)
    })

    it('should return false when names are the same', () => {
      expect(hasNameChanged('Same Name', 'Same Name')).toBe(false)
    })

    it('should return false when names differ only by whitespace', () => {
      expect(hasNameChanged('  Name  ', 'Name')).toBe(false)
    })

    it('should return true when trimmed names are different', () => {
      expect(hasNameChanged('  New Name  ', 'Old Name')).toBe(true)
    })

    it('should handle empty strings', () => {
      expect(hasNameChanged('', 'Name')).toBe(true)
      expect(hasNameChanged('Name', '')).toBe(true)
      expect(hasNameChanged('', '')).toBe(false)
    })

    it('should handle whitespace-only strings', () => {
      expect(hasNameChanged('   ', 'Name')).toBe(true)
      expect(hasNameChanged('Name', '   ')).toBe(true)
      expect(hasNameChanged('   ', '   ')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(hasNameChanged('Name', 'name')).toBe(true)
      expect(hasNameChanged('NAME', 'name')).toBe(true)
    })

    it('should handle special characters', () => {
      expect(hasNameChanged('Name-1', 'Name-2')).toBe(true)
      expect(hasNameChanged('Name-1', 'Name-1')).toBe(false)
    })
  })
})
