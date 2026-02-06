/**
 * WebSocket State Utilities
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles WebSocket state conversion
 */

export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'UNKNOWN'

/**
 * Get WebSocket state as string
 * Mutation-resistant: explicit state checks
 */
export function getWebSocketStateText(readyState: number): WebSocketState {
  if (readyState === WebSocket.CONNECTING) return 'CONNECTING'
  if (readyState === WebSocket.OPEN) return 'OPEN'
  if (readyState === WebSocket.CLOSING) return 'CLOSING'
  if (readyState === WebSocket.CLOSED) return 'CLOSED'
  return 'UNKNOWN'
}
