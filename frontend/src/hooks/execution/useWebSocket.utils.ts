/**
 * WebSocket Utility Functions
 * Re-exports from refactored utility modules for backward compatibility
 * 
 * @deprecated This file is kept for backward compatibility.
 * New code should import directly from:
 * - websocketStateUtils.ts
 * - executionStatusUtils.ts
 * - websocketUrlBuilder.ts
 * - websocketMessageHandler.ts
 */

// Re-export types and functions for backward compatibility
export type { WebSocketState } from '../utils/websocketStateUtils'
export type { ExecutionStatus } from '../utils/executionStatusUtils'
export type { 
  WebSocketMessage, 
  MessageHandlerOptions 
} from '../utils/websocketMessageHandler'

// Re-export functions
export { getWebSocketStateText } from '../utils/websocketStateUtils'
export { 
  ExecutionStatusChecker,
  isExecutionTerminated,
  shouldSkipConnection,
  shouldReconnect
} from '../utils/executionStatusUtils'
export { buildWebSocketUrl } from '../utils/websocketUrlBuilder'
export { handleWebSocketMessage } from '../utils/websocketMessageHandler'
