/**
 * WebSocket Message Handler
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles WebSocket message processing
 */

import { logicalOr } from './logicalOr'

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
  node_state?: {
    node_id?: string
    [key: string]: any
  }
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
 * Mutation-resistant: explicit type checks
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
        const nodeId = logicalOr((message as any).node_id, message.node_state.node_id)
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
