var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { act } from "@testing-library/react";
import { WebSocketConnectionManager } from "./WebSocketConnectionManager";
import { WS_CLOSE_CODES, EXECUTION_STATUS } from "./websocketConstants";
const _MockWebSocket = class _MockWebSocket {
  constructor(url) {
    __publicField(this, "readyState", _MockWebSocket.CONNECTING);
    __publicField(this, "url");
    __publicField(this, "onopen", null);
    __publicField(this, "onclose", null);
    __publicField(this, "onerror", null);
    __publicField(this, "onmessage", null);
    this.url = url;
  }
  close(code, reason) {
    this.readyState = _MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent("close", { code: code || 1e3, reason }));
    }
  }
   
  send(_data) {
  }
};
__publicField(_MockWebSocket, "CONNECTING", 0);
__publicField(_MockWebSocket, "OPEN", 1);
__publicField(_MockWebSocket, "CLOSING", 2);
__publicField(_MockWebSocket, "CLOSED", 3);
let MockWebSocket = _MockWebSocket;
describe("WebSocketConnectionManager - Timeout Guards", () => {
  let mockLogger;
  let mockWebSocketFactory;
  let callbacks;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    mockWebSocketFactory = {
      create: jest.fn((url) => new MockWebSocket(url))
    };
    callbacks = {
      onLog: jest.fn(),
      onStatus: jest.fn(),
      onNodeUpdate: jest.fn(),
      onCompletion: jest.fn(),
      onError: jest.fn()
    };
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  describe("Reconnection Timeout Guards", () => {
    it("should stop reconnecting after max attempts", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 3,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const initialWs = manager.ws;
      expect(initialWs).toBeTruthy();
      if (initialWs && initialWs.onclose) {
        initialWs.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      expect(manager.reconnectAttempts).toBe(1);
      expect(manager.reconnectTimeout).toBeTruthy();
      expect(manager.reconnectTimeout).toBeTruthy();
      for (let attempt = 1; attempt <= 3; attempt++) {
        const timeoutBefore = manager.reconnectTimeout;
        expect(timeoutBefore).toBeTruthy();
        const factoryCallsBefore = mockWebSocketFactory.create.mock.calls.length;
        act(() => {
          jest.advanceTimersByTime(6e4);
        });
        const factoryCallsAfter = mockWebSocketFactory.create.mock.calls.length;
        expect(factoryCallsAfter).toBe(factoryCallsBefore + 1);
        const currentWs = manager.ws;
        expect(currentWs).toBeTruthy();
        const reconnectAttemptsAfterConnect = manager.reconnectAttempts;
        if (currentWs && currentWs.onclose) {
          currentWs.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
          const reconnectAttemptsAfterClose = manager.reconnectAttempts;
          if (reconnectAttemptsAfterConnect < 3) {
            expect(reconnectAttemptsAfterClose).toBe(reconnectAttemptsAfterConnect + 1);
          } else {
            expect(reconnectAttemptsAfterClose).toBe(3);
          }
        }
      }
      expect(manager.reconnectAttempts).toBe(3);
      act(() => {
        jest.advanceTimersByTime(4e4);
      });
      const finalWs = manager.ws;
      if (finalWs && finalWs.onclose) {
        act(() => {
          jest.advanceTimersByTime(5);
        });
        finalWs.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Max reconnect attempts reached")
      );
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.stringContaining("WebSocket connection failed after 3 attempts")
      );
    });
    it("should clear existing timeout before setting new one", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      act(() => {
        jest.advanceTimersByTime(100);
      });
      const ws2 = manager.ws;
      if (ws2 && ws2.onclose) {
        ws2.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const secondTimeout = manager.reconnectTimeout;
      expect(secondTimeout).not.toBeNull();
    });
    it("should not reconnect if execution is terminated", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        executionStatus: EXECUTION_STATUS.COMPLETED,
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      act(() => {
        jest.advanceTimersByTime(1e3);
      });
      expect(manager.reconnectAttempts).toBe(0);
    });
    it("should not reconnect if connection was closed cleanly", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: WS_CLOSE_CODES.NORMAL_CLOSURE, wasClean: true }));
      }
      act(() => {
        jest.advanceTimersByTime(1e3);
      });
      expect(manager.reconnectAttempts).toBe(0);
    });
    it("should use sanitized delay for reconnection", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger,
        reconnectionStrategy: {
          calculateDelay: jest.fn(() => 1e5),
          // Returns delay > MAX_DELAY
          shouldReconnect: () => true
        }
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const timeout = manager.reconnectTimeout;
      expect(timeout).not.toBeNull();
    });
  });
  describe("Connection State Guards", () => {
    it("should not connect if executionId is null", () => {
      const manager = new WebSocketConnectionManager({
        executionId: null,
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      expect(mockWebSocketFactory.create).not.toHaveBeenCalled();
    });
    it("should not connect if executionId is temporary", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "pending-123",
        // Use 'pending-' prefix which is checked by isTemporaryExecutionId
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      expect(mockWebSocketFactory.create).not.toHaveBeenCalled();
    });
    it("should close connection when execution terminates", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(closeSpy).toHaveBeenCalledWith(
        WS_CLOSE_CODES.NORMAL_CLOSURE,
        expect.any(String)
      );
      expect(manager.ws).toBeNull();
    });
  });
  describe("Timeout Clearing", () => {
    it("should clear timeout when close is called", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const timeout = manager.reconnectTimeout;
      expect(timeout).not.toBeNull();
      manager.close();
      expect(manager.reconnectTimeout).toBeNull();
    });
    it("should clear timeout when execution terminates", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const timeout = manager.reconnectTimeout;
      expect(timeout).not.toBeNull();
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(manager.reconnectTimeout).toBeNull();
    });
  });
  describe("Close Method - Explicit Boolean Checks", () => {
    it("should verify hasPending === true check in close()", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const timeoutBefore = manager.reconnectTimeout;
      expect(timeoutBefore).not.toBeNull();
      manager.close();
      expect(manager.reconnectTimeout).toBeNull();
    });
    it("should verify hasWebSocket === true check in close()", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      expect(ws).not.toBeNull();
      expect(ws).not.toBeUndefined();
      const closeSpy = jest.spyOn(ws, "close");
      manager.close();
      expect(closeSpy).toHaveBeenCalledWith(
        WS_CLOSE_CODES.NORMAL_CLOSURE,
        void 0
      );
      expect(manager.ws).toBeNull();
    });
    it("should verify hasWebSocket === true check with reason in close()", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.close("Test reason");
      expect(closeSpy).toHaveBeenCalledWith(
        WS_CLOSE_CODES.NORMAL_CLOSURE,
        "Test reason"
      );
    });
    it("should verify close() when hasPending === false", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onopen) {
        ws.onopen(new Event("open"));
      }
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: WS_CLOSE_CODES.NORMAL_CLOSURE, wasClean: true }));
      }
      expect(manager.reconnectTimeout).toBeNull();
      manager.close();
      expect(manager.reconnectTimeout).toBeNull();
    });
    it("should verify close() when hasWebSocket === false", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      expect(manager.ws).toBeNull();
      manager.close();
      expect(manager.ws).toBeNull();
    });
  });
  describe("isConnected Getter - Explicit Boolean Checks", () => {
    it("should verify isStateConnected === true check in isConnected", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onopen) {
        ws.onopen(new Event("open"));
      }
      expect(manager.isConnectedState).toBe(true);
      ws.readyState = MockWebSocket.OPEN;
      expect(manager.isConnected).toBe(true);
    });
    it("should verify isStateConnected === false check in isConnected", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      expect(manager.isConnectedState).toBe(false);
      expect(manager.isConnected).toBe(false);
    });
    it("should verify hasWebSocket === false check in isConnected", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.isConnectedState = true;
      manager.ws = null;
      expect(manager.isConnected).toBe(false);
    });
    it("should verify isOpen === true check in isConnected", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      manager.isConnectedState = true;
      ws.readyState = MockWebSocket.OPEN;
      expect(manager.isConnected).toBe(true);
    });
    it("should verify isOpen === false check in isConnected", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      manager.isConnectedState = true;
      ws.readyState = MockWebSocket.CONNECTING;
      expect(manager.isConnected).toBe(false);
    });
  });
  describe("handleConnectionError - Explicit Checks", () => {
    it("should verify error instanceof Error check in handleConnectionError", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: {
          create: jest.fn(() => {
            throw new Error("Connection failed");
          })
        },
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      expect(callbacks.onError).toHaveBeenCalledWith("Connection failed");
      expect(callbacks.onStatus).toHaveBeenCalledWith("error");
    });
    it("should verify non-Error error handling in handleConnectionError", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: {
          create: jest.fn(() => {
            throw "String error";
          })
        },
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      expect(callbacks.onError).toHaveBeenCalledWith("String error");
      expect(callbacks.onStatus).toHaveBeenCalledWith("error");
    });
  });
  describe("updateStatus - Explicit Boolean Checks", () => {
    it("should verify hasStatus === true check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      const initialLastKnownStatus = manager.lastKnownStatus;
      manager.updateStatus(EXECUTION_STATUS.RUNNING);
      expect(manager.lastKnownStatus).toBe(EXECUTION_STATUS.RUNNING);
      expect(manager.lastKnownStatus).not.toBe(initialLastKnownStatus);
    });
    it("should verify hasStatus === false check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        executionStatus: EXECUTION_STATUS.RUNNING,
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      const initialLastKnownStatus = manager.lastKnownStatus;
      manager.updateStatus(void 0);
      expect(manager.lastKnownStatus).toBe(initialLastKnownStatus);
    });
    it("should verify hasStatusValue === true check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(closeSpy).toHaveBeenCalled();
    });
    it("should verify hasStatusValue === false check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(void 0);
      expect(closeSpy).not.toHaveBeenCalled();
    });
    it("should verify isTerminated === true check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(closeSpy).toHaveBeenCalled();
    });
    it("should verify isTerminated === false check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(EXECUTION_STATUS.RUNNING);
      expect(closeSpy).not.toHaveBeenCalled();
    });
    it("should verify hasWebSocket === true check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      expect(ws).not.toBeNull();
      expect(ws).not.toBeUndefined();
      const closeSpy = jest.spyOn(ws, "close");
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(closeSpy).toHaveBeenCalled();
    });
    it("should verify hasWebSocket === false check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      expect(manager.ws).toBeNull();
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(manager.ws).toBeNull();
    });
    it("should verify hasPending === true check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      const ws = manager.ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent("close", { code: 1006, wasClean: false }));
      }
      const timeoutBefore = manager.reconnectTimeout;
      expect(timeoutBefore).not.toBeNull();
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(manager.reconnectTimeout).toBeNull();
    });
    it("should verify hasPending === false check in updateStatus", () => {
      const manager = new WebSocketConnectionManager({
        executionId: "exec-123",
        maxReconnectAttempts: 5,
        webSocketFactory: mockWebSocketFactory,
        windowLocation: { protocol: "ws:", host: "localhost:8000" },
        logger: mockLogger
      });
      manager.connect(callbacks);
      act(() => {
        jest.advanceTimersByTime(20);
      });
      expect(manager.reconnectTimeout).toBeNull();
      manager.updateStatus(EXECUTION_STATUS.COMPLETED);
      expect(manager.reconnectTimeout).toBeNull();
    });
  });
});
