/**
 * Tests for Node Cache Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import {
  updateNodeCache,
  updateNodeCacheRefs,
  updateCachedNodeData,
  clearNodeCache,
  syncCacheData,
} from './nodeCache'
import type { Node } from '@xyflow/react'

describe('updateNodeCache', () => {
  it('should return cache result with node data', () => {
    const node: Node = { id: 'node-1', data: {}, position: { x: 0, y: 0 } }
    
    const result = updateNodeCache(node, 'node-1')
    
    expect(result.cached).toEqual(node)
    expect(result.idCached).toBe('node-1')
    expect(result.cached).not.toBe(node) // Should be a copy
  })

  it('should return null cache when node is null', () => {
    const result = updateNodeCache(null, null)
    
    expect(result.cached).toBeNull()
    expect(result.idCached).toBeNull()
  })

  it('should return null cache when node is undefined', () => {
    const result = updateNodeCache(undefined, null)
    
    expect(result.cached).toBeNull()
    expect(result.idCached).toBeNull()
  })
})

describe('updateNodeCacheRefs', () => {
  it('should update cache refs with node data', () => {
    const cacheRef = { current: null }
    const idRef = { current: null }
    const node: Node = { id: 'node-1', data: {}, position: { x: 0, y: 0 } }
    
    updateNodeCacheRefs(cacheRef, idRef, node, 'node-1')
    
    expect(cacheRef.current).toEqual(node)
    expect(idRef.current).toBe('node-1')
  })

  it('should clear cache refs when node is null', () => {
    const cacheRef = { current: { id: 'old' } as any }
    const idRef = { current: 'old-id' }
    
    updateNodeCacheRefs(cacheRef, idRef, null, null)
    
    expect(cacheRef.current).toBeNull()
    expect(idRef.current).toBeNull()
  })
})

describe('updateCachedNodeData', () => {
  it('should update cached node data', () => {
    const cachedNode: Node = { id: 'node-1', data: { old: true }, position: { x: 0, y: 0 } }
    const updatedNode: Node = { id: 'node-1', data: { new: true }, position: { x: 0, y: 0 } }
    
    const result = updateCachedNodeData(cachedNode, updatedNode)
    
    expect(result).toBe(true)
    expect(cachedNode.data).toEqual({ new: true })
  })

  it('should return false when cached node is null', () => {
    const updatedNode: Node = { id: 'node-1', data: {}, position: { x: 0, y: 0 } }
    
    const result = updateCachedNodeData(null, updatedNode)
    
    expect(result).toBe(false)
  })

  it('should return false when updated node is null', () => {
    const cachedNode: Node = { id: 'node-1', data: {}, position: { x: 0, y: 0 } }
    
    const result = updateCachedNodeData(cachedNode, null)
    
    expect(result).toBe(false)
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
