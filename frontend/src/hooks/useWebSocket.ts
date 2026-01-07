import { useEffect, useRef, useState, useCallback } from 'react'

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
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
}

export function useWebSocket({
  executionId,
  onLog,
  onStatus,
  onNodeUpdate,
  onCompletion,
  onError
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!executionId) {
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/api/ws/executions/${executionId}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to execution ${executionId}`)
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
                // Extract node_id from message if available
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
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log(`[WebSocket] Disconnected from execution ${executionId}`)
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect if execution might still be running
        if (reconnectAttempts.current < maxReconnectAttempts && executionId) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error)
      setIsConnected(false)
    }
  }, [executionId, onLog, onStatus, onNodeUpdate, onCompletion, onError])

  useEffect(() => {
    if (executionId) {
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
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
    }
  }, [executionId, connect])

  return { isConnected }
}

