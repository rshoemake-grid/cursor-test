/**
 * Tests for Node Validation Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import {
  isValidNodeId,
  hasValidCache,
  nodeExistsAndValid,
} from './nodeValidation'

describe('isValidNodeId', () => {
  it('should return true for valid node IDs', () => {
    expect(isValidNodeId('node-1')).toBe(true)
    expect(isValidNodeId('123')).toBe(true)
    expect(isValidNodeId('node_123')).toBe(true)
  })

  it('should return false for null', () => {
    expect(isValidNodeId(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isValidNodeId(undefined)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidNodeId('')).toBe(false)
  })

  it('should work as type guard', () => {
    const id: string | null = 'test'
    if (isValidNodeId(id)) {
      // TypeScript should know id is string here
      expect(typeof id).toBe('string')
    }
  })
})

describe('nodeExistsAndValid', () => {
  it('should return true for existing nodes', () => {
    expect(nodeExistsAndValid({ id: '1' })).toBe(true)
    expect(nodeExistsAndValid({})).toBe(true)
  })

  it('should return false for null', () => {
    expect(nodeExistsAndValid(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(nodeExistsAndValid(undefined)).toBe(false)
  })
})

describe('hasValidCache', () => {
  it('should return true when cache is valid', () => {
    expect(hasValidCache('node-1', 'node-1', { id: 'node-1' })).toBe(true)
  })

  it('should return false when IDs do not match', () => {
    expect(hasValidCache('node-1', 'node-2', { id: 'node-1' })).toBe(false)
  })

  it('should return false when cached node is null', () => {
    expect(hasValidCache('node-1', 'node-1', null)).toBe(false)
  })

  it('should return false when cached node is undefined', () => {
    expect(hasValidCache('node-1', 'node-1', undefined)).toBe(false)
  })
})
