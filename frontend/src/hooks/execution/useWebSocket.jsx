import { useEffect, useRef, useState } from "react";
import { logger } from "../../utils/logger";
import { defaultAdapters } from "../../types/adapters";
import { WebSocketConnectionManager } from "../utils/WebSocketConnectionManager";
function useWebSocket(options) {
  const [isConnected, setIsConnected] = useState(false);
  const managerRef = useRef(null);
  if (!managerRef.current) {
    managerRef.current = new WebSocketConnectionManager({
      executionId: options.executionId,
      executionStatus: options.executionStatus,
      maxReconnectAttempts: 5,
      webSocketFactory:
        options.webSocketFactory !== null && options.webSocketFactory !== void 0
          ? options.webSocketFactory
          : defaultAdapters.createWebSocketFactory(),
      windowLocation:
        options.windowLocation !== void 0
          ? options.windowLocation
          : defaultAdapters.createWindowLocation(),
      getAuthToken: options.getAuthToken,
      logger:
        options.logger !== null && options.logger !== void 0
          ? options.logger
          : logger,
    });
  }
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateStatus(options.executionStatus);
    }
  }, [options.executionStatus]);
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.updateExecutionId(options.executionId);
    manager.resetReconnectAttempts();
    const callbacks = {
      onLog: options.onLog,
      onStatus: (status) => {
        setIsConnected(status === "connected");
        options.onStatus?.(status);
      },
      onNodeUpdate: options.onNodeUpdate,
      onCompletion: options.onCompletion,
      onError: options.onError,
    };
    if (options.executionId) {
      manager.connect(callbacks);
    } else {
      manager.close();
      setIsConnected(false);
    }
    return () => {
      manager.close();
      setIsConnected(false);
    };
  }, [
    options.executionId,
    options.onLog,
    options.onStatus,
    options.onNodeUpdate,
    options.onCompletion,
    options.onError,
  ]);
  return { isConnected };
}
export { useWebSocket };
