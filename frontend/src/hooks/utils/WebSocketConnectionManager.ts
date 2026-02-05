/**
 * WebSocket Connection Manager
 * Single Responsibility: Only manages WebSocket connection lifecycle
 * Separated from React lifecycle for better testability
 * Follows Separation of Concerns principle
 */

import type { WebSocketFactory, WindowLocation } from '../../types/adapters'
import {
  getWebSocketStateText,
  isTemporaryExecutionId,
  isExecutionTerminated,
  shouldSkipConnection,
  buildWebSocketUrl,
  calculateReconnectDelay,
  shouldReconnect,
  handleWebSocketMessage,
  type ExecutionStatus,
  type WebSocketMessage,
  type MessageHandlerOptions
} from '../useWebSocket.utils'

export interface WebSocketCallbacks {
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
}

export interface WebSocketManagerConfig {
  executionId: string | null
  executionStatus?: ExecutionStatus
  maxReconnectAttempts: number
  webSocketFactory: WebSocketFactory
  windowLocation: WindowLocation | null
  logger: {
    debug: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
  }
}

/**
 * WebSocket Connection Manager
 * Single Responsibility: Only manages WebSocket connection lifecycle
 * Separated from React lifecycle for better testability
 */
export class WebSocketConnectionManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private lastKnownStatus?: ExecutionStatus
  private isConnectedState = false

  constructor(private config: WebSocketManagerConfig) {
    this.lastKnownStatus = config.executionStatus
  }

  /**
   * Update execution status
   * Single Responsibility: Only updates status
   */
  updateStatus(status: ExecutionStatus | undefined): void {
    this.lastKnownStatus = status || this.lastKnownStatus
    this.config.executionStatus = status

    // Close connection if execution terminated
    if (status && isExecutionTerminated(status)) {
      if (this.ws) {
        this.config.logger.debug(`[WebSocket] Closing connection - execution ${this.config.executionId} is ${status}`)
        this.ws.close(1000, 'Execution completed')
        this.ws = null
      }
      this.isConnectedState = false
      // Clear any pending reconnection attempts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }
    }
  }

  /**
   * Update execution ID
   * Single Responsibility: Only updates execution ID
   */
  updateExecutionId(executionId: string | null): void {
    this.config.executionId = executionId
    this.resetReconnectAttempts()
  }

  /**
   * Connect to WebSocket
   * Single Responsibility: Only establishes connection
   */
  connect(callbacks: WebSocketCallbacks): void {
    // Check if should skip
    if (shouldSkipConnection(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    )) {
      this.logSkipReason()
      return
    }

    // Close existing connection
    this.close()

    const wsUrl = buildWebSocketUrl(this.config.executionId!, this.config.windowLocation)
    this.config.logger.debug(`[WebSocket] Connecting to ${wsUrl}`)

    try {
      const ws = this.config.webSocketFactory.create(wsUrl)
      this.ws = ws
      this.setupEventHandlers(ws, callbacks, wsUrl)
    } catch (error) {
      this.config.logger.error(`Failed to create connection for execution ${this.config.executionId}`, error)
      this.handleConnectionError(error, callbacks)
    }
  }

  /**
   * Setup WebSocket event handlers
   * Single Responsibility: Only sets up handlers
   */
  private setupEventHandlers(
    ws: WebSocket,
    callbacks: WebSocketCallbacks,
    wsUrl: string
  ): void {
    ws.onopen = () => {
      this.config.logger.debug(`[WebSocket] Connected to execution ${this.config.executionId}`)
      this.isConnectedState = true
      this.reconnectAttempts = 0
      callbacks.onStatus?.('connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(message, {
          onLog: callbacks.onLog,
          onStatus: callbacks.onStatus,
          onNodeUpdate: callbacks.onNodeUpdate,
          onCompletion: callbacks.onCompletion,
          onError: callbacks.onError,
          logger: this.config.logger
        } as MessageHandlerOptions)
      } catch (error) {
        this.config.logger.error('[WebSocket] Failed to parse message:', error)
      }
    }

    ws.onerror = (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown WebSocket error'
      this.config.logger.error(`[WebSocket] Connection error for execution ${this.config.executionId}:`, {
        message: errorMessage,
        readyState: getWebSocketStateText(ws.readyState),
        url: wsUrl
      })
      this.isConnectedState = false
      callbacks.onStatus?.('error')
    }

    ws.onclose = (event) => {
      const reason = event.reason && event.reason.length > 0 ? event.reason : 'No reason provided'
      this.config.logger.debug(`[WebSocket] Disconnected from execution ${this.config.executionId}`, {
        code: event.code,
        reason: reason,
        wasClean: event.wasClean,
        reconnectAttempts: this.reconnectAttempts
      })
      this.ws = null
      this.isConnectedState = false
      callbacks.onStatus?.('disconnected')

      this.handleReconnection(event, callbacks)
    }
  }

  /**
   * Handle reconnection logic
   * Single Responsibility: Only handles reconnection
   */
  private handleReconnection(
    event: CloseEvent,
    callbacks: WebSocketCallbacks
  ): void {
    if (!shouldReconnect(
      event.wasClean,
      event.code,
      this.reconnectAttempts,
      this.config.maxReconnectAttempts,
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    )) {
      this.logSkipReconnectReason(event)
      return
    }

    this.reconnectAttempts++
    const delay = calculateReconnectDelay(this.reconnectAttempts, 10000)
    this.config.logger.debug(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect(callbacks)
    }, delay)

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.config.logger.warn(`[WebSocket] Max reconnect attempts reached`)
      callbacks.onError?.(`WebSocket connection failed after ${this.config.maxReconnectAttempts} attempts`)
    }
  }

  /**
   * Close connection
   * Single Responsibility: Only closes connection
   */
  close(reason?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, reason)
      this.ws = null
    }

    this.isConnectedState = false
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.isConnectedState && this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Reset reconnect attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0
  }

  /**
   * Log skip reason
   * DRY: Centralized logging for skip reasons
   */
  private logSkipReason(): void {
    if (isTemporaryExecutionId(this.config.executionId)) {
      this.config.logger.debug(`[WebSocket] Skipping connection to temporary execution ID: ${this.config.executionId}`)
    } else {
      const status = this.config.executionStatus || this.lastKnownStatus
      if (status === 'completed' || status === 'failed') {
        this.config.logger.debug(`[WebSocket] Skipping connection - execution ${this.config.executionId} is ${status}`)
      }
    }
  }

  /**
   * Log skip reconnect reason
   * DRY: Centralized logging for reconnect skip reasons
   */
  private logSkipReconnectReason(event: CloseEvent): void {
    if (isTemporaryExecutionId(this.config.executionId)) {
      this.config.logger.debug(`[WebSocket] Skipping reconnect for temporary execution ID: ${this.config.executionId}`)
    } else {
      const status = this.config.executionStatus || this.lastKnownStatus
      if (status === 'completed' || status === 'failed') {
        this.config.logger.debug(`[WebSocket] Skipping reconnect - execution ${this.config.executionId} is ${status}`)
      } else if (event.wasClean && event.code === 1000) {
        this.config.logger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`)
      }
    }
  }

  /**
   * Handle connection error
   * Single Responsibility: Only handles connection errors
   */
  private handleConnectionError(error: any, callbacks: WebSocketCallbacks): void {
    this.isConnectedState = false
    callbacks.onStatus?.('error')
    callbacks.onError?.(error instanceof Error ? error.message : 'Failed to create WebSocket connection')
  }
}
