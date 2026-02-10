// Shared test setup for useWebSocket tests
// Jest globals - no import needed
import { waitFor, act } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
export const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

// Helper to advance timers within act() to prevent React warnings
// This wraps jest.advanceTimersByTime in act() to handle React state updates
// Note: jest.advanceTimersByTime is synchronous, but we wrap it in act() to handle
// React state updates that may be triggered by timers (e.g., WebSocket onopen handlers)
export const advanceTimersByTime = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

import { useWebSocket } from './useWebSocket'
import { logger } from '../../utils/logger'

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

// Enhanced Mock WebSocket
export class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  private timers: ReturnType<typeof setTimeout>[] = []

  constructor(url: string) {
    this.url = url
    // Simulate connection opening (but delay it to allow handler to be set)
    // Use setTimeout - setImmediate is not available in Jest environment
    // Track timer for cleanup to prevent memory leaks
    const timer = setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN
        if (this.onopen) {
          this.onopen(new Event('open'))
        }
      }
      // Remove timer from array after execution
      const index = this.timers.indexOf(timer)
      if (index > -1) {
        this.timers.splice(index, 1)
      }
    }, 10)
    this.timers.push(timer)
  }

  send(_data: string) {
    // Mock send
  }

  close(code?: number, reason?: string) {
    // Clear any pending timers to prevent memory leaks
    this.clearTimers()
    
    this.readyState = MockWebSocket.CLOSING
    // Use setTimeout - setImmediate is not available in Jest environment
    // This ensures the close event fires in fake timer environment
    // Track timer for cleanup
    const timer = setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) {
        // Use the provided code or default to 1000, and determine wasClean based on code
        const closeCode = code || 1000
        const wasClean = closeCode === 1000
        const event = new CloseEvent('close', { code: closeCode, reason: reason || '', wasClean })
        this.onclose(event)
      }
      // Remove timer from array after execution
      const index = this.timers.indexOf(timer)
      if (index > -1) {
        this.timers.splice(index, 1)
      }
    }, 10)
    this.timers.push(timer)
  }

  // Clear all pending timers to prevent memory leaks
  clearTimers() {
    this.timers.forEach(timer => {
      clearTimeout(timer)
    })
    this.timers = []
  }

  // Helper methods for testing
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    if (this.onopen) {
      this.onopen(new Event('open'))
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data: JSON.stringify(data) })
      this.onmessage(event)
    }
  }

  simulateError(error?: Error) {
    if (this.onerror) {
      const event = new ErrorEvent('error', { error: error || new Error('WebSocket error') })
      this.onerror(event as any)
    }
  }

  simulateClose(code: number = 1000, reason: string = '', wasClean: boolean = true) {
    // Clear timers when simulating close
    this.clearTimers()
    
    if (this.onclose) {
      // Create event object that properly preserves reason
      // jsdom's CloseEvent constructor may not preserve reason correctly
      const event = Object.create(CloseEvent.prototype)
      Object.defineProperties(event, {
        type: { value: 'close', enumerable: true },
        code: { value: code, enumerable: true },
        reason: { value: reason || '', enumerable: true },
        wasClean: { value: wasClean, enumerable: true },
        cancelBubble: { value: false, enumerable: true },
        defaultPrevented: { value: false, enumerable: true },
        timeStamp: { value: Date.now(), enumerable: true }
      })
      this.onclose(event as CloseEvent)
    }
  }

  setReadyState(state: number) {
    this.readyState = state
  }
}

// Store WebSocket instances for testing
export const wsInstances: MockWebSocket[] = []

// Replace global WebSocket
const OriginalWebSocket = global.WebSocket
global.WebSocket = class extends MockWebSocket {
  constructor(url: string) {
    super(url)
    wsInstances.push(this)
  }
} as any

// Export the original for cleanup if needed
export { OriginalWebSocket }

// Export useWebSocket and logger for tests
export { useWebSocket, logger }
