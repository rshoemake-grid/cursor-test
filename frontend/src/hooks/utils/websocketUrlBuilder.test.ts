/**
 * WebSocket URL Builder Tests
 * Tests for WebSocket URL building logic
 */

import { buildWebSocketUrl } from './websocketUrlBuilder'
import type { WindowLocation } from '../../types/adapters'

describe('buildWebSocketUrl', () => {
  it('should build WebSocket URL with http protocol', () => {
    const windowLocation: WindowLocation = {
      protocol: 'http:',
      host: 'localhost:8000',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation)
    expect(url).toBe('ws://localhost:8000/ws/executions/exec-123')
  })

  it('should build WebSocket URL with https protocol', () => {
    const windowLocation: WindowLocation = {
      protocol: 'https:',
      host: 'example.com',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-456', windowLocation)
    expect(url).toBe('wss://example.com/ws/executions/exec-456')
  })

  it('should use ws protocol for non-https protocols', () => {
    const windowLocation: WindowLocation = {
      protocol: 'http:',
      host: 'example.com:8080',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-789', windowLocation)
    expect(url).toBe('ws://example.com:8080/ws/executions/exec-789')
  })

  it('should use default host when windowLocation is null', () => {
    const url = buildWebSocketUrl('exec-123', null)
    expect(url).toBe('ws://localhost:8000/ws/executions/exec-123')
  })

  it('should use default host when windowLocation is undefined', () => {
    const url = buildWebSocketUrl('exec-123', undefined)
    expect(url).toBe('ws://localhost:8000/ws/executions/exec-123')
  })

  it('should use default host when host is missing', () => {
    const windowLocation: Partial<WindowLocation> = {
      protocol: 'https:',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation as WindowLocation)
    expect(url).toBe('wss://localhost:8000/ws/executions/exec-123')
  })

  it('should use default host when host is null', () => {
    const windowLocation: Partial<WindowLocation> = {
      protocol: 'http:',
      host: null as any,
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation as WindowLocation)
    expect(url).toBe('ws://localhost:8000/ws/executions/exec-123')
  })

  it('should use default host when host is empty string', () => {
    const windowLocation: Partial<WindowLocation> = {
      protocol: 'https:',
      host: '',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation as WindowLocation)
    expect(url).toBe('wss://localhost:8000/ws/executions/exec-123')
  })

  it('should handle execution IDs with special characters', () => {
    const windowLocation: WindowLocation = {
      protocol: 'https:',
      host: 'example.com',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123-abc_xyz', windowLocation)
    expect(url).toBe('wss://example.com/ws/executions/exec-123-abc_xyz')
  })

  it('should handle different port numbers', () => {
    const windowLocation: WindowLocation = {
      protocol: 'http:',
      host: 'localhost:3000',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation)
    expect(url).toBe('ws://localhost:3000/ws/executions/exec-123')
  })

  it('should handle custom domains', () => {
    const windowLocation: WindowLocation = {
      protocol: 'https:',
      host: 'api.example.com',
    } as WindowLocation

    const url = buildWebSocketUrl('exec-123', windowLocation)
    expect(url).toBe('wss://api.example.com/ws/executions/exec-123')
  })
})
