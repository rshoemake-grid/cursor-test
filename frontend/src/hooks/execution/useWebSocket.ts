import { useEffect, useRef, useState } from 'react'
import { logger } from '../../utils/logger'
import type { WebSocketFactory, WindowLocation } from '../../types/adapters'
import { defaultAdapters } from '../../types/adapters'
import {
  WebSocketConnectionManager,
  type WebSocketCallbacks
} from '../utils/WebSocketConnectionManager'
import type { ExecutionStatus } from './useWebSocket.utils'
import { logicalOr } from '../utils/logicalOr'

interface UseWebSocketOptions {
  executionId: string | null
  executionStatus?: ExecutionStatus
  onLog?: (log: any) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
  webSocketFactory?: WebSocketFactory
  windowLocation?: WindowLocation | null
  logger?: typeof logger
}

/**
 * WebSocket Hook
 * Separated from connection management logic for better testability
 * Single Responsibility: Only handles React lifecycle
 */
export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const managerRef = useRef<WebSocketConnectionManager | null>(null)

  // Initialize manager once
  if (!managerRef.current) {
    managerRef.current = new WebSocketConnectionManager({
      executionId: options.executionId,
      executionStatus: options.executionStatus,
      maxReconnectAttempts: 5,
      webSocketFactory: logicalOr(options.webSocketFactory, defaultAdapters.createWebSocketFactory()),
      windowLocation: options.windowLocation !== undefined ? options.windowLocation : defaultAdapters.createWindowLocation(),
      logger: logicalOr(options.logger, logger)
    })
  }

  // Update manager state when execution status changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateStatus(options.executionStatus)
    }
  }, [options.executionStatus])

  // Handle connection lifecycle
  useEffect(() => {
    const manager = managerRef.current
    if (!manager) return

    // Update execution ID in manager
    manager.updateExecutionId(options.executionId)

    // Reset attempts when execution ID changes
    manager.resetReconnectAttempts()

    const callbacks: WebSocketCallbacks = {
      onLog: options.onLog,
      onStatus: (status) => {
        setIsConnected(status === 'connected')
        options.onStatus?.(status)
      },
      onNodeUpdate: options.onNodeUpdate,
      onCompletion: options.onCompletion,
      onError: options.onError
    }

    if (options.executionId) {
      manager.connect(callbacks)
    } else {
      manager.close()
      setIsConnected(false)
    }

    return () => {
      manager.close()
      setIsConnected(false)
    }
  }, [
    options.executionId,
    options.onLog,
    options.onStatus,
    options.onNodeUpdate,
    options.onCompletion,
    options.onError
  ])

  return { isConnected }
}
