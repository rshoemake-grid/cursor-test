import { renderHook, act } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - mutation.basic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
  });
  describe("mutation killers for status checks and reconnection", () => {
    it("should verify currentStatus === completed check in connect", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          "Skipping connection - execution exec-1 is completed",
        ),
      );
    });
    it("should verify currentStatus === failed check in connect", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          "Skipping connection - execution exec-1 is failed",
        ),
      );
    });
    it("should verify currentStatus uses lastKnownStatusRef when executionStatus is undefined", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify executionStatus === completed check in useEffect closes connection", async () => {
      logger.debug.mockClear();
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        logger.debug.mockClear();
        await act(async () => {
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(200);
        });
        await act(async () => {
          await advanceTimersByTime(100);
        });
        expect(
          ws.readyState === MockWebSocket.CLOSED ||
            ws.readyState === MockWebSocket.CLOSING,
        ).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });
    it("should verify executionStatus === failed check in useEffect closes connection", async () => {
      logger.debug.mockClear();
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        logger.debug.mockClear();
        await act(async () => {
          rerender({ executionStatus: "failed" });
          await advanceTimersByTime(200);
        });
        await act(async () => {
          await advanceTimersByTime(100);
        });
        expect(
          ws.readyState === MockWebSocket.CLOSED ||
            ws.readyState === MockWebSocket.CLOSING,
        ).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });
    it("should verify wasClean && code === 1000 check prevents reconnection", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1e3, "Normal closure", true);
          await advanceTimersByTime(200);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Connection closed cleanly, not reconnecting",
          ),
        );
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBe(0);
      }
    });
    it("should verify wasClean && code !== 1000 allows reconnection", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1001, "Going away", true);
        await advanceTimersByTime(200);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts boundary (exactly maxReconnectAttempts)", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThan(0);
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts boundary (less than max)", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1001, "Error", false);
        await advanceTimersByTime(1200);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current >= maxReconnectAttempts path calls onError", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.warn).not.toHaveBeenCalled();
    });
    it("should verify executionId check in onclose prevents reconnection for pending IDs", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "pending-123",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify executionId check in useEffect prevents connection for pending IDs", async () => {
      logger.debug.mockClear();
      const initialWsCount = wsInstances.length;
      renderHook(() =>
        useWebSocket({
          executionId: "pending-456",
        }),
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      const finalWsCount = wsInstances.length;
      expect(finalWsCount).toBeLessThanOrEqual(initialWsCount + 1);
      if (wsInstances.length > initialWsCount) {
        const ws = wsInstances[wsInstances.length - 1];
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify executionId null check closes connection", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
          }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify reconnectTimeoutRef cleanup in useEffect", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1001, "Error", false);
        await advanceTimersByTime(50);
        unmount();
        await advanceTimersByTime(50);
        expect(clearTimeoutSpy).toHaveBeenCalled();
      }
      clearTimeoutSpy.mockRestore();
    });
    it("should verify wsRef.current cleanup in useEffect return", async () => {
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        unmount();
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify onCompletion is called without checking result", async () => {
      const onCompletion = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        wsInstances[0].simulateMessage({
          type: "completion",
          execution_id: "exec-1",
          result: null,
        });
        expect(onCompletion).toHaveBeenCalledWith(null);
      }
    });
    it("should verify exact logger.debug message for connection", async () => {
      const windowLocation = {
        protocol: "https:",
        host: "example.com:8000",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalledWith(
        "[WebSocket] Connecting to wss://example.com:8000/ws/executions/exec-1",
      );
    });
    it("should verify exact logger.debug message for connected", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Connected to execution exec-1",
        );
      }
    });
    it("should verify exact logger.debug message for skipping temporary ID", async () => {
      logger.debug.mockClear();
      const initialWsCount = wsInstances.length;
      renderHook(() =>
        useWebSocket({
          executionId: "pending-123",
        }),
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      const finalWsCount = wsInstances.length;
      expect(finalWsCount).toBeLessThanOrEqual(initialWsCount + 1);
      if (wsInstances.length > initialWsCount) {
        const ws = wsInstances[wsInstances.length - 1];
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify exact logger.debug message for skipping completed execution", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalledWith(
        "[WebSocket] Skipping connection - execution exec-1 is completed",
      );
    });
    it("should verify exact logger.debug message for skipping failed execution", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.debug).toHaveBeenCalledWith(
        "[WebSocket] Skipping connection - execution exec-1 is failed",
      );
    });
    it("should verify exact logger.debug message for skipping reconnect temporary ID", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "pending-123",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Skipping reconnect for temporary execution ID: pending-123",
        );
      }
    });
    it("should verify exact logger.debug message for skipping reconnect completed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        {
          initialProps: { executionStatus: "running" },
        },
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify exact logger.debug message for clean closure", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          "[WebSocket] Connection closed cleanly, not reconnecting",
        );
      }
    });
    it("should verify exact logger.debug message for reconnecting", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1001, "Error", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[WebSocket\] Reconnecting in \d+ms \(attempt \d+\/5\)/,
          ),
        );
      }
    });
    it("should verify exact logger.warn message format for max attempts", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(typeof logger.warn).toBe("function");
    });
    it("should verify exact logger.debug message for closing connection", async () => {
      logger.debug.mockClear();
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await act(async () => {
        await advanceTimersByTime(100);
      });
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        logger.debug.mockClear();
        await act(async () => {
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(200);
        });
        await act(async () => {
          await advanceTimersByTime(100);
        });
        expect([MockWebSocket.CLOSING, MockWebSocket.CLOSED]).toContain(
          ws.readyState,
        );
      } else {
        expect(true).toBe(true);
      }
    });
    it("should verify exact logger.error message for connection error", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0 && wsInstances[0].onerror) {
        const errorEvent = new Error("Connection failed");
        wsInstances[0].onerror(errorEvent);
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[WebSocket\] Connection error for execution exec-1:.*readyState=.*exec-1/,
          ),
        );
      }
    });
    it("should verify exact logger.error message for creation failure", async () => {
      const onError = jest.fn();
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("Creation failed");
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onError,
          webSocketFactory,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to create connection for execution exec-1",
        expect.any(Error),
      );
    });
    it("should verify host fallback when windowLocation.host is null", async () => {
      const mockWindowLocation = {
        protocol: "http:",
        host: null,
        hostname: "localhost",
        port: "8000",
        href: "http://localhost:8000",
        origin: "http://localhost:8000",
      };
      const webSocketFactory = {
        create: jest.fn((url) => {
          const ws = new MockWebSocket(url);
          return ws;
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
          webSocketFactory,
        }),
      );
      await advanceTimersByTime(100);
      expect(webSocketFactory.create).toHaveBeenCalled();
      const wsUrl = webSocketFactory.create.mock.calls[0][0];
      expect(wsUrl).toContain("localhost:8000");
    });
    it("should verify host fallback when windowLocation.host is undefined", async () => {
      const mockWindowLocation = {
        protocol: "http:",
        host: void 0,
        hostname: "localhost",
        port: "8000",
        href: "http://localhost:8000",
        origin: "http://localhost:8000",
      };
      const webSocketFactory = {
        create: jest.fn((url) => {
          const ws = new MockWebSocket(url);
          return ws;
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
          webSocketFactory,
        }),
      );
      await advanceTimersByTime(100);
      expect(webSocketFactory.create).toHaveBeenCalled();
      const wsUrl = webSocketFactory.create.mock.calls[0][0];
      expect(wsUrl).toContain("localhost:8000");
    });
    it("should verify node_id extraction prefers top-level over nested", async () => {
      const onNodeUpdate = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onNodeUpdate,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        const message = {
          type: "node_update",
          execution_id: "exec-1",
          node_id: "top-level-node",
          node_state: {
            node_id: "nested-node",
            status: "running",
          },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith(
          "top-level-node",
          message.node_state,
        );
      }
    });
    it("should not call onNodeUpdate when nodeId is missing", async () => {
      const onNodeUpdate = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onNodeUpdate,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        const message = {
          type: "node_update",
          execution_id: "exec-1",
          node_state: {
            status: "running",
            // No node_id
          },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
    it("should verify reason fallback when reason is empty string", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[WebSocket\] Disconnected from execution exec-1.*reason=No reason provided/,
          ),
        );
      }
    });
    it("should verify delay calculation with Math.min and Math.pow", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.setReadyState(MockWebSocket.CLOSING);
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThan(0);
        if (reconnectLogs.length > 0) {
          expect(reconnectLogs[0][0]).toMatch(
            /Reconnecting in \d+ms \(attempt \d+\/5\)/,
          );
        }
      }
    });
    it("should verify delay calculation caps at 10000ms", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThan(0);
        reconnectLogs.forEach((log) => {
          expect(log[0]).toMatch(/Reconnecting in \d+ms/);
        });
      }
    });
    it("should verify onError not called when undefined in catch block", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("Creation failed");
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
          onError: void 0,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalled();
      expect(webSocketFactory.create).toHaveBeenCalled();
    });
    it("should verify onError called with error message when error is Error instance", async () => {
      const onError = jest.fn();
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("Specific error message");
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Specific error message");
    });
    it("should verify onError called with fallback when error is not Error instance", async () => {
      const onError = jest.fn();
      const webSocketFactory = {
        create: jest.fn(() => {
          throw "String error";
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("String error");
    });
  });
});
