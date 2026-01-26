import { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '../utils/logger'
import type { WebSocketFactory, WindowLocation } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface WebSocketMessage {
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

interface UseWebSocketOptions {
  executionId: string | null
  executionStatus?: 'running' | 'completed' | 'failed' | 'pending' | 'paused' // Current execution status
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
  const lastKnownStatusRef = useRef<string | undefined>(executionStatus)

  const connect = useCallback(() => {
    if (!executionId) {
      return
    }

    // Don't connect to temporary execution IDs (they don't exist in backend)
    if (executionId.startsWith('pending-')) {
      injectedLogger.debug(`[WebSocket] Skipping connection to temporary execution ID: ${executionId}`)
      return
    }

    // Don't connect if execution is already completed or failed
    const currentStatus = executionStatus || lastKnownStatusRef.current
    if (currentStatus === 'completed' || currentStatus === 'failed') {
      injectedLogger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`)
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Determine WebSocket URL
    // Use /ws path which is proxied by Vite to backend
    // Provide fallback for test environments
    const protocol = windowLocation?.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = windowLocation?.host || 'localhost:8000'
    const wsUrl = `${protocol}//${host}/ws/executions/${executionId}`
    
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
        } catch (error) {
          injectedLogger.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        // Extract more details from the error event
        const errorMessage = error instanceof Error ? error.message : 'Unknown WebSocket error'
        const wsState = ws.readyState
        const wsStateText = wsState === WebSocket.CONNECTING ? 'CONNECTING' :
                           wsState === WebSocket.OPEN ? 'OPEN' :
                           wsState === WebSocket.CLOSING ? 'CLOSING' :
                           wsState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN'
        
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
          reason: reason || 'No reason provided',
          wasClean,
          reconnectAttempts: reconnectAttempts.current
        })
        setIsConnected(false)
        wsRef.current = null

        // Don't reconnect to temporary execution IDs
        if (executionId && executionId.startsWith('pending-')) {
          injectedLogger.debug(`[WebSocket] Skipping reconnect for temporary execution ID: ${executionId}`)
          return
        }

        // Don't reconnect if execution is completed or failed
        const currentStatus = executionStatus || lastKnownStatusRef.current
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          injectedLogger.debug(`[WebSocket] Skipping reconnect - execution ${executionId} is ${currentStatus}`)
          return
        }

        // Don't reconnect if connection was closed cleanly and execution might be done
        if (wasClean && code === 1000) {
          injectedLogger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`)
          return
        }

        // Attempt to reconnect if execution might still be running
        if (reconnectAttempts.current < maxReconnectAttempts && executionId) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          injectedLogger.debug(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
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
      if (executionStatus === 'completed' || executionStatus === 'failed') {
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
      // Don't connect to temporary execution IDs
      if (executionId.startsWith('pending-')) {
        // Close any existing connection
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
        setIsConnected(false)
        return
      }
      
      // Don't connect if execution is already completed or failed
      const currentStatus = executionStatus || lastKnownStatusRef.current
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        injectedLogger.debug(`[WebSocket] Skipping connection - execution ${executionId} is ${currentStatus}`)
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

