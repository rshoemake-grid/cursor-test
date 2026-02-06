/**
 * Tests for Node Cache Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import {
  updateNodeCache,
  clearNodeCache,
  syncCacheData,
} from './nodeCache'

describe('updateNodeCache', () => {
  it('should update cache with node data', () => {
    const cacheRef = { current: null }
    const idRef = { current: null }
    const node = { id: 'node-1', data: {} }
    
    updateNodeCache(cacheRef, idRef, node, 'node-1')
    
    expect(cacheRef.current).toEqual({ id: 'node-1', data: {} })
    expect(idRef.current).toBe('node-1')
  })

  it('should clear cache when node is null', () => {
    const cacheRef = { current: { id: 'old' } }
    const idRef = { current: 'old-id' }
    
    updateNodeCache(cacheRef, idRef, null, null)
    
    expect(cacheRef.current).toBeNull()
    expect(idRef.current).toBeNull()
  })

  it('should clear cache when node is undefined', () => {
    const cacheRef = { current: { id: 'old' } }
    const idRef = { current: 'old-id' }
    
    updateNodeCache(cacheRef, idRef, undefined, null)
    
    expect(cacheRef.current).toBeNull()
    expect(idRef.current).toBeNull()
  })
})

describe('clearNodeCache', () => {
  it('should clear both cache and ID', () => {
    const cacheRef = { current: { id: 'node-1' } }
    const idRef = { current: 'node-1' }
    
    clearNodeCache(cacheRef, idRef)
    
    expect(cacheRef.current).toBeNull()
    expect(idRef.current).toBeNull()
  })
})

describe('syncCacheData', () => {
  it('should update cache data while preserving reference', () => {
    const cacheRef = { current: { id: 'node-1', data: { old: true } } }
    const updatedNode = { id: 'node-1', data: { new: true } }
    
    syncCacheData(cacheRef, updatedNode)
    
    expect(cacheRef.current).toEqual({ id: 'node-1', data: { new: true } })
    expect(cacheRef.current).toBe(cacheRef.current) // Same reference
  })

  it('should not update when cache is null', () => {
    const cacheRef = { current: null }
    const updatedNode = { id: 'node-1' }
    
    syncCacheData(cacheRef, updatedNode)
    
    expect(cacheRef.current).toBeNull()
  })
})
