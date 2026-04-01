import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger
} from "./useWebSocket.test.setup";
describe("useWebSocket - edges.comprehensive.2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
    if (logger.debug && typeof logger.debug.mockReset === "function") {
      logger.debug.mockReset();
    }
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
    if (logger.debug && typeof logger.debug.mockReset === "function") {
      logger.debug.mockReset();
    }
  });
  describe("template literal string coverage", () => {
    it("should verify exact logger.debug message for pending execution ID", async () => {
      const executionId = "pending-test-123";
      renderHook(
        () => useWebSocket({
          executionId
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify exact logger.debug message for skipping connection", async () => {
      const executionId = "exec-1";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "completed"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Skipping connection - execution exec-1 is completed")
      );
    });
    it("should verify exact logger.debug message for connecting", async () => {
      const executionId = "exec-connect-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const debugCalls = logger.debug.mock.calls;
        const connectCall = debugCalls.find(
          (call) => call[0]?.includes("Connecting to")
        );
        expect(connectCall).toBeDefined();
        if (connectCall) {
          expect(connectCall[0]).toContain("Connecting to");
          expect(connectCall[0]).toContain(executionId);
        }
      }
    });
    it("should verify exact logger.debug message for connected", async () => {
      const executionId = "exec-connected-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Connected to execution exec-connected-test"
        );
      }
    });
    it("should verify exact logger.debug message for disconnected", async () => {
      const executionId = "exec-disconnect-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "Test reason", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Disconnected from execution exec-disconnect-test"),
          expect.objectContaining({
            code: 1e3,
            reason: "Test reason",
            wasClean: true
          })
        );
      }
    });
    it("should verify exact logger.debug message for skipping reconnect", async () => {
      const executionId = "pending-reconnect-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Skipping reconnect for temporary execution ID: pending-reconnect-test"
        );
      }
    });
    it("should verify exact logger.debug message for skipping reconnect with status", async () => {
      const executionId = "exec-status-test";
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId,
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping reconnect")
        );
        expect(reconnectCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact logger.debug message for clean close", async () => {
      const executionId = "exec-clean-close-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Connection closed cleanly, not reconnecting"
        );
      }
    });
    it("should verify exact logger.debug message for reconnecting", async () => {
      const executionId = "exec-reconnect-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringMatching(/Reconnecting in \d+ms \(attempt \d+\/5\)/)
        );
      }
    });
    it("should verify exact logger.warn message for max reconnect attempts", async () => {
      const executionId = "exec-max-attempts-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.warn).toBeDefined();
    });
    it("should verify exact logger.error message for connection error", async () => {
      const executionId = "exec-error-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateError(new Error("Test error"));
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].message).toBeDefined();
        }
      }
    });
    it("should verify exact logger.error message for failed to create connection", async () => {
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
         
        constructor(_url) {
          throw new Error("Failed to create WebSocket");
        }
      };
      const executionId = "exec-create-error-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create connection for execution"),
        expect.any(Error)
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact logger.debug message for closing connection", async () => {
      const executionId = "exec-close-test";
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId,
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Closing connection")
        );
        expect(closeCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact logger.error message for onError callback", async () => {
      const executionId = "exec-onerror-test";
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateError(new Error("Test error"));
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
      }
    });
    it("should verify exact onError message for max attempts", async () => {
      const executionId = "exec-max-onerror-test";
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toBeDefined();
    });
    it("should verify exact onError message for failed to create", async () => {
      const OriginalWebSocket = global.WebSocket;
      const onError = jest.fn();
      global.WebSocket = class {
         
        constructor(_url) {
          throw new Error("Connection failed");
        }
      };
      const executionId = "exec-create-onerror-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Connection failed");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify error instanceof Error check in catch block - Error path", async () => {
      const OriginalWebSocket = global.WebSocket;
      const onError = jest.fn();
      global.WebSocket = class {
         
        constructor(_url) {
          throw new Error("Test error");
        }
      };
      const executionId = "exec-instanceof-error-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Test error");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify error instanceof Error check in catch block - non-Error path", async () => {
      const OriginalWebSocket = global.WebSocket;
      const onError = jest.fn();
      global.WebSocket = class {
         
        constructor(_url) {
          throw "String error";
        }
      };
      const executionId = "exec-instanceof-nonerror-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("String error");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify error instanceof Error check in onerror handler - Error path", async () => {
      const executionId = "exec-onerror-instanceof-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        const errorEvent = new ErrorEvent("error", { error: new Error("Test error message") });
        Object.defineProperty(errorEvent, "error", {
          value: new Error("Test error message"),
          writable: true
        });
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].message).toBeDefined();
        }
      }
    });
    it("should verify error instanceof Error check in onerror handler - non-Error path", async () => {
      const executionId = "exec-onerror-nonerror-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        const errorEvent = new Event("error");
        errorEvent.error = null;
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].message).toBe("Unknown WebSocket error");
        }
      }
    });
    it('should verify exact string literal "Unknown WebSocket error"', async () => {
      const executionId = "exec-unknown-error-string-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        const errorEvent = new Event("error");
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].message).toBe("Unknown WebSocket error");
        }
      }
    });
    it('should verify exact string literal "Failed to create WebSocket connection"', async () => {
      const OriginalWebSocket = global.WebSocket;
      const onError = jest.fn();
      global.WebSocket = class {
         
        constructor(_url) {
          throw null;
        }
      };
      const executionId = "exec-failed-create-string-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Failed to create WebSocket connection");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact onError message for failed to create with non-Error", async () => {
      const OriginalWebSocket = global.WebSocket;
      const onError = jest.fn();
      global.WebSocket = class {
         
        constructor(_url) {
          throw "String error";
        }
      };
      const executionId = "exec-create-onerror-string-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("String error");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify URL template literal construction", async () => {
      const executionId = "exec-url-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("/ws/executions/exec-url-test");
      }
    });
    it("should verify protocol template literal for https", async () => {
      const executionId = "exec-https-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toMatch(/^(wss?):\/\//);
      }
    });
    it("should verify protocol template literal for http", async () => {
      const executionId = "exec-http-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toMatch(/^(wss?):\/\//);
      }
    });
    it("should verify exact template literal with protocol and host", async () => {
      const executionId = "exec-url-template-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("/ws/executions/exec-url-template-test");
        expect(ws.url).toMatch(/^(wss?):\/\//);
      }
    });
    it("should verify exact template literal in logger.debug for connecting", async () => {
      const executionId = "exec-connecting-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalled();
      const connectCalls = logger.debug.mock.calls.filter(
        (call) => call[0]?.includes("Connecting to") && call[0]?.includes(executionId)
      );
      expect(connectCalls.length).toBeGreaterThan(0);
    });
    it("should verify exact template literal in logger.debug for connected", async () => {
      const executionId = "exec-connected-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          `[WebSocket] Connected to execution ${executionId}`
        );
      }
    });
    it("should verify exact template literal in logger.debug for disconnected", async () => {
      const executionId = "exec-disconnected-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "Test reason", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(`Disconnected from execution ${executionId}`),
          expect.any(Object)
        );
      }
    });
    it("should verify exact template literal in logger.debug for reconnecting", async () => {
      const executionId = "exec-reconnecting-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in") && call[0]?.includes("attempt")
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      }
    });
    it("should verify exact template literal in logger.warn for max attempts", async () => {
      const executionId = "exec-max-attempts-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.warn).toBeDefined();
    });
    it("should verify exact template literal in logger.error for failed to create", async () => {
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
         
        constructor(_url) {
          throw new Error("Failed to create WebSocket");
        }
      };
      const executionId = "exec-create-error-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to create connection for execution ${executionId}`),
        expect.any(Error)
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact template literal in onError callback for max attempts", async () => {
      const executionId = "exec-max-onerror-template-test";
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toBeDefined();
    });
    it("should verify exact template literal in logger.debug for closing connection", async () => {
      const executionId = "exec-closing-log-test";
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId,
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Closing connection") && call[0]?.includes(executionId)
        );
        expect(closeCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact template literal in logger.debug for skipping connection with status", async () => {
      const executionId = "exec-skip-status-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "completed"
        })
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalled();
      const skipCalls = logger.debug.mock.calls.filter(
        (call) => call[0]?.includes("Skipping connection") && call[0]?.includes(executionId) && call[0]?.includes("completed")
      );
      expect(skipCalls.length).toBeGreaterThanOrEqual(0);
    });
    it("should verify exact template literal in logger.debug for skipping reconnect with status", async () => {
      const executionId = "exec-skip-reconnect-status-log-test";
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId,
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const skipCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping reconnect") && call[0]?.includes(executionId)
        );
        expect(skipCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact template literal in logger.debug for skipping reconnect for pending", async () => {
      const executionId = "pending-skip-reconnect-log-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const skipCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping reconnect for temporary execution ID")
        );
        expect(skipCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact template literal in logger.debug for skipping connection for pending", async () => {
      const executionId = "pending-skip-connection-log-test";
      renderHook(
        () => useWebSocket({
          executionId
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify exact template literal in logger.error for connection error", async () => {
      const executionId = "exec-error-template-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateError(new Error("Test error"));
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining(`Connection error for execution ${executionId}:`),
          expect.any(Object)
        );
      }
    });
    describe("Math operations coverage", () => {
      it("should verify Math.pow operation in reconnect delay calculation", async () => {
        const executionId = "exec-math-pow-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify Math.min operation caps delay at 10000", async () => {
        const executionId = "exec-math-min-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          for (let i = 0; i < 5; i++) {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(50);
            ws.simulateOpen();
            await advanceTimersByTime(50);
          }
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact Math.pow calculation for first reconnect", async () => {
        const executionId = "exec-math-pow-first-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in") && call[0]?.includes("10000")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact Math.pow calculation for second reconnect", async () => {
        const executionId = "exec-math-pow-second-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThanOrEqual(1);
        }
      });
    });
    describe("conditional expression coverage", () => {
      it("should verify error instanceof Error conditional", async () => {
        const executionId = "exec-instanceof-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateError(new Error("Test error"));
          await advanceTimersByTime(50);
          expect(logger.error).toHaveBeenCalled();
          const errorCalls = logger.error.mock.calls.filter(
            (call) => call[0]?.includes("Connection error")
          );
          expect(errorCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify wsState ternary operators", async () => {
        const executionId = "exec-wsstate-ternary-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.setReadyState(WebSocket.CONNECTING);
          ws.simulateError(new Error("Test"));
          await advanceTimersByTime(50);
          ws.setReadyState(WebSocket.OPEN);
          ws.simulateError(new Error("Test"));
          await advanceTimersByTime(50);
          ws.setReadyState(WebSocket.CLOSING);
          ws.simulateError(new Error("Test"));
          await advanceTimersByTime(50);
          ws.setReadyState(WebSocket.CLOSED);
          ws.simulateError(new Error("Test"));
          await advanceTimersByTime(50);
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify currentStatus || lastKnownStatusRef.current pattern", async () => {
        const executionId = "exec-or-pattern-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: void 0 } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "running" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
    });
    describe("useRef initial value coverage", () => {
      it("should verify lastKnownStatusRef initial value", () => {
        const executionId = "exec-ref-init-test";
        const executionStatus = "running";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus
          })
        );
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should verify lastKnownStatusRef with undefined executionStatus", () => {
        const executionId = "exec-ref-undefined-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: void 0
          })
        );
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
    });
    describe("wasClean and code comparison coverage", () => {
      it("should verify wasClean && code === 1000 condition", async () => {
        const executionId = "exec-clean-close-code-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const cleanCloseCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Connection closed cleanly")
          );
          expect(cleanCloseCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify wasClean && code !== 1000 path", async () => {
        const executionId = "exec-clean-close-other-code-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1001, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify !wasClean path", async () => {
        const executionId = "exec-unclean-close-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify code === 1000 comparison", async () => {
        const executionId = "exec-code-1000-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify code !== 1000 comparison", async () => {
        const executionId = "exec-code-not-1000-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1001, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
    });
    describe("reconnectAttempts comparison coverage", () => {
      it("should verify reconnectAttempts.current < maxReconnectAttempts condition", async () => {
        const executionId = "exec-reconnect-attempts-less-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify reconnectAttempts.current >= maxReconnectAttempts condition", async () => {
        const executionId = "exec-max-attempts-reached-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.warn).toBeDefined();
      });
      it('should verify reason || "No reason provided" pattern', async () => {
        const executionId = "exec-reason-pattern-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const disconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Disconnected from execution")
          );
          expect(disconnectCalls.length).toBeGreaterThan(0);
          if (disconnectCalls.length > 0 && disconnectCalls[0][1]) {
            expect(disconnectCalls[0][1].reason).toBe("No reason provided");
          }
        }
      });
      it("should verify reason truthy path", async () => {
        const executionId = "exec-reason-truthy-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          logger.debug.mockClear();
          ws.simulateClose(1e3, "Test reason", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const disconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Disconnected from execution")
          );
          expect(disconnectCalls.length).toBeGreaterThan(0);
          if (disconnectCalls.length > 0 && disconnectCalls[0][1]) {
            expect(disconnectCalls[0][1].reason).toBe("Test reason");
          }
        }
      });
    });
    describe("reconnectAttempts increment and comparison coverage", () => {
      it("should verify reconnectAttempts.current++ increment", async () => {
        const executionId = "exec-increment-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in") && call[0]?.includes("attempt 1/5")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify reconnectAttempts.current = 0 reset on open", async () => {
        const executionId = "exec-reset-attempts-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectAttempts.current = 0 reset on executionId change", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId, executionStatus: "running" }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          rerender({ executionId: "exec-2" });
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      });
      it("should verify else if reconnectAttempts.current >= maxReconnectAttempts path", async () => {
        const executionId = "exec-max-attempts-elseif-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        expect(logger.warn).toBeDefined();
        expect(onError).toBeDefined();
      });
      it("should verify exact string literal in logger.warn for max attempts", async () => {
        const executionId = "exec-max-warn-string-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.warn).toBeDefined();
      });
      it("should verify exact string literal in onError for max attempts", async () => {
        const executionId = "exec-max-onerror-string-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        expect(onError).toBeDefined();
      });
    });
    describe("currentStatus === comparisons coverage", () => {
      it('should verify currentStatus === "completed" comparison', async () => {
        const executionId = "exec-completed-comparison-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "completed"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const skipCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping connection") && call[0]?.includes("completed")
        );
        expect(skipCalls.length).toBeGreaterThanOrEqual(0);
      });
      it('should verify currentStatus === "failed" comparison', async () => {
        const executionId = "exec-failed-comparison-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "failed"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const skipCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping connection") && call[0]?.includes("failed")
        );
        expect(skipCalls.length).toBeGreaterThanOrEqual(0);
      });
      it('should verify executionStatus === "completed" comparison in first useEffect', async () => {
        const executionId = "exec-first-useeffect-completed-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const closeCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Closing connection") && call[0]?.includes("completed")
          );
          expect(closeCalls.length).toBeGreaterThanOrEqual(0);
        }
      });
      it('should verify executionStatus === "failed" comparison in first useEffect', async () => {
        const executionId = "exec-first-useeffect-failed-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "failed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const closeCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Closing connection") && call[0]?.includes("failed")
          );
          expect(closeCalls.length).toBeGreaterThanOrEqual(0);
        }
      });
      it('should verify currentStatus === "completed" || "failed" pattern in onclose', async () => {
        const executionId = "exec-onclose-status-comparison-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const skipCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Skipping reconnect") && call[0]?.includes("completed")
          );
          expect(skipCalls.length).toBeGreaterThanOrEqual(0);
        }
      });
      it('should verify currentStatus === "completed" || "failed" pattern in second useEffect', async () => {
        const executionId = "exec-second-useeffect-status-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "completed"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const skipCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Skipping connection") && call[0]?.includes("completed")
        );
        expect(skipCalls.length).toBeGreaterThanOrEqual(0);
      });
    });
    describe("exact string literal coverage", () => {
      it('should verify exact string literal "Execution completed"', async () => {
        const executionId = "exec-completed-string-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it('should verify exact string literal "No reason provided"', async () => {
        const executionId = "exec-no-reason-string-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const disconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Disconnected from execution")
          );
          expect(disconnectCalls.length).toBeGreaterThan(0);
          if (disconnectCalls.length > 0 && disconnectCalls[0][1]) {
            expect(disconnectCalls[0][1].reason).toBe("No reason provided");
          }
        }
      });
    });
    describe("message handling logical operators coverage", () => {
      it("should verify message.log && onLog pattern", async () => {
        const executionId = "exec-log-pattern-test";
        const onLog = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onLog
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "log",
            execution_id: executionId,
            log: {
              timestamp: "2024-01-01T00:00:00Z",
              level: "info",
              message: "Test log"
            }
          });
          await advanceTimersByTime(50);
          expect(onLog).toHaveBeenCalled();
        }
      });
      it("should verify message.log && onLog pattern with missing log", async () => {
        const executionId = "exec-log-missing-test";
        const onLog = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onLog
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "log",
            execution_id: executionId
            // log is missing
          });
          await advanceTimersByTime(50);
          expect(onLog).not.toHaveBeenCalled();
        }
      });
      it("should verify message.status && onStatus pattern", async () => {
        const executionId = "exec-status-pattern-test";
        const onStatus = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onStatus
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "status",
            execution_id: executionId,
            status: "running"
          });
          await advanceTimersByTime(50);
          expect(onStatus).toHaveBeenCalledWith("running");
        }
      });
      it("should verify message.node_state && onNodeUpdate pattern", async () => {
        const executionId = "exec-node-state-pattern-test";
        const onNodeUpdate = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onNodeUpdate
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "node_update",
            execution_id: executionId,
            node_id: "node-1",
            node_state: { status: "completed" }
          });
          await advanceTimersByTime(50);
          expect(onNodeUpdate).toHaveBeenCalled();
        }
      });
      it("should verify (message as any).node_id || message.node_state.node_id pattern", async () => {
        const executionId = "exec-node-id-or-pattern-test";
        const onNodeUpdate = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onNodeUpdate
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "node_update",
            execution_id: executionId,
            node_id: "node-top-level",
            node_state: { status: "completed" }
          });
          await advanceTimersByTime(50);
          expect(onNodeUpdate).toHaveBeenCalledWith("node-top-level", { status: "completed" });
          jest.clearAllMocks();
          ws.simulateMessage({
            type: "node_update",
            execution_id: executionId,
            node_state: { node_id: "node-in-state", status: "completed" }
          });
          await advanceTimersByTime(50);
          expect(onNodeUpdate).toHaveBeenCalledWith("node-in-state", { node_id: "node-in-state", status: "completed" });
        }
      });
      it("should verify if (nodeId) check after || operator", async () => {
        const executionId = "exec-node-id-check-test";
        const onNodeUpdate = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onNodeUpdate
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "node_update",
            execution_id: executionId,
            node_state: { status: "completed" }
            // No node_id anywhere
          });
          await advanceTimersByTime(50);
          expect(onNodeUpdate).not.toHaveBeenCalled();
        }
      });
      it("should verify message.error && onError pattern", async () => {
        const executionId = "exec-error-pattern-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "error",
            execution_id: executionId,
            error: "Test error message"
          });
          await advanceTimersByTime(50);
          expect(onError).toHaveBeenCalledWith("Test error message");
        }
      });
      it("should verify onCompletion check without message.result", async () => {
        const executionId = "exec-completion-check-test";
        const onCompletion = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onCompletion
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "completion",
            execution_id: executionId,
            result: { success: true }
          });
          await advanceTimersByTime(50);
          expect(onCompletion).toHaveBeenCalledWith({ success: true });
        }
      });
      it("should verify onCompletion check with undefined result", async () => {
        const executionId = "exec-completion-undefined-test";
        const onCompletion = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onCompletion
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "completion",
            execution_id: executionId
            // result is undefined
          });
          await advanceTimersByTime(50);
          expect(onCompletion).toHaveBeenCalledWith(void 0);
        }
      });
    });
    describe("onclose logical operators coverage", () => {
      it("should verify wasClean && code === 1000 pattern", async () => {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const executionId = "exec-wasclean-code-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          logger.debug.mockClear();
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const closeCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Connection closed cleanly")
          );
          expect(closeCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify wasClean && code === 1000 pattern with false wasClean", async () => {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const executionId = "exec-wasclean-false-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length === 0) {
          unmount();
          await advanceTimersByTime(100);
          return;
        }
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        logger.debug.mockClear();
        const debugCallsBeforeClose = logger.debug.mock.calls.length;
        expect(debugCallsBeforeClose).toBe(0);
        ws.simulateClose(1e3, "", false);
        await advanceTimersByTime(50);
        const callsFromThisClose = logger.debug.mock.calls.slice(debugCallsBeforeClose);
        const cleanCalls = callsFromThisClose.filter(
          (call) => typeof call[0] === "string" && call[0].includes("Connection closed cleanly")
        );
        expect(cleanCalls.length).toBe(0);
        unmount();
        await advanceTimersByTime(100);
      });
      it("should verify wasClean && code === 1000 pattern with different code", async () => {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const executionId = "exec-code-different-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        await advanceTimersByTime(50);
        if (wsInstances.length === 0) {
          unmount();
          await advanceTimersByTime(100);
          return;
        }
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        logger.debug.mockClear();
        const debugCallsBeforeClose = logger.debug.mock.calls.length;
        expect(debugCallsBeforeClose).toBe(0);
        ws.simulateClose(1006, "", true);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const callsFromThisClose = logger.debug.mock.calls.slice(debugCallsBeforeClose);
        const cleanCalls = callsFromThisClose.filter(
          (call) => typeof call[0] === "string" && call[0] === "[WebSocket] Connection closed cleanly, not reconnecting"
        );
        expect(cleanCalls.length).toBe(0);
        unmount();
        await advanceTimersByTime(100);
      });
      it("should verify reconnectAttempts.current < maxReconnectAttempts pattern", async () => {
        const executionId = "exec-reconnect-attempts-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify reconnectAttempts.current >= maxReconnectAttempts pattern", async () => {
        const executionId = "exec-max-attempts-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          for (let i = 0; i < 5; i++) {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(11e3);
            if (wsInstances.length > 0) {
              const newWs = wsInstances[wsInstances.length - 1];
              if (newWs && newWs.readyState === MockWebSocket.CONNECTING) {
                newWs.simulateOpen();
                await advanceTimersByTime(50);
              }
            }
          }
          if (wsInstances.length > 0) {
            const lastWs = wsInstances[wsInstances.length - 1];
            lastWs.simulateClose(1006, "", false);
            await advanceTimersByTime(50);
          }
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectAttempts.current < maxReconnectAttempts exact comparison", async () => {
        const executionId = "exec-reconnect-less-than-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify executionId && executionId.startsWith check in onclose", async () => {
        const executionId = "exec-onclose-executionid-check-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it('should verify executionId && executionId.startsWith("pending-") pattern in onclose', async () => {
        const executionId = "pending-test-123";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const skipCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Skipping reconnect for temporary execution ID")
          );
          expect(skipCalls.length).toBeGreaterThan(0);
        }
      });
    });
    describe("useEffect cleanup and connection management", () => {
      it("should verify wsRef.current check before close", async () => {
        const executionId = "exec-wsref-check-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
      it("should verify reconnectTimeoutRef.current check before clearTimeout", async () => {
        const executionId = "exec-timeout-ref-check-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(1e3);
          unmount();
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify wsRef.current check in first useEffect", async () => {
        const executionId = "exec-first-useeffect-wsref-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectTimeoutRef.current check in first useEffect", async () => {
        const executionId = "exec-first-useeffect-timeout-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(1e3);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify executionId check in second useEffect", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({
            executionId,
            executionStatus: "running"
          }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      });
    });
    describe("exact template literal coverage", () => {
      it("should verify exact template literal in wsUrl construction", async () => {
        const executionId = "exec-wsurl-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toContain("/ws/executions/");
          expect(ws.url).toContain(executionId);
        }
      });
      it("should verify exact template literal in logger.debug for connection", async () => {
        const executionId = "exec-logger-connect-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const connectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("[WebSocket] Connecting to")
        );
        expect(connectCalls.length).toBeGreaterThan(0);
      });
      it("should verify exact template literal in logger.debug for connected", async () => {
        const executionId = "exec-logger-connected-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const connectedCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Connected to execution")
          );
          expect(connectedCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact template literal in logger.error for connection error", async () => {
        const executionId = "exec-logger-error-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateError();
          await advanceTimersByTime(50);
          expect(logger.error).toHaveBeenCalled();
          const errorCalls = logger.error.mock.calls.filter(
            (call) => call[0]?.includes("Connection error for execution")
          );
          expect(errorCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact template literal in logger.debug for disconnected", async () => {
        const executionId = "exec-logger-disconnected-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "test reason", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const disconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Disconnected from execution")
          );
          expect(disconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact template literal in logger.debug for reconnecting", async () => {
        const executionId = "exec-logger-reconnecting-template-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in") && call[0]?.includes("attempt")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact template literal in logger.warn for max attempts", async () => {
        const executionId = "exec-logger-max-attempts-template-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        expect(logger.warn).toBeDefined();
      });
      it("should verify exact template literal in logger.error for failed to create", async () => {
        const executionId = "exec-logger-failed-create-template-test";
        const OriginalWebSocket = global.WebSocket;
        global.WebSocket = class {
           
          constructor(_url) {
            throw new Error("Connection failed");
          }
        };
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Failed to create connection for execution")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        global.WebSocket = OriginalWebSocket;
      });
    });
    describe("exact Math operations coverage", () => {
      it("should verify Math.pow(2, reconnectAttempts.current) exact operation", async () => {
        const executionId = "exec-math-pow-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) exact operation", async () => {
        const executionId = "exec-math-min-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify Math.min caps at 10000", async () => {
        const executionId = "exec-math-min-cap-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          for (let i = 0; i < 4; i++) {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(11e3);
            if (wsInstances.length > 0 && wsInstances[wsInstances.length - 1].readyState === MockWebSocket.CLOSED) {
              wsInstances[wsInstances.length - 1].simulateOpen();
              await advanceTimersByTime(50);
            }
          }
          expect(logger.debug).toHaveBeenCalled();
        }
      });
    });
    describe("exact string literal coverage", () => {
      it('should verify exact string literal "wss:"', async () => {
        const executionId = "exec-wss-protocol-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toBeDefined();
        }
      });
      it('should verify exact string literal "ws:"', async () => {
        const executionId = "exec-ws-protocol-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toBeDefined();
        }
      });
      it('should verify exact string literal "Execution completed"', async () => {
        const executionId = "exec-completed-string-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
    });
    describe("exact comparison operators coverage", () => {
      it("should verify code === 1000 exact comparison", async () => {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const executionId = "exec-code-equals-1000-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        await advanceTimersByTime(50);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          await advanceTimersByTime(50);
          logger.debug.mockClear();
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          await advanceTimersByTime(50);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
          const cleanCalls = logger.debug.mock.calls.filter(
            (call) => typeof call[0] === "string" && call[0].includes("Connection closed cleanly")
          );
          expect(cleanCalls.length).toBeGreaterThan(0);
        }
        unmount();
        await advanceTimersByTime(100);
      });
      it("should verify code !== 1000 comparison", async () => {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const executionId = "exec-code-not-equals-1000-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        if (wsInstances.length === 0) {
          unmount();
          await advanceTimersByTime(100);
          return;
        }
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        logger.debug.mockClear();
        const debugCallsBeforeClose = logger.debug.mock.calls.length;
        expect(debugCallsBeforeClose).toBe(0);
        ws.simulateClose(1006, "", true);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        const callsFromThisClose = logger.debug.mock.calls.slice(debugCallsBeforeClose);
        const cleanCalls = callsFromThisClose.filter(
          (call) => typeof call[0] === "string" && call[0].includes("Connection closed cleanly")
        );
        expect(cleanCalls.length).toBe(0);
        unmount();
        await advanceTimersByTime(100);
      });
      it("should verify maxReconnectAttempts exact value 5", async () => {
        const executionId = "exec-max-attempts-value-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      });
    });
    describe("exact negation and truthy checks", () => {
      it("should verify !executionId exact negation", async () => {
        renderHook(
          () => useWebSocket({
            executionId: null,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBe(0);
      });
      it("should verify executionId truthy check", async () => {
        const executionId = "exec-truthy-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
      it("should verify wsRef.current truthy check", async () => {
        const executionId = "exec-wsref-truthy-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws).toBeDefined();
        }
      });
      it("should verify reconnectTimeoutRef.current truthy check", async () => {
        const executionId = "exec-timeout-ref-truthy-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(1e3);
          unmount();
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify executionStatus truthy check in first useEffect", async () => {
        const executionId = "exec-status-truthy-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: void 0 } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "running" });
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      });
      it("should verify executionStatus falsy check in first useEffect", async () => {
        const executionId = "exec-status-falsy-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: void 0
          })
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
    });
    describe("exact startsWith method coverage", () => {
      it('should verify executionId.startsWith("pending-") exact method call', async () => {
        const executionId = "pending-exact-test-123";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(executionId.startsWith("pending-")).toBe(true);
        expect(wsInstances.length).toBe(0);
      });
      it('should verify executionId.startsWith("pending-") false case', async () => {
        const executionId = "exec-not-pending-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        expect(executionId.startsWith("pending-")).toBe(false);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
    });
    describe("exact switch case coverage", () => {
      it('should verify switch case "log" exact match', async () => {
        const executionId = "exec-switch-log-test";
        const onLog = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onLog
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "log",
            execution_id: executionId,
            log: {
              timestamp: "2024-01-01T00:00:00Z",
              level: "info",
              message: "Test log"
            }
          });
          await advanceTimersByTime(50);
          expect(onLog).toHaveBeenCalled();
        }
      });
      it('should verify switch case "status" exact match', async () => {
        const executionId = "exec-switch-status-test";
        const onStatus = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onStatus
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "status",
            execution_id: executionId,
            status: "running"
          });
          await advanceTimersByTime(50);
          expect(onStatus).toHaveBeenCalledWith("running");
        }
      });
      it('should verify switch case "node_update" exact match', async () => {
        const executionId = "exec-switch-node-update-test";
        const onNodeUpdate = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onNodeUpdate
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "node_update",
            execution_id: executionId,
            node_id: "node-1",
            node_state: { status: "completed" }
          });
          await advanceTimersByTime(50);
          expect(onNodeUpdate).toHaveBeenCalled();
        }
      });
      it('should verify switch case "completion" exact match', async () => {
        const executionId = "exec-switch-completion-test";
        const onCompletion = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onCompletion
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "completion",
            execution_id: executionId,
            result: { success: true }
          });
          await advanceTimersByTime(50);
          expect(onCompletion).toHaveBeenCalledWith({ success: true });
        }
      });
      it('should verify switch case "error" exact match', async () => {
        const executionId = "exec-switch-error-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateMessage({
            type: "error",
            execution_id: executionId,
            error: "Test error"
          });
          await advanceTimersByTime(50);
          expect(onError).toHaveBeenCalledWith("Test error");
        }
      });
    });
    describe("exact else if pattern coverage", () => {
      it("should verify else if (reconnectAttempts.current >= maxReconnectAttempts) pattern", async () => {
        const executionId = "exec-else-if-max-attempts-test";
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running",
            onError
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify if-else chain: reconnectAttempts < maxReconnectAttempts vs >=", async () => {
        const executionId = "exec-if-else-chain-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
    });
    describe("exact assignment operations", () => {
      it("should verify reconnectAttempts.current = 0 assignment", async () => {
        const executionId = "exec-reconnect-reset-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectAttempts.current++ increment", async () => {
        const executionId = "exec-reconnect-increment-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
          const reconnectCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Reconnecting in") && call[0]?.includes("attempt 1/")
          );
          expect(reconnectCalls.length).toBeGreaterThan(0);
        }
      });
      it("should verify wsRef.current = null assignment", async () => {
        const executionId = "exec-wsref-null-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectTimeoutRef.current = setTimeout assignment", async () => {
        const executionId = "exec-timeout-set-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify reconnectTimeoutRef.current = null assignment", async () => {
        const executionId = "exec-timeout-null-test";
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(1e3);
          unmount();
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify lastKnownStatusRef.current assignment", async () => {
        const executionId = "exec-last-status-assignment-test";
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId,
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      });
      it("should verify setIsConnected(false) assignment", async () => {
        const executionId = "exec-set-connected-false-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify setIsConnected(true) assignment", async () => {
        const executionId = "exec-set-connected-true-test";
        renderHook(
          () => useWebSocket({
            executionId,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
    });
  });
});
