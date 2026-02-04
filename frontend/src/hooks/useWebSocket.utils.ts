/**
 * WebSocket Utility Functions
 * Extracted from useWebSocket.ts to improve testability and reduce complexity
 */

import type { WindowLocation } from '../types/adapters'

export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'UNKNOWN'

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'pending' | 'paused'

/**
 * Get WebSocket state as string
 */
export function getWebSocketStateText(readyState: number): WebSocketState {
  if (readyState === WebSocket.CONNECTING) return 'CONNECTING'
  if (readyState === WebSocket.OPEN) return 'OPEN'
  if (readyState === WebSocket.CLOSING) return 'CLOSING'
  if (readyState === WebSocket.CLOSED) return 'CLOSED'
  return 'UNKNOWN'
}

/**
 * Check if execution ID is temporary (pending)
 */
export function isTemporaryExecutionId(executionId: string | null): boolean {
  return executionId !== null && executionId.startsWith('pending-')
}

/**
 * Check if execution status indicates completion or failure
 */
export function isExecutionTerminated(
  status: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  const currentStatus = status || lastKnownStatus
  return currentStatus === 'completed' || currentStatus === 'failed'
}

/**
 * Check if connection should be skipped
 */
export function shouldSkipConnection(
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  if (!executionId) return true
  if (isTemporaryExecutionId(executionId)) return true
  if (isExecutionTerminated(executionStatus, lastKnownStatus)) return true
  return false
}

/**
 * Build WebSocket URL from window location and execution ID
 */
export function buildWebSocketUrl(
  executionId: string,
  windowLocation?: WindowLocation | null
): string {
  const protocol = windowLocation?.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = windowLocation?.host || 'localhost:8000'
  return `${protocol}//${host}/ws/executions/${executionId}`
}

/**
 * Calculate reconnection delay with exponential backoff
 * @param attempt Current reconnection attempt (1-based)
 * @param maxDelay Maximum delay in milliseconds (default: 10000)
 * @returns Delay in milliseconds
 */
export function calculateReconnectDelay(attempt: number, maxDelay: number = 10000): number {
  const baseDelay = 1000
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  return Math.min(exponentialDelay, maxDelay)
}

/**
 * Check if reconnection should be attempted
 */
export function shouldReconnect(
  wasClean: boolean,
  code: number,
  attempt: number,
  maxAttempts: number,
  executionId: string | null,
  executionStatus: ExecutionStatus | undefined,
  lastKnownStatus?: ExecutionStatus | undefined
): boolean {
  // Don't reconnect to temporary execution IDs
  if (isTemporaryExecutionId(executionId)) return false

  // Don't reconnect if execution is terminated
  if (isExecutionTerminated(executionStatus, lastKnownStatus)) return false

  // Don't reconnect if connection was closed cleanly
  if (wasClean && code === 1000) return false

  // Don't reconnect if max attempts reached
  if (attempt >= maxAttempts) return false

  // Don't reconnect if no execution ID
  if (!executionId) return false

  return true
}

/**
 * WebSocket Message Interface
 */
export interface WebSocketMessage {
  type: 'log' | 'status' | 'node_update' | 'completion' | 'error'
  execution_id: string
  log?: {
    timestamp: string
    level: string
    node_id?: string
    message: string
  }
  status?: string
  node_state?: any
  result?: any
  error?: string
  timestamp?: string
}

/**
 * Message Handler Options
 */
export interface MessageHandlerOptions {
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
  logger?: {
    error: (message: string, ...args: any[]) => void
  }
}

/**
 * Handle WebSocket message based on type
 * Extracted to improve testability
 */
export function handleWebSocketMessage(
  message: WebSocketMessage,
  options: MessageHandlerOptions
): void {
  const { onLog, onStatus, onNodeUpdate, onCompletion, onError } = options

  switch (message.type) {
    case 'log':
      if (message.log && onLog) {
        onLog(message.log)
      }
      break
    case 'status':
      if (message.status && onStatus) {
        onStatus(message.status)
      }
      break
    case 'node_update':
      if (message.node_state && onNodeUpdate) {
        // Extract node_id from message - backend sends it as top-level field or in node_state
        const nodeId = (message as any).node_id || message.node_state.node_id
        if (nodeId) {
          onNodeUpdate(nodeId, message.node_state)
        }
      }
      break
    case 'completion':
      if (onCompletion) {
        onCompletion(message.result)
      }
      break
    case 'error':
      if (message.error && onError) {
        onError(message.error)
      }
      break
  }
}
