/**
 * WebSocket Reconnection Strategy Tests
 * Tests for strategy pattern implementations to ensure mutation resistance
 */

import {
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
  FixedDelayStrategy
} from './websocketReconnectionStrategy'
import { WS_RECONNECT } from './websocketConstants'

describe('ReconnectionStrategy', () => {
  describe('ExponentialBackoffStrategy', () => {
    let strategy: ExponentialBackoffStrategy

    beforeEach(() => {
      strategy = new ExponentialBackoffStrategy()
    })

    describe('calculateDelay', () => {
      it('should return baseDelay for attempt 1', () => {
        const delay = strategy.calculateDelay(1, 1000)
        expect(delay).toBe(1000)
      })

      it('should return 2x baseDelay for attempt 2', () => {
        const delay = strategy.calculateDelay(2, 1000)
        expect(delay).toBe(2000)
      })

      it('should return 4x baseDelay for attempt 3', () => {
        const delay = strategy.calculateDelay(3, 1000)
        expect(delay).toBe(4000)
      })

      it('should return 8x baseDelay for attempt 4', () => {
        const delay = strategy.calculateDelay(4, 1000)
        expect(delay).toBe(8000)
      })

      it('should cap at MAX_DELAY', () => {
        const delay = strategy.calculateDelay(10, 10000)
        expect(delay).toBe(WS_RECONNECT.MAX_DELAY)
      })

      it('should return MIN_DELAY for invalid attempt < 1', () => {
        const delay = strategy.calculateDelay(0, 1000)
        expect(delay).toBe(1000) // Returns baseDelay for attempt < 1
      })

      it('should ensure minimum delay', () => {
        const delay = strategy.calculateDelay(1, 0)
        expect(delay).toBe(WS_RECONNECT.MIN_DELAY)
      })
    })

    describe('shouldReconnect', () => {
      it('should return true when attempt < maxAttempts', () => {
        expect(strategy.shouldReconnect(0, 5)).toBe(true)
        expect(strategy.shouldReconnect(1, 5)).toBe(true)
        expect(strategy.shouldReconnect(4, 5)).toBe(true)
      })

      it('should return false when attempt >= maxAttempts', () => {
        expect(strategy.shouldReconnect(5, 5)).toBe(false)
        expect(strategy.shouldReconnect(6, 5)).toBe(false)
      })

      it('should return false for invalid attempt < 0', () => {
        expect(strategy.shouldReconnect(-1, 5)).toBe(false)
      })

      it('should return false for invalid maxAttempts < 1', () => {
        expect(strategy.shouldReconnect(0, 0)).toBe(false)
        expect(strategy.shouldReconnect(1, -1)).toBe(false)
      })

      it('should verify exact boundary - attempt === maxAttempts - 1', () => {
        expect(strategy.shouldReconnect(4, 5)).toBe(true)
      })

      it('should verify exact boundary - attempt === maxAttempts', () => {
        expect(strategy.shouldReconnect(5, 5)).toBe(false)
      })
    })
  })

  describe('LinearBackoffStrategy', () => {
    let strategy: LinearBackoffStrategy

    beforeEach(() => {
      strategy = new LinearBackoffStrategy()
    })

    describe('calculateDelay', () => {
      it('should return baseDelay for attempt 1', () => {
        const delay = strategy.calculateDelay(1, 1000)
        expect(delay).toBe(1000)
      })

      it('should return 2x baseDelay for attempt 2', () => {
        const delay = strategy.calculateDelay(2, 1000)
        expect(delay).toBe(2000)
      })

      it('should return 3x baseDelay for attempt 3', () => {
        const delay = strategy.calculateDelay(3, 1000)
        expect(delay).toBe(3000)
      })

      it('should cap at MAX_DELAY', () => {
        const delay = strategy.calculateDelay(100, 1000)
        expect(delay).toBe(WS_RECONNECT.MAX_DELAY)
      })
    })

    describe('shouldReconnect', () => {
      it('should return true when attempt < maxAttempts', () => {
        expect(strategy.shouldReconnect(0, 5)).toBe(true)
      })

      it('should return false when attempt >= maxAttempts', () => {
        expect(strategy.shouldReconnect(5, 5)).toBe(false)
      })
    })
  })

  describe('FixedDelayStrategy', () => {
    it('should use default fixed delay when not specified', () => {
      const strategy = new FixedDelayStrategy()
      const delay = strategy.calculateDelay(5, 1000)
      expect(delay).toBe(WS_RECONNECT.BASE_DELAY)
    })

    it('should use custom fixed delay', () => {
      const strategy = new FixedDelayStrategy(5000)
      const delay = strategy.calculateDelay(10, 1000)
      expect(delay).toBe(5000)
    })

    it('should cap custom delay at MAX_DELAY', () => {
      const strategy = new FixedDelayStrategy(100000)
      const delay = strategy.calculateDelay(1, 1000)
      expect(delay).toBe(WS_RECONNECT.MAX_DELAY)
    })

    it('should enforce MIN_DELAY for small custom delay', () => {
      const strategy = new FixedDelayStrategy(0)
      const delay = strategy.calculateDelay(1, 1000)
      expect(delay).toBe(WS_RECONNECT.MIN_DELAY)
    })

    it('should respect shouldReconnect logic', () => {
      const strategy = new FixedDelayStrategy()
      expect(strategy.shouldReconnect(0, 5)).toBe(true)
      expect(strategy.shouldReconnect(5, 5)).toBe(false)
    })
  })
})
