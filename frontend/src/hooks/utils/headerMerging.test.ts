/**
 * Tests for Header Merging Utilities
 * Mutation testing: ensures utilities are mutation-resistant
 */

import {
  mergeHeaders,
  buildBaseHeaders,
  addContentTypeIfNeeded,
  addAuthorizationIfNeeded,
} from './headerMerging'

describe('mergeHeaders', () => {
  it('should merge Headers object', () => {
    // Mock Headers if not available in test environment
    if (typeof Headers === 'undefined') {
      // Create a mock Headers-like object
      const mockHeaders = {
        forEach: (callback: (value: string, key: string) => void) => {
          callback('application/json', 'Content-Type')
          callback('value', 'X-Custom')
        }
      }
      const base: Record<string, string> = {}
      mergeHeaders(base, mockHeaders as any)
      expect(base['Content-Type']).toBe('application/json')
      expect(base['X-Custom']).toBe('value')
      return
    }
    
    const base: Record<string, string> = {}
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('X-Custom', 'value')
    
    mergeHeaders(base, headers)
    
    // Headers API normalizes keys to lowercase
    expect(base['content-type']).toBe('application/json')
    expect(base['x-custom']).toBe('value')
  })

  it('should merge array of tuples', () => {
    const base: Record<string, string> = {}
    const headers: Array<[string, string]> = [
      ['Content-Type', 'application/json'],
      ['X-Custom', 'value']
    ]
    
    mergeHeaders(base, headers)
    
    expect(base['Content-Type']).toBe('application/json')
    expect(base['X-Custom']).toBe('value')
  })

  it('should merge object', () => {
    const base: Record<string, string> = {}
    const headers = {
      'Content-Type': 'application/json',
      'X-Custom': 'value'
    }
    
    mergeHeaders(base, headers)
    
    expect(base['Content-Type']).toBe('application/json')
    expect(base['X-Custom']).toBe('value')
  })

  it('should do nothing if additional is null/undefined', () => {
    const base: Record<string, string> = { existing: 'value' }
    
    mergeHeaders(base, null as any)
    expect(base).toEqual({ existing: 'value' })
    
    mergeHeaders(base, undefined as any)
    expect(base).toEqual({ existing: 'value' })
  })
})

describe('addContentTypeIfNeeded', () => {
  it('should add Content-Type for POST method', () => {
    const headers: Record<string, string> = {}
    addContentTypeIfNeeded(headers, 'POST')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should add Content-Type for PUT method', () => {
    const headers: Record<string, string> = {}
    addContentTypeIfNeeded(headers, 'PUT')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should not add Content-Type for GET method', () => {
    const headers: Record<string, string> = {}
    addContentTypeIfNeeded(headers, 'GET')
    expect(headers['Content-Type']).toBeUndefined()
  })

  it('should not override existing Content-Type', () => {
    const headers: Record<string, string> = { 'Content-Type': 'text/plain' }
    addContentTypeIfNeeded(headers, 'POST')
    expect(headers['Content-Type']).toBe('text/plain')
  })
})

describe('addAuthorizationIfNeeded', () => {
  it('should add Authorization header when token provided', () => {
    const headers: Record<string, string> = {}
    addAuthorizationIfNeeded(headers, 'test-token')
    expect(headers['Authorization']).toBe('Bearer test-token')
  })

  it('should not add Authorization header when token is null', () => {
    const headers: Record<string, string> = {}
    addAuthorizationIfNeeded(headers, null)
    expect(headers['Authorization']).toBeUndefined()
  })
})

describe('buildBaseHeaders', () => {
  it('should build headers with token and Content-Type for POST', () => {
    const result = buildBaseHeaders('test-token', 'POST')
    expect(result['Authorization']).toBe('Bearer test-token')
    expect(result['Content-Type']).toBe('application/json')
  })

  it('should build headers with token but no Content-Type for GET', () => {
    const result = buildBaseHeaders('test-token', 'GET')
    expect(result['Authorization']).toBe('Bearer test-token')
    expect(result['Content-Type']).toBeUndefined()
  })

  it('should build headers without Authorization when token is null', () => {
    const result = buildBaseHeaders(null, 'POST')
    expect(result['Authorization']).toBeUndefined()
    expect(result['Content-Type']).toBe('application/json')
  })

  it('should return empty object when token is null and method is GET', () => {
    const result = buildBaseHeaders(null, 'GET')
    expect(result).toEqual({})
  })
})
