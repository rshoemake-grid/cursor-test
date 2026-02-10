/**
 * WebSocket Reconnection Strategy
 * Strategy pattern for reconnection logic to follow Open/Closed Principle
 * Allows extensibility for different reconnection strategies
 */

import { WS_RECONNECT } from './websocketConstants'

/**
 * Reconnection strategy interface
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
export interface ReconnectionStrategy {
  /**
   * Calculate delay for reconnection attempt
   * @param attempt Current reconnection attempt (1-based)
   * @param baseDelay Base delay in milliseconds
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number, baseDelay: number): number

  /**
   * Check if reconnection should be attempted
   * @param attempt Current reconnection attempt (0-based)
   * @param maxAttempts Maximum number of reconnection attempts
   * @returns True if should reconnect, false otherwise
   */
  shouldReconnect(attempt: number, maxAttempts: number): boolean
}

/**
 * Exponential backoff reconnection strategy
 * Default strategy with exponential delay increase
 */
export class ExponentialBackoffStrategy implements ReconnectionStrategy {
  /**
   * Calculate exponential backoff delay
   * Formula: baseDelay * 2^(attempt-1)
   * Capped at maxDelay to prevent excessive delays
   */
  calculateDelay(attempt: number, baseDelay: number): number {
    // Guard: Ensure attempt is valid
    if (attempt < 1) {
      return baseDelay
    }

    // Calculate exponential delay: baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)

    // Cap at maximum delay to prevent timeout mutations
    const maxDelay = WS_RECONNECT.MAX_DELAY
    if (exponentialDelay > maxDelay) {
      return maxDelay
    }

    // Ensure minimum delay
    if (exponentialDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY
    }

    return exponentialDelay
  }

  /**
   * Check if should reconnect based on attempt count
   * Mutation-resistant: explicit comparison
   */
  shouldReconnect(attempt: number, maxAttempts: number): boolean {
    // Guard: Ensure valid inputs
    if (attempt < 0) {
      return false
    }
    if (maxAttempts < 1) {
      return false
    }

    // Explicit comparison to prevent mutation survivors
    return attempt < maxAttempts
  }
}

/**
 * Linear backoff reconnection strategy
 * Alternative strategy with linear delay increase
 */
export class LinearBackoffStrategy implements ReconnectionStrategy {
  /**
   * Calculate linear backoff delay
   * Formula: baseDelay * attempt
   */
  calculateDelay(attempt: number, baseDelay: number): number {
    if (attempt < 1) {
      return baseDelay
    }

    const linearDelay = baseDelay * attempt
    const maxDelay = WS_RECONNECT.MAX_DELAY

    if (linearDelay > maxDelay) {
      return maxDelay
    }

    if (linearDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY
    }

    return linearDelay
  }

  shouldReconnect(attempt: number, maxAttempts: number): boolean {
    if (attempt < 0) {
      return false
    }
    if (maxAttempts < 1) {
      return false
    }

    return attempt < maxAttempts
  }
}

/**
 * Fixed delay reconnection strategy
 * Alternative strategy with constant delay
 */
export class FixedDelayStrategy implements ReconnectionStrategy {
  constructor(private fixedDelay: number = WS_RECONNECT.BASE_DELAY) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculateDelay(_attempt: number, _baseDelay: number): number {
    // Use fixed delay, ignore attempt and baseDelay (prefixed with _ to indicate intentionally unused)
    if (this.fixedDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY
    }
    if (this.fixedDelay > WS_RECONNECT.MAX_DELAY) {
      return WS_RECONNECT.MAX_DELAY
    }
    return this.fixedDelay
  }

  shouldReconnect(attempt: number, maxAttempts: number): boolean {
    if (attempt < 0) {
      return false
    }
    if (maxAttempts < 1) {
      return false
    }

    return attempt < maxAttempts
  }
}
