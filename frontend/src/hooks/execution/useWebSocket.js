import { useEffect, useRef, useState } from 'react';
import { logger } from '../../utils/logger';
import { defaultAdapters } from '../../types/adapters';
import { WebSocketConnectionManager } from '../utils/WebSocketConnectionManager';
/**
 * WebSocket Hook
 * Separated from connection management logic for better testability
 * Single Responsibility: Only handles React lifecycle
 */ export function useWebSocket(options) {
    const [isConnected, setIsConnected] = useState(false);
    const managerRef = useRef(null);
    // Initialize manager once
    if (!managerRef.current) {
        managerRef.current = new WebSocketConnectionManager({
            executionId: options.executionId,
            executionStatus: options.executionStatus,
            maxReconnectAttempts: 5,
            webSocketFactory: options.webSocketFactory !== null && options.webSocketFactory !== undefined ? options.webSocketFactory : defaultAdapters.createWebSocketFactory(),
            windowLocation: options.windowLocation !== undefined ? options.windowLocation : defaultAdapters.createWindowLocation(),
            getAuthToken: options.getAuthToken,
            logger: options.logger !== null && options.logger !== undefined ? options.logger : logger
        });
    }
    // Update manager state when execution status changes
    useEffect(()=>{
        if (managerRef.current) {
            managerRef.current.updateStatus(options.executionStatus);
        }
    }, [
        options.executionStatus
    ]);
    // Handle connection lifecycle
    useEffect(()=>{
        const manager = managerRef.current;
        if (!manager) return;
        // Update execution ID in manager
        manager.updateExecutionId(options.executionId);
        // Reset attempts when execution ID changes
        manager.resetReconnectAttempts();
        const callbacks = {
            onLog: options.onLog,
            onStatus: (status)=>{
                setIsConnected(status === 'connected');
                options.onStatus?.(status);
            },
            onNodeUpdate: options.onNodeUpdate,
            onCompletion: options.onCompletion,
            onError: options.onError
        };
        if (options.executionId) {
            manager.connect(callbacks);
        } else {
            manager.close();
            setIsConnected(false);
        }
        return ()=>{
            manager.close();
            setIsConnected(false);
        };
    // Full `options` omitted: parent often passes new object identity each render; listing stable callbacks/ids above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        options.executionId,
        options.onLog,
        options.onStatus,
        options.onNodeUpdate,
        options.onCompletion,
        options.onError
    ]);
    return {
        isConnected
    };
}
