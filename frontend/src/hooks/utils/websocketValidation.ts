/**
 * WebSocket Validation Utilities
 * Extracted validation functions to improve mutation resistance and DRY compliance
 */

import { WS_CLOSE_CODES } from './websocketConstants'

/**
 * WebSocket ready state constants
 * Mutation-resistant: explicit constants instead of WebSocket.OPEN
 */
const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const

/**
 * Check if WebSocket is valid and open
 * Mutation-resistant: explicit null and state checks
 * Uses global WebSocket type (available in browser environments)
 */
export function isValidWebSocket(ws: WebSocket | null): ws is WebSocket {
  if (ws === null || ws === undefined) {
    return false
  }

  // Explicit state check to prevent mutation survivors
  const readyState = ws.readyState
  // Use explicit constant comparison to prevent mutation survivors
  if (readyState === WS_READY_STATE.OPEN) {
    return true
  }

  return false
}

/**
 * Check if there is a pending reconnection timeout
 * Mutation-resistant: explicit null/undefined checks
 */
export function hasPendingReconnection(
  timeout: ReturnType<typeof setTimeout> | null
): boolean {
  if (timeout === null || timeout === undefined) {
    return false
  }
  return true
}

/**
 * Validate and sanitize reconnection delay
 * Prevents timeout mutations by ensuring valid delay range
 */
export function sanitizeReconnectionDelay(delay: number): number {
  const MIN_DELAY = 1
  const MAX_DELAY = 60000

  // Explicit comparisons to prevent mutation survivors
  if (delay < MIN_DELAY) {
    return MIN_DELAY
  }

  if (delay > MAX_DELAY) {
    return MAX_DELAY
  }

  return delay
}

/**
 * Check if close event indicates clean closure
 * Mutation-resistant: explicit code comparison
 */
export function isCleanClosure(event: CloseEvent): boolean {
  // Explicit comparison to prevent mutation survivors
  if (event.wasClean === true && event.code === WS_CLOSE_CODES.NORMAL_CLOSURE) {
    return true
  }

  return false
}

/**
 * Get close reason from event
 * Mutation-resistant: explicit checks
 */
export function getCloseReason(event: CloseEvent): string {
  if (event.reason !== null && 
      event.reason !== undefined && 
      event.reason.length > 0) {
    return event.reason
  }

  return 'No reason provided'
}
