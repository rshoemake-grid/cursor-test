/**
 * WebSocket Connection Manager
 * Single Responsibility: Only manages WebSocket connection lifecycle
 * Separated from React lifecycle for better testability
 * Follows Separation of Concerns principle
 * Refactored to use Strategy Pattern for reconnection (Open/Closed Principle)
 */

import type { WebSocketFactory, WindowLocation } from '../../types/adapters'
import { getWebSocketStateText } from './websocketStateUtils'
import { ExecutionStatusChecker, type ExecutionStatus } from './executionStatusUtils'
import { buildWebSocketUrl } from './websocketUrlBuilder'
import {
  handleWebSocketMessage,
  type WebSocketMessage,
  type MessageHandlerOptions
} from './websocketMessageHandler'
import { isTemporaryExecutionId } from './executionIdValidation'
import {
  ExponentialBackoffStrategy,
  type ReconnectionStrategy
} from './websocketReconnectionStrategy'
import {
  WS_CLOSE_CODES,
  WS_STATUS,
  WS_CLOSE_REASONS,
  WS_RECONNECT,
  EXECUTION_STATUS
} from './websocketConstants'
import {
  hasPendingReconnection,
  sanitizeReconnectionDelay,
  isCleanClosure,
  getCloseReason
} from './websocketValidation'
import {
  logSkipConnectionReason,
  logSkipReconnectReason
} from './websocketLogging'
// Removed logicalOr import - replaced with explicit checks

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
  reconnectionStrategy?: ReconnectionStrategy
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
  private reconnectionStrategy: ReconnectionStrategy

  constructor(private config: WebSocketManagerConfig) {
    this.lastKnownStatus = config.executionStatus
    // Use provided strategy or default to exponential backoff
    this.reconnectionStrategy = config.reconnectionStrategy ?? new ExponentialBackoffStrategy()
  }

  /**
   * Update execution status
   * Single Responsibility: Only updates status
   */
  updateStatus(status: ExecutionStatus | undefined): void {
    // Explicit check: use status if defined, otherwise use lastKnownStatus
    const hasStatus = status !== null && status !== undefined
    this.lastKnownStatus = hasStatus === true ? status : this.lastKnownStatus
    this.config.executionStatus = status

    // Close connection if execution terminated
    // Explicit checks to prevent mutation survivors
    const hasStatusValue = status !== null && status !== undefined
    if (hasStatusValue === true) {
      const isTerminated = ExecutionStatusChecker.isTerminated(status!)
      if (isTerminated === true) {
        const hasWebSocket = this.ws !== null && this.ws !== undefined
        if (hasWebSocket === true) {
          this.config.logger.debug(`[WebSocket] Closing connection - execution ${this.config.executionId} is ${status}`)
          this.ws!.close(WS_CLOSE_CODES.NORMAL_CLOSURE, WS_CLOSE_REASONS.EXECUTION_COMPLETED)
          this.ws = null
        }
        this.isConnectedState = false
        // Clear any pending reconnection attempts
        const hasPending = hasPendingReconnection(this.reconnectTimeout) === true
        if (hasPending === true) {
          clearTimeout(this.reconnectTimeout!)
          this.reconnectTimeout = null
        }
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
    // Explicit boolean check to prevent mutation survivors
    const shouldSkip = ExecutionStatusChecker.shouldSkip(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    ) === true
    if (shouldSkip === true) {
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
      callbacks.onStatus?.(WS_STATUS.CONNECTED)
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
      callbacks.onStatus?.(WS_STATUS.ERROR)
    }

    ws.onclose = (event) => {
      const reason = getCloseReason(event)
      this.config.logger.debug(`[WebSocket] Disconnected from execution ${this.config.executionId}`, {
        code: event.code,
        reason: reason,
        wasClean: event.wasClean,
        reconnectAttempts: this.reconnectAttempts
      })
      this.ws = null
      this.isConnectedState = false
      callbacks.onStatus?.(WS_STATUS.DISCONNECTED)

      this.handleReconnection(event, callbacks)
    }
  }

  /**
   * Handle reconnection logic
   * Single Responsibility: Only handles reconnection
   * Uses Strategy Pattern for extensible reconnection strategies
   */
  private handleReconnection(
    event: CloseEvent,
    callbacks: WebSocketCallbacks
  ): void {
    // Guard: Prevent infinite reconnection loops
    // Check BEFORE incrementing to match original behavior
    // Check BEFORE shouldReconnect so we can log the warning
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.config.logger.warn(`[WebSocket] Max reconnect attempts reached`)
      callbacks.onError?.(`WebSocket connection failed after ${this.config.maxReconnectAttempts} attempts`)
      return
    }

    // Explicit boolean check to prevent mutation survivors
    const shouldReconnect = ExecutionStatusChecker.shouldReconnect(
      event.wasClean,
      event.code,
      this.reconnectAttempts,
      this.config.maxReconnectAttempts,
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    ) === true
    if (shouldReconnect === false) {
      this.logSkipReconnectReason(event)
      return
    }

    this.reconnectAttempts++
    
    // Use strategy to calculate delay (attempt is now incremented, so use current value)
    const baseDelay = WS_RECONNECT.DEFAULT_MAX_DELAY
    const calculatedDelay = this.reconnectionStrategy.calculateDelay(
      this.reconnectAttempts,
      baseDelay
    )
    
    // Sanitize delay to prevent timeout mutations
    const safeDelay = sanitizeReconnectionDelay(calculatedDelay)
    
    this.config.logger.debug(`[WebSocket] Reconnecting in ${safeDelay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)

    // Guard: Clear existing timeout before setting new one
    // Explicit boolean check to prevent mutation survivors
    const hasPending = hasPendingReconnection(this.reconnectTimeout) === true
    if (hasPending === true) {
      clearTimeout(this.reconnectTimeout!)
    }
    
    this.reconnectTimeout = setTimeout(() => {
      // Guard: Verify we should still reconnect
      // Explicit boolean check to prevent mutation survivors
      const canStillReconnect = this.reconnectAttempts <= this.config.maxReconnectAttempts
      if (canStillReconnect === true) {
        this.connect(callbacks)
      }
    }, safeDelay)
  }

  /**
   * Close connection
   * Single Responsibility: Only closes connection
   */
  close(reason?: string): void {
    // Explicit boolean check to prevent mutation survivors
    const hasPending = hasPendingReconnection(this.reconnectTimeout) === true
    if (hasPending === true) {
      clearTimeout(this.reconnectTimeout!)
      this.reconnectTimeout = null
    }

    // Explicit null check to prevent mutation survivors
    const hasWebSocket = this.ws !== null && this.ws !== undefined
    if (hasWebSocket === true) {
      this.ws!.close(WS_CLOSE_CODES.NORMAL_CLOSURE, reason)
      this.ws = null
    }

    this.isConnectedState = false
  }

  /**
   * Get connection state
   * Mutation-resistant: explicit state check
   */
  get isConnected(): boolean {
    // Explicit boolean check to prevent mutation survivors
    const isStateConnected = this.isConnectedState === true
    if (isStateConnected === false) {
      return false
    }
    // Explicit null/undefined check to prevent mutation survivors
    const hasWebSocket = this.ws !== null && this.ws !== undefined
    if (hasWebSocket === false) {
      return false
    }
    // Use explicit constant comparison to prevent mutation survivors
    const isOpen = this.ws!.readyState === WebSocket.OPEN
    if (isOpen === true) {
      return true
    }
    return false
  }

  /**
   * Reset reconnect attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0
  }

  /**
   * Log skip reason
   * DRY: Uses extracted logging utility
   */
  private logSkipReason(): void {
    logSkipConnectionReason(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus,
      this.config.logger
    )
  }

  /**
   * Log skip reconnect reason
   * DRY: Uses extracted logging utility
   */
  private logSkipReconnectReason(event: CloseEvent): void {
    logSkipReconnectReason(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus,
      event,
      isCleanClosure,
      this.config.logger
    )
  }

  /**
   * Handle connection error
   * Single Responsibility: Only handles connection errors
   */
  private handleConnectionError(error: any, callbacks: WebSocketCallbacks): void {
    this.isConnectedState = false
    callbacks.onStatus?.(WS_STATUS.ERROR)
    callbacks.onError?.(error instanceof Error ? error.message : 'Failed to create WebSocket connection')
  }
}
