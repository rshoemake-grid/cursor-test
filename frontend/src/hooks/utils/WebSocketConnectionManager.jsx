var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value);
var __publicField = (obj, key, value) =>
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { getWebSocketStateText } from "./websocketStateUtils";
import { ExecutionStatusChecker } from "./executionStatusUtils";
import { buildWebSocketUrl } from "./websocketUrlBuilder";
import { handleWebSocketMessage } from "./websocketMessageHandler";
import { ExponentialBackoffStrategy } from "./websocketReconnectionStrategy";
import {
  WS_CLOSE_CODES,
  WS_STATUS,
  WS_CLOSE_REASONS,
  WS_RECONNECT,
} from "./websocketConstants";
import { extractApiErrorMessage } from "./apiUtils";
import {
  hasPendingReconnection,
  sanitizeReconnectionDelay,
  isCleanClosure,
  getCloseReason,
} from "./websocketValidation";
import {
  logSkipConnectionReason,
  logSkipReconnectReason,
} from "./websocketLogging";
class WebSocketConnectionManager {
  constructor(config) {
    this.config = config;
    __publicField(this, "ws", null);
    __publicField(this, "reconnectTimeout", null);
    __publicField(this, "reconnectAttempts", 0);
    __publicField(this, "lastKnownStatus");
    __publicField(this, "isConnectedState", false);
    __publicField(this, "reconnectionStrategy");
    this.lastKnownStatus = config.executionStatus;
    this.reconnectionStrategy =
      config.reconnectionStrategy ?? new ExponentialBackoffStrategy();
  }
  /**
   * Update execution status
   * Single Responsibility: Only updates status
   */
  updateStatus(status) {
    const hasStatus = status !== null && status !== void 0;
    this.lastKnownStatus = hasStatus === true ? status : this.lastKnownStatus;
    this.config.executionStatus = status;
    const hasStatusValue = status !== null && status !== void 0;
    if (hasStatusValue === true) {
      const isTerminated = ExecutionStatusChecker.isTerminated(status);
      if (isTerminated === true) {
        const hasWebSocket = this.ws !== null && this.ws !== void 0;
        if (hasWebSocket === true) {
          this.config.logger.debug(
            `[WebSocket] Closing connection - execution ${this.config.executionId} is ${status}`,
          );
          this.ws.close(
            WS_CLOSE_CODES.NORMAL_CLOSURE,
            WS_CLOSE_REASONS.EXECUTION_COMPLETED,
          );
          this.ws = null;
        }
        this.isConnectedState = false;
        const hasPending =
          hasPendingReconnection(this.reconnectTimeout) === true;
        if (hasPending === true) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }
    }
  }
  /**
   * Update execution ID
   * Single Responsibility: Only updates execution ID
   */
  updateExecutionId(executionId) {
    this.config.executionId = executionId;
    this.resetReconnectAttempts();
  }
  /**
   * Connect to WebSocket
   * Single Responsibility: Only establishes connection
   */
  connect(callbacks) {
    const shouldSkip =
      ExecutionStatusChecker.shouldSkip(
        this.config.executionId,
        this.config.executionStatus,
        this.lastKnownStatus,
      ) === true;
    if (shouldSkip === true) {
      this.logSkipReason();
      return;
    }
    this.close();
    const authToken = this.config.getAuthToken?.() ?? null;
    const wsUrl = buildWebSocketUrl(
      this.config.executionId,
      this.config.windowLocation,
      authToken,
    );
    this.config.logger.debug(`[WebSocket] Connecting to ${wsUrl}`);
    try {
      const ws = this.config.webSocketFactory.create(wsUrl);
      this.ws = ws;
      this.setupEventHandlers(ws, callbacks, wsUrl);
    } catch (error) {
      this.config.logger.error(
        `Failed to create connection for execution ${this.config.executionId}`,
        error,
      );
      this.handleConnectionError(error, callbacks);
    }
  }
  /**
   * Setup WebSocket event handlers
   * Single Responsibility: Only sets up handlers
   */
  setupEventHandlers(ws, callbacks, wsUrl) {
    ws.onopen = () => {
      this.config.logger.debug(
        `[WebSocket] Connected to execution ${this.config.executionId}`,
      );
      this.isConnectedState = true;
      this.reconnectAttempts = 0;
      callbacks.onStatus?.(WS_STATUS.CONNECTED);
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message, {
          onLog: callbacks.onLog,
          onStatus: callbacks.onStatus,
          onNodeUpdate: callbacks.onNodeUpdate,
          onCompletion: callbacks.onCompletion,
          onError: callbacks.onError,
          logger: this.config.logger,
        });
      } catch (error) {
        this.config.logger.error("[WebSocket] Failed to parse message:", error);
      }
    };
    ws.onerror = (error) => {
      const errorMessage = extractApiErrorMessage(
        error,
        "Unknown WebSocket error",
      );
      this.config.logger.error(
        `[WebSocket] Connection error for execution ${this.config.executionId}:`,
        {
          message: errorMessage,
          readyState: getWebSocketStateText(ws.readyState),
          url: wsUrl,
        },
      );
      this.isConnectedState = false;
      callbacks.onStatus?.(WS_STATUS.ERROR);
    };
    ws.onclose = (event) => {
      const reason = getCloseReason(event);
      this.config.logger.debug(
        `[WebSocket] Disconnected from execution ${this.config.executionId}`,
        {
          code: event.code,
          reason,
          wasClean: event.wasClean,
          reconnectAttempts: this.reconnectAttempts,
        },
      );
      this.ws = null;
      this.isConnectedState = false;
      callbacks.onStatus?.(WS_STATUS.DISCONNECTED);
      this.handleReconnection(event, callbacks);
    };
  }
  /**
   * Handle reconnection logic
   * Single Responsibility: Only handles reconnection
   * Uses Strategy Pattern for extensible reconnection strategies
   */
  handleReconnection(event, callbacks) {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.config.logger.warn(`[WebSocket] Max reconnect attempts reached`);
      callbacks.onError?.(
        `WebSocket connection failed after ${this.config.maxReconnectAttempts} attempts`,
      );
      return;
    }
    const shouldReconnect =
      ExecutionStatusChecker.shouldReconnect(
        event.wasClean,
        event.code,
        this.reconnectAttempts,
        this.config.maxReconnectAttempts,
        this.config.executionId,
        this.config.executionStatus,
        this.lastKnownStatus,
      ) === true;
    if (shouldReconnect === false) {
      this.logSkipReconnectReason(event);
      return;
    }
    this.reconnectAttempts++;
    const baseDelay = WS_RECONNECT.DEFAULT_MAX_DELAY;
    const calculatedDelay = this.reconnectionStrategy.calculateDelay(
      this.reconnectAttempts,
      baseDelay,
    );
    const safeDelay = sanitizeReconnectionDelay(calculatedDelay);
    this.config.logger.debug(
      `[WebSocket] Reconnecting in ${safeDelay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
    );
    const hasPending = hasPendingReconnection(this.reconnectTimeout) === true;
    if (hasPending === true) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      const canStillReconnect =
        this.reconnectAttempts <= this.config.maxReconnectAttempts;
      if (canStillReconnect === true) {
        this.connect(callbacks);
      }
    }, safeDelay);
  }
  /**
   * Close connection
   * Single Responsibility: Only closes connection
   */
  close(reason) {
    const hasPending = hasPendingReconnection(this.reconnectTimeout) === true;
    if (hasPending === true) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    const hasWebSocket = this.ws !== null && this.ws !== void 0;
    if (hasWebSocket === true) {
      this.ws.close(WS_CLOSE_CODES.NORMAL_CLOSURE, reason);
      this.ws = null;
    }
    this.isConnectedState = false;
  }
  /**
   * Get connection state
   * Mutation-resistant: explicit state check
   */
  get isConnected() {
    const isStateConnected = this.isConnectedState === true;
    if (isStateConnected === false) {
      return false;
    }
    const hasWebSocket = this.ws !== null && this.ws !== void 0;
    if (hasWebSocket === false) {
      return false;
    }
    const isOpen = this.ws.readyState === WebSocket.OPEN;
    if (isOpen === true) {
      return true;
    }
    return false;
  }
  /**
   * Reset reconnect attempts
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
  /**
   * Log skip reason
   * DRY: Uses extracted logging utility
   */
  logSkipReason() {
    logSkipConnectionReason(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus,
      this.config.logger,
    );
  }
  /**
   * Log skip reconnect reason
   * DRY: Uses extracted logging utility
   */
  logSkipReconnectReason(event) {
    logSkipReconnectReason(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus,
      event,
      isCleanClosure,
      this.config.logger,
    );
  }
  /**
   * Handle connection error
   * Single Responsibility: Only handles connection errors
   */
  handleConnectionError(error, callbacks) {
    this.isConnectedState = false;
    callbacks.onStatus?.(WS_STATUS.ERROR);
    callbacks.onError?.(
      extractApiErrorMessage(error, "Failed to create WebSocket connection"),
    );
  }
}
export { WebSocketConnectionManager };
