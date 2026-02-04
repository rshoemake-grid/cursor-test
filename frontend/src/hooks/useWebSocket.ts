import { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '../utils/logger'
import type { WebSocketFactory, WindowLocation } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
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
  type WebSocketMessage
} from './useWebSocket.utils'

// WebSocketMessage type is now imported from utils

interface UseWebSocketOptions {
  executionId: string | null
  executionStatus?: ExecutionStatus // Current execution status
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
  // Dependency injection
  webSocketFactory?: WebSocketFactory
  windowLocation?: WindowLocation | null
  logger?: typeof logger
}

export function useWebSocket({
  executionId,
  executionStatus,
  onLog,
  onStatus,
  onNodeUpdate,
  onCompletion,
  onError,
  webSocketFactory = defaultAdapters.createWebSocketFactory(),
  windowLocation = defaultAdapters.createWindowLocation(),
  logger: injectedLogger = logger
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const lastKnownStatusRef = useRef<ExecutionStatus | undefined>(executionStatus)

  const connect = useCallback(() => {
    // Check if connection should be skipped
    if (shouldSkipConnection(executionId, executionStatus, lastKnownStatusRef.current)) {
      if (isTemporaryExecutionId(executionId)) {
        injectedLogger.debug(`[WebSocket] Skipping connection to temporary execution ID: ${executionId}`)
      } else {
        // Log termination status
        const currentStatus = executionStatus || lastKnownStatusRef.current
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          injectedLogger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`)
        }
      }
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Build WebSocket URL
    const wsUrl = buildWebSocketUrl(executionId!, windowLocation)
    injectedLogger.debug(`[WebSocket] Connecting to ${wsUrl} for execution ${executionId}`)

    try {
      const ws = webSocketFactory.create(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        injectedLogger.debug(`[WebSocket] Connected to execution ${executionId}`)
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message, {
            onLog,
            onStatus,
            onNodeUpdate,
            onCompletion,
            onError,
            logger: injectedLogger
          })
        } catch (error) {
          injectedLogger.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        // Extract more details from the error event
        const errorMessage = error instanceof Error ? error.message : 'Unknown WebSocket error'
        const wsStateText = getWebSocketStateText(ws.readyState)
        
        injectedLogger.error(`[WebSocket] Connection error for execution ${executionId}:`, {
          message: errorMessage,
          readyState: wsStateText,
          url: wsUrl
        })
        setIsConnected(false)
      }

      ws.onclose = (event) => {
        const { code, reason, wasClean } = event
        injectedLogger.debug(`[WebSocket] Disconnected from execution ${executionId}`, {
          code,
          reason: reason && reason.length > 0 ? reason : 'No reason provided',
          wasClean,
          reconnectAttempts: reconnectAttempts.current
        })
        setIsConnected(false)
        wsRef.current = null

        // Check if reconnection should be attempted
        if (!shouldReconnect(
          wasClean,
          code,
          reconnectAttempts.current,
          maxReconnectAttempts,
          executionId,
          executionStatus,
          lastKnownStatusRef.current
        )) {
          if (isTemporaryExecutionId(executionId)) {
            injectedLogger.debug(`[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`)
          } else {
            const currentStatus = executionStatus || lastKnownStatusRef.current
            if (currentStatus === 'completed' || currentStatus === 'failed') {
              injectedLogger.debug(`[WebSocket] Skipping reconnect - execution ${executionId} is ${currentStatus}`)
            } else if (wasClean && code === 1000) {
              injectedLogger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`)
            }
          }
          return
        }

        // Attempt to reconnect
        reconnectAttempts.current++
        const delay = calculateReconnectDelay(reconnectAttempts.current, 10000)
        injectedLogger.debug(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
        
        // Handle max attempts reached
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          injectedLogger.warn(`[WebSocket] Max reconnect attempts (${maxReconnectAttempts}) reached for execution ${executionId}`)
          if (onError) {
            onError(`WebSocket connection failed after ${maxReconnectAttempts} attempts`)
          }
        }
      }
    } catch (error) {
      injectedLogger.error(`[WebSocket] Failed to create connection for execution ${executionId}:`, error)
      setIsConnected(false)
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to create WebSocket connection')
      }
    }
  }, [executionId, executionStatus, onLog, onStatus, onNodeUpdate, onCompletion, onError, webSocketFactory, windowLocation, injectedLogger])

  // Update last known status when it changes
  useEffect(() => {
    if (executionStatus) {
      lastKnownStatusRef.current = executionStatus
      
      // If execution completed or failed, close connection
      if (isExecutionTerminated(executionStatus)) {
        if (wsRef.current) {
          injectedLogger.debug(`[WebSocket] Closing connection - execution ${executionId} is ${executionStatus}`)
          wsRef.current.close(1000, 'Execution completed')
          wsRef.current = null
        }
        setIsConnected(false)
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }
    }
  }, [executionId, executionStatus, injectedLogger])

  useEffect(() => {
    // Clear any pending reconnection attempts when execution ID changes
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Reset reconnect attempts when execution ID changes
    reconnectAttempts.current = 0
    
    if (executionId) {
      // Check if connection should be skipped
      if (shouldSkipConnection(executionId, executionStatus, lastKnownStatusRef.current)) {
        // Close any existing connection
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
        setIsConnected(false)
        
        // Log skip reason for test coverage
        if (isTemporaryExecutionId(executionId)) {
          // Already logged in connect() if called, but log here too for useEffect path
        } else {
          const currentStatus = executionStatus || lastKnownStatusRef.current
          if (currentStatus === 'completed' || currentStatus === 'failed') {
            injectedLogger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`)
          }
        }
        return
      }
      
      connect()
    } else {
      // Close connection if no execution ID
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
    }
  }, [executionId, executionStatus, connect, injectedLogger])

  return { isConnected }
}

