import { useEffect, useRef, useState } from "react";
import { logger } from "../../utils/logger";
import { defaultAdapters } from "../../types/adapters";
import { WebSocketConnectionManager } from "../utils/WebSocketConnectionManager";

/**
 * Callbacks are read from optionsRef so parent inline handlers (e.g. ExecutionConsole)
 * do not change identity every render — that previously retriggered this effect, closing
 * and reopening the socket each time and exhausting browser WebSocket limits
 * ("Insufficient resources").
 */
function useWebSocket(options) {
  const [isConnected, setIsConnected] = useState(false);
  const managerRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
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
  const authReadyGate =
    options.authReady === undefined ? true : Boolean(options.authReady);
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    const executionId = options.executionId;
    manager.updateExecutionId(executionId);
    manager.resetReconnectAttempts();
    const callbacks = {
      onLog: (...args) => optionsRef.current.onLog?.(...args),
      onStatus: (status) => {
        setIsConnected(status === "connected");
        optionsRef.current.onStatus?.(status);
      },
      onNodeUpdate: (...args) =>
        optionsRef.current.onNodeUpdate?.(...args),
      onCompletion: (...args) =>
        optionsRef.current.onCompletion?.(...args),
      onError: (...args) => optionsRef.current.onError?.(...args),
    };
    const canConnect =
      Boolean(executionId) === true && authReadyGate === true;
    if (canConnect === true) {
      manager.connect(callbacks);
    } else {
      manager.close();
      setIsConnected(false);
    }
    return () => {
      manager.close();
      setIsConnected(false);
    };
  }, [options.executionId, authReadyGate]);
  return { isConnected };
}
export { useWebSocket };
