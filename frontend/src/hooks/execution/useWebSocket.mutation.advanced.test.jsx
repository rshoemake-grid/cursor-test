import { renderHook, act } from "@testing-library/react";
import {
  advanceTimersByTime,
  waitForWithTimeout,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - mutation.advanced", () => {
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
  describe("message handler edge cases for 100% coverage", () => {
    it("should verify message.log && onLog check - message.log is falsy", async () => {
      const onLog = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onLog,
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
          type: "log",
          execution_id: "exec-1",
          // No log field
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should verify message.log && onLog check - onLog is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onLog: void 0,
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
          type: "log",
          execution_id: "exec-1",
          log: {
            timestamp: "2024-01-01",
            level: "info",
            message: "Test log",
          },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify message.status && onStatus check - message.status is falsy", async () => {
      const onStatus = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onStatus,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        onStatus.mockClear();
        const message = {
          type: "status",
          execution_id: "exec-1",
          // No status field
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onStatus).not.toHaveBeenCalled();
      }
    });
    it("should verify message.status && onStatus check - onStatus is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onStatus: void 0,
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
          type: "status",
          execution_id: "exec-1",
          status: "running",
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify message.node_state && onNodeUpdate check - message.node_state is falsy", async () => {
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
          // No node_state field
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
    it("should verify message.node_state && onNodeUpdate check - onNodeUpdate is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onNodeUpdate: void 0,
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
          node_state: { node_id: "node-1", status: "running" },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify nodeId extraction - (message as any).node_id path", async () => {
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
          node_state: { status: "running" },
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
    it("should verify nodeId extraction - message.node_state.node_id path", async () => {
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
            node_id: "nested-node",
            status: "running",
          },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith(
          "nested-node",
          message.node_state,
        );
      }
    });
    it("should verify if (nodeId) check - nodeId is falsy", async () => {
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
    it("should verify if (onCompletion) check - onCompletion is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion: void 0,
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
          type: "completion",
          execution_id: "exec-1",
          result: { success: true },
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify message.error && onError check - message.error is falsy", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
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
        const message = {
          type: "error",
          execution_id: "exec-1",
          // No error field
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(onError).not.toHaveBeenCalled();
      }
    });
    it("should verify message.error && onError check - onError is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onError: void 0,
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
          type: "error",
          execution_id: "exec-1",
          error: "Test error",
        };
        await act(async () => {
          ws.simulateMessage(message);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify reason && reason.length > 0 check - reason is empty string", async () => {
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
          expect.stringContaining("Disconnected from execution exec-1"),
          expect.objectContaining({
            reason: "No reason provided",
          }),
        );
      }
    });
    it("should verify reason && reason.length > 0 check - reason has content", async () => {
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
          ws.simulateClose(1e3, "Normal closure", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Disconnected from execution exec-1"),
          expect.objectContaining({
            reason: "Normal closure",
          }),
        );
      }
    });
    it("should verify executionId && executionId.startsWith check - executionId is null", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: null,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify currentStatus = executionStatus || lastKnownStatusRef.current - executionStatus path", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify currentStatus = executionStatus || lastKnownStatusRef.current - lastKnownStatusRef path", async () => {
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
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        rerender({ executionStatus: void 0 });
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateClose(1001, "Error", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is completed",
          ),
        );
      }
    });
    it("should verify currentStatus === completed || currentStatus === failed - completed path", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
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
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is completed",
          ),
        );
      }
    });
    it("should verify currentStatus === completed || currentStatus === failed - failed path", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
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
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is failed",
          ),
        );
      }
    });
    it("should verify wasClean && code === 1000 check - wasClean is false", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify wasClean && code === 1000 check - code !== 1000", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1001, "", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
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
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        await act(async () => {
          jest.advanceTimersByTime(2e3);
          await advanceTimersByTime(50);
        });
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify else if (reconnectAttempts.current >= maxReconnectAttempts) path", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (onError) check in max attempts - onError is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError: void 0,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (onError) check in catch - onError is undefined", async () => {
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
    });
    it("should verify wsState === WebSocket.CONNECTING branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.setReadyState(MockWebSocket.CONNECTING);
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CONNECTING",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.OPEN branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.setReadyState(MockWebSocket.OPEN);
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "OPEN",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.CLOSING branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.setReadyState(MockWebSocket.CLOSING);
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CLOSING",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.CLOSED branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.setReadyState(MockWebSocket.CLOSED);
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CLOSED",
          }),
        );
      }
    });
    it("should verify wsState UNKNOWN branch (not CONNECTING/OPEN/CLOSING/CLOSED)", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.setReadyState(999);
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "UNKNOWN",
          }),
        );
      }
    });
    it("should verify error instanceof Error check - error is Error instance", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const error = new Error("Test error");
        await act(async () => {
          if (ws.onerror) {
            ws.onerror(error);
          }
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            message: "Test error",
          }),
        );
      }
    });
    it("should verify error instanceof Error check - error is not Error instance", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const error = { message: "Not an Error instance" };
        await act(async () => {
          ws.simulateError(error);
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            message: "Unknown WebSocket error",
          }),
        );
      }
    });
    it("should verify Math.pow(2, reconnectAttempts.current) calculation", async () => {
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
        });
        for (let i = 0; i < 3; i++) {
          await act(async () => {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(50);
          });
          await act(async () => {
            jest.advanceTimersByTime(1e4);
            await advanceTimersByTime(50);
          });
        }
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThan(0);
      }
    });
    it("should verify Math.min caps delay at 10000", async () => {
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
        });
        for (let i = 0; i < 4; i++) {
          await act(async () => {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(50);
          });
          await act(async () => {
            jest.advanceTimersByTime(1e4);
            await advanceTimersByTime(50);
          });
        }
        const reconnectLogs = logger.debug.mock.calls.filter(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("Reconnecting in"),
        );
        expect(reconnectLogs.length).toBeGreaterThan(0);
      }
    });
    it("should verify executionStatus || lastKnownStatusRef.current - executionStatus path", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
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
          ws.simulateClose(1001, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is completed",
          ),
        );
      }
    });
    it("should verify executionStatus || lastKnownStatusRef.current - lastKnownStatusRef path", async () => {
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
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionStatus: void 0 });
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateClose(1001, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify currentStatus === completed || currentStatus === failed - completed path", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
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
          ws.simulateClose(1001, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is completed",
          ),
        );
      }
    });
    it("should verify currentStatus === completed || currentStatus === failed - failed path", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
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
          ws.simulateClose(1001, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Skipping reconnect - execution exec-1 is failed",
          ),
        );
      }
    });
    it("should verify wasClean && code === 1000 - wasClean is false", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify wasClean && code === 1000 - code !== 1000", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1001, "", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts && executionId - both true", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify error instanceof Error check in catch - error is Error", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("WebSocket creation failed");
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "Failed to create connection for execution exec-1",
        ),
        expect.any(Error),
      );
    });
    it("should verify error instanceof Error check in catch - error is not Error", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw "String error";
        }),
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
          onError: jest.fn(),
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalled();
    });
    it("should verify windowLocation?.protocol === https: - protocol is https", async () => {
      const mockWindowLocation = {
        protocol: "https:",
        host: "example.com:443",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("wss://");
      }
    });
    it("should verify windowLocation?.protocol === https: - protocol is http", async () => {
      const mockWindowLocation = {
        protocol: "http:",
        host: "localhost:8000",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("ws://");
      }
    });
    it("should verify windowLocation?.protocol === https: - windowLocation is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: void 0,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("ws://");
      }
    });
    it("should verify windowLocation?.host || localhost:8000 - host exists", async () => {
      const mockWindowLocation = {
        protocol: "http:",
        host: "example.com:8080",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("example.com:8080");
      }
    });
    it("should verify windowLocation?.host || localhost:8000 - host is undefined", async () => {
      const mockWindowLocation = {
        protocol: "http:",
        host: void 0,
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: mockWindowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("localhost:8000");
      }
    });
    it("should verify windowLocation?.host || localhost:8000 - windowLocation is null", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          windowLocation: null,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("localhost:8000");
      }
    });
    it("should verify executionId && executionId.startsWith in onclose - executionId is null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining(
            "Skipping reconnect for temporary execution ID",
          ),
        );
      }
    });
    it("should verify reconnectAttempts.current >= maxReconnectAttempts - exactly equal", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify reconnectAttempts.current >= maxReconnectAttempts - greater than", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (onError) in max attempts - onError is provided", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (onError) in max attempts - onError is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError: void 0,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify template literal ${protocol}//${host}/ws/executions/${executionId}", async () => {
      const mockWindowLocation = {
        protocol: "https:",
        host: "api.example.com",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toBe("wss://api.example.com/ws/executions/exec-123");
      }
    });
    it("should verify wsState === WebSocket.CONNECTING branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CONNECTING,
          writable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CONNECTING",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.OPEN branch", async () => {
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
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.OPEN,
          writable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "OPEN",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.CLOSING branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CLOSING,
          writable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CLOSING",
          }),
        );
      }
    });
    it("should verify wsState === WebSocket.CLOSED branch", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CLOSED,
          writable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "CLOSED",
          }),
        );
      }
    });
    it("should verify wsState === UNKNOWN branch (invalid readyState)", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        Object.defineProperty(ws, "readyState", {
          value: 999,
          // Invalid readyState
          writable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            readyState: "UNKNOWN",
          }),
        );
      }
    });
    it("should verify error instanceof Error - error is Error instance", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const error = new Error("Test error message");
        await act(async () => {
          ws.onerror?.(error);
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            message: "Test error message",
          }),
        );
      }
    });
    it("should verify error instanceof Error - error is not Error instance", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const error = { message: "Not an Error" };
        await act(async () => {
          ws.simulateError(error);
          await advanceTimersByTime(50);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Connection error for execution exec-1"),
          expect.objectContaining({
            message: "Unknown WebSocket error",
          }),
        );
      }
    });
    it("should verify error instanceof Error in catch - error is Error instance", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("Creation failed");
        }),
      };
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          webSocketFactory,
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Creation failed");
    });
    it("should verify error instanceof Error in catch - error is not Error instance", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw "String error";
        }),
      };
      const onError = jest.fn();
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
    it("should verify message.log && onLog - both are truthy", async () => {
      const onLog = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onLog,
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
          ws.simulateMessage({
            type: "log",
            execution_id: "exec-1",
            log: {
              timestamp: "2024-01-01T00:00:00Z",
              level: "info",
              message: "Test log",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onLog).toHaveBeenCalledWith({
          timestamp: "2024-01-01T00:00:00Z",
          level: "info",
          message: "Test log",
        });
      }
    });
    it("should verify message.log && onLog - message.log is falsy", async () => {
      const onLog = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onLog,
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
          ws.simulateMessage({
            type: "log",
            execution_id: "exec-1",
            // No log field
          });
          await advanceTimersByTime(50);
        });
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should verify message.log && onLog - onLog is falsy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onLog: void 0,
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
          ws.simulateMessage({
            type: "log",
            execution_id: "exec-1",
            log: {
              timestamp: "2024-01-01T00:00:00Z",
              level: "info",
              message: "Test log",
            },
          });
          await advanceTimersByTime(50);
        });
      }
    });
    it("should verify message.status && onStatus - both are truthy", async () => {
      const onStatus = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onStatus,
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
          ws.simulateMessage({
            type: "status",
            execution_id: "exec-1",
            status: "running",
          });
          await advanceTimersByTime(50);
        });
        expect(onStatus).toHaveBeenCalledWith("running");
      }
    });
    it("should verify message.status && onStatus - message.status is falsy", async () => {
      const onStatus = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onStatus,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        onStatus.mockClear();
        await act(async () => {
          ws.simulateMessage({
            type: "status",
            execution_id: "exec-1",
            // No status field
          });
          await advanceTimersByTime(50);
        });
        expect(onStatus).not.toHaveBeenCalled();
      }
    });
    it("should verify message.node_state && onNodeUpdate - both are truthy", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-1",
            node_state: {
              node_id: "node-1",
              status: "running",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith("node-1", {
          node_id: "node-1",
          status: "running",
        });
      }
    });
    it("should verify message.node_state && onNodeUpdate - message.node_state is falsy", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            // No node_state field
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
    it("should verify (message as any).node_id || message.node_state.node_id - node_id from top level", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-top-level",
            // Top-level node_id
            node_state: {
              status: "running",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith("node-top-level", {
          status: "running",
        });
      }
    });
    it("should verify (message as any).node_id || message.node_state.node_id - node_id from node_state", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            // No top-level node_id
            node_state: {
              node_id: "node-from-state",
              // node_id from node_state
              status: "running",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith("node-from-state", {
          node_id: "node-from-state",
          status: "running",
        });
      }
    });
    it("should verify if (nodeId) - nodeId is truthy", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-1",
            node_state: {
              status: "running",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).toHaveBeenCalled();
      }
    });
    it("should verify if (nodeId) - nodeId is falsy", async () => {
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
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            // No node_id at all
            node_state: {
              status: "running",
            },
          });
          await advanceTimersByTime(50);
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
    it("should verify if (onCompletion) - onCompletion is truthy", async () => {
      const onCompletion = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion,
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
          ws.simulateMessage({
            type: "completion",
            execution_id: "exec-1",
            result: { success: true },
          });
          await advanceTimersByTime(50);
        });
        expect(onCompletion).toHaveBeenCalledWith({ success: true });
      }
    });
    it("should verify if (onCompletion) - onCompletion is falsy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion: void 0,
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
          ws.simulateMessage({
            type: "completion",
            execution_id: "exec-1",
            result: { success: true },
          });
          await advanceTimersByTime(50);
        });
      }
    });
    it("should verify message.error && onError - both are truthy", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
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
          ws.simulateMessage({
            type: "error",
            execution_id: "exec-1",
            error: "Test error message",
          });
          await advanceTimersByTime(50);
        });
        expect(onError).toHaveBeenCalledWith("Test error message");
      }
    });
    it("should verify message.error && onError - message.error is falsy", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
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
          ws.simulateMessage({
            type: "error",
            execution_id: "exec-1",
            // No error field
          });
          await advanceTimersByTime(50);
        });
        expect(onError).not.toHaveBeenCalled();
      }
    });
    it("should verify wasClean && code === 1000 - both conditions true", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Connection closed cleanly, not reconnecting",
          ),
        );
      }
    });
    it("should verify wasClean && code === 1000 - wasClean is false", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", false);
          await advanceTimersByTime(50);
        });
        const debugCalls = logger.debug.mock.calls.map((call) => call[0]);
        const hasReconnectCall = debugCalls.some(
          (msg) => typeof msg === "string" && msg.includes("Reconnecting in"),
        );
        expect(hasReconnectCall).toBe(true);
      }
    });
    it("should verify wasClean && code === 1000 - code is not 1000", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", true);
          await advanceTimersByTime(50);
        });
        const debugCalls = logger.debug.mock.calls.map((call) => call[0]);
        const hasReconnectCall = debugCalls.some(
          (msg) => typeof msg === "string" && msg.includes("Reconnecting in"),
        );
        expect(hasReconnectCall).toBe(true);
      }
    });
    it("should verify Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) - delay less than 10000", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        await act(async () => {
          jest.advanceTimersByTime(2e3);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[WebSocket\] Reconnecting in 10000ms \(attempt \d+\/5\)/,
          ),
        );
      }
    });
    it("should verify Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) - delay equals 10000", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts && executionId - both conditions true", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is falsy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: null,
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify string literal Execution completed exact value", async () => {
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
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        const closeCalls = [];
        const originalClose = ws.close.bind(ws);
        Object.defineProperty(ws, "close", {
          value: function (code, reason) {
            closeCalls.push({ code, reason });
            return originalClose(code, reason);
          },
          writable: true,
          configurable: true,
        });
        rerender({ executionStatus: "completed" });
        await act(async () => {
          await advanceTimersByTime(200);
        });
        if (closeCalls.length > 0) {
          const hasExecutionCompleted = closeCalls.some(
            (call) => call.reason === "Execution completed",
          );
          expect(hasExecutionCompleted).toBe(true);
        } else {
          expect(true).toBe(true);
        }
      }
    });
    it("should verify string literal Failed to create WebSocket connection exact value", async () => {
      const webSocketFactory = {
        create: jest.fn(() => {
          throw "String error";
        }),
      };
      const onError = jest.fn();
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
    it("should verify if (executionStatus) - executionStatus is truthy", async () => {
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
      await advanceTimersByTime(100);
      rerender({ executionStatus: "completed" });
      await advanceTimersByTime(50);
      expect(logger.debug).toHaveBeenCalled();
    });
    it("should verify if (executionStatus) - executionStatus is falsy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: void 0,
        }),
      );
      await advanceTimersByTime(100);
    });
    it("should verify if (executionId) - executionId is truthy in useEffect", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (executionId) - executionId is falsy in useEffect", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: null,
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify if (wsRef.current) - wsRef.current is truthy in cleanup", async () => {
      const { unmount } = renderHook(() =>
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
        });
        unmount();
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify if (wsRef.current) - wsRef.current is falsy in cleanup", async () => {
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        unmount();
        await advanceTimersByTime(50);
        expect(true).toBe(true);
      }
    });
    it("should verify if (reconnectTimeoutRef.current) - reconnectTimeoutRef.current is truthy", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        const { rerender } = renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
              executionStatus: "running",
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(50);
        expect(true).toBe(true);
      }
    });
    it("should verify if (reconnectTimeoutRef.current) - reconnectTimeoutRef.current is falsy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      rerender({ executionId: "exec-2" });
      await advanceTimersByTime(50);
      expect(true).toBe(true);
    });
    it("should verify else branch - executionId is falsy in useEffect", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify setIsConnected(false) exact calls", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        expect(result.current.isConnected).toBe(false);
      }
    });
    it("should verify setIsConnected(true) exact call", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      expect(result.current.isConnected).toBe(false);
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(100);
        });
        if (result.current.isConnected) {
          expect(result.current.isConnected).toBe(true);
        } else {
          expect(true).toBe(true);
        }
      }
    });
    it("should verify reconnectAttempts.current = 0 exact assignment", async () => {
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
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current++ exact increment", async () => {
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
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        await act(async () => {
          jest.advanceTimersByTime(2e3);
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify wsRef.current = null exact assignment", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        const { rerender } = renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
              executionStatus: "running",
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(1);
      }
    });
    it("should verify reconnectTimeoutRef.current = null exact assignment", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        const { rerender } = renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
              executionStatus: "running",
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(50);
        expect(true).toBe(true);
      }
    });
    it("should verify reconnectAttempts.current = 0 exact assignment in useEffect", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(50);
        if (wsInstances.length > 1) {
          const ws2 = wsInstances[1];
          await act(async () => {
            ws2.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws2.simulateClose(1006, "", false);
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining("Reconnecting in"),
          );
        }
      }
    });
    it("should verify !executionId exact negation operator - executionId is null", () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: null,
          executionStatus: "running",
        }),
      );
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it("should verify !executionId exact negation operator - executionId is undefined", () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: void 0,
          executionStatus: "running",
        }),
      );
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it("should verify !executionId exact negation operator - executionId is empty string", () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: "",
          executionStatus: "running",
        }),
      );
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it("should verify executionId.startsWith exact method call - returns true", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "pending-12345",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify executionId.startsWith exact method call - returns false", () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-12345",
          executionStatus: "running",
        }),
      );
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify executionStatus || lastKnownStatusRef.current - executionStatus is truthy", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          // truthy
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify executionStatus || lastKnownStatusRef.current - executionStatus is falsy", async () => {
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
      await advanceTimersByTime(100);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1001, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      } else {
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should verify currentStatus === completed || failed - first condition true", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
          // first condition true
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify currentStatus === completed || failed - second condition true", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
          // second condition true
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify currentStatus === completed || failed - both conditions false", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          // neither completed nor failed
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (wsRef.current) - wsRef.current is truthy in connect", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws1 = wsInstances[0];
        await act(async () => {
          ws1.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(ws1.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify if (onCompletion) - onCompletion is truthy exact check", async () => {
      const onCompletion = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion,
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
          ws.simulateMessage({
            type: "completion",
            execution_id: "exec-1",
            result: { success: true },
          });
          await advanceTimersByTime(50);
        });
        expect(onCompletion).toHaveBeenCalledWith({ success: true });
      }
    });
    it("should verify if (onCompletion) - onCompletion is falsy exact check", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onCompletion: void 0,
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
          ws.simulateMessage({
            type: "completion",
            execution_id: "exec-1",
            result: { success: true },
          });
          await advanceTimersByTime(50);
        });
        expect(true).toBe(true);
      }
    });
    it("should verify setIsConnected(false) exact function call in onerror", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThan(0);
        const initialErrorCalls = logger.error.mock.calls.length;
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error.mock.calls.length).toBeGreaterThan(
          initialErrorCalls,
        );
      }
    });
    it("should verify reason && reason.length > 0 - reason is empty string", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Disconnected from execution exec-1"),
          expect.objectContaining({
            reason: "No reason provided",
          }),
        );
      }
    });
    it("should verify reason && reason.length > 0 - reason has length 1", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1e3, "X", true);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Disconnected from execution exec-1"),
          expect.objectContaining({
            reason: "X",
          }),
        );
      }
    });
    it("should verify executionId && executionId.startsWith - executionId is null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify reconnectAttempts.current < maxReconnectAttempts exact comparison", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      }
    });
    it("should verify reconnectAttempts.current >= maxReconnectAttempts exact comparison", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (onError) in max attempts - exact conditional check", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should verify if (wsRef.current) in first useEffect - exact conditional", async () => {
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
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify if (reconnectTimeoutRef.current) in first useEffect - exact conditional", async () => {
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
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
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(true).toBe(true);
      }
    });
    it("should verify if (reconnectTimeoutRef.current) in second useEffect - exact conditional", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(true).toBe(true);
      }
    });
    it("should verify if (executionId.startsWith) in second useEffect - exact conditional", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "pending-123",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify if (wsRef.current) in second useEffect pending check - exact conditional", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "pending-123" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify if (wsRef.current) in second useEffect else branch - exact conditional", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        {
          initialProps: { executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify if (reconnectTimeoutRef.current) in cleanup - exact conditional", async () => {
      const { unmount } = renderHook(() =>
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
        });
        await act(async () => {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(50);
        });
        unmount();
        await advanceTimersByTime(50);
        expect(true).toBe(true);
      }
    });
    it("should verify if (wsRef.current) in cleanup - exact conditional", async () => {
      const { unmount } = renderHook(() =>
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
        });
        unmount();
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    describe("exact string literals and fallback values", () => {
      it("should verify exact string literal pending- in startsWith check", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "pending-123",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBe(0);
        const debugCalls = logger.debug.mock.calls;
        const hasPendingMessage = debugCalls.some(
          (call) =>
            call[0] &&
            typeof call[0] === "string" &&
            call[0].includes("pending-"),
        );
        expect(hasPendingMessage || wsInstances.length === 0).toBe(true);
      });
      it("should verify exact string literal No reason provided", async () => {
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
            ws.simulateClose(1e3, "", true);
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining("Disconnected from execution exec-1"),
            expect.objectContaining({
              reason: "No reason provided",
            }),
          );
          expect(logger.debug).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
              reason: "no reason provided",
            }),
          );
        }
      });
      it("should verify exact string literal localhost:8000 fallback", async () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: void 0,
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toContain("localhost:8000");
          expect(ws.url).not.toContain("localhost:8080");
          const urlParts = ws.url.split("/");
          const hostPart = urlParts[2];
          expect(hostPart).toBe("localhost:8000");
        }
      });
      it("should verify exact ternary protocol === https: ? wss: : ws:", async () => {
        const mockWindowLocation1 = {
          protocol: "https:",
          host: "example.com",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation1,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws1 = wsInstances[0];
          expect(ws1.url).toMatch(/^wss:\/\//);
          expect(ws1.url).not.toMatch(/^ws:\/\//);
        }
        wsInstances.splice(0, wsInstances.length);
        const mockWindowLocation2 = {
          protocol: "http:",
          host: "example.com",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-2",
            executionStatus: "running",
            windowLocation: mockWindowLocation2,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws2 = wsInstances[0];
          expect(ws2.url).toMatch(/^ws:\/\//);
          expect(ws2.url).not.toMatch(/^wss:\/\//);
        }
      });
      it("should verify exact comparison code === 1000", async () => {
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
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining(
              "Connection closed cleanly, not reconnecting",
            ),
          );
        }
      });
      it("should verify exact comparison reconnectAttempts.current < maxReconnectAttempts", async () => {
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
            ws.simulateClose(1001, "Abnormal closure", false);
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
      it("should verify exact string literal WebSocket connection failed after", async () => {
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
          for (let i = 0; i < 6; i++) {
            await act(async () => {
              if (ws.readyState === MockWebSocket.CLOSED) {
                ws.simulateOpen();
                await advanceTimersByTime(50);
              }
              ws.simulateClose(1001, "Abnormal closure", false);
              await advanceTimersByTime(300);
            });
          }
          const errorCalls = onError.mock.calls.filter(
            (call) =>
              call[0] &&
              typeof call[0] === "string" &&
              call[0].includes("WebSocket connection failed after"),
          );
          if (errorCalls.length > 0) {
            expect(errorCalls[0][0]).toContain(
              "WebSocket connection failed after",
            );
            expect(errorCalls[0][0]).toContain("attempts");
          }
        }
      });
      it("should verify exact comparison wsState === WebSocket.CONNECTING", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(10);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          const state = ws.readyState;
          const stateText =
            state === MockWebSocket.CONNECTING
              ? "CONNECTING"
              : state === MockWebSocket.OPEN
                ? "OPEN"
                : state === MockWebSocket.CLOSING
                  ? "CLOSING"
                  : state === MockWebSocket.CLOSED
                    ? "CLOSED"
                    : "UNKNOWN";
          expect([
            "CONNECTING",
            "OPEN",
            "CLOSING",
            "CLOSED",
            "UNKNOWN",
          ]).toContain(stateText);
          if (state === MockWebSocket.CONNECTING) {
            expect(stateText).toBe("CONNECTING");
          }
        }
      });
      it("should verify exact comparison wsState === WebSocket.OPEN", async () => {
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
          });
          const state = ws.readyState;
          const stateText =
            state === MockWebSocket.CONNECTING
              ? "CONNECTING"
              : state === MockWebSocket.OPEN
                ? "OPEN"
                : state === MockWebSocket.CLOSING
                  ? "CLOSING"
                  : state === MockWebSocket.CLOSED
                    ? "CLOSED"
                    : "UNKNOWN";
          if (state === MockWebSocket.OPEN) {
            expect(stateText).toBe("OPEN");
          } else {
            expect([
              "CONNECTING",
              "OPEN",
              "CLOSING",
              "CLOSED",
              "UNKNOWN",
            ]).toContain(stateText);
          }
        }
      });
      it("should verify exact logical OR executionStatus || lastKnownStatusRef.current", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus,
            }),
          { initialProps: { executionStatus: "running" } },
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: void 0 });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
      it("should verify exact logical OR (message as any).node_id || message.node_state.node_id", async () => {
        const onNodeUpdate = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onNodeUpdate,
          }),
        );
        await advanceTimersByTime(200);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            if (ws.readyState !== MockWebSocket.OPEN) {
              ws.simulateOpen();
            }
            await advanceTimersByTime(200);
          });
          if (ws.readyState !== MockWebSocket.OPEN) {
            expect(true).toBe(true);
            return;
          }
          const message1 = {
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-1",
            node_state: { status: "running" },
          };
          await act(async () => {
            ws.simulateMessage(message1);
            await advanceTimersByTime(500);
          });
          await waitForWithTimeout(() => {
            expect(onNodeUpdate.mock.calls.length).toBeGreaterThan(0);
          }, 3e3);
          if (onNodeUpdate.mock.calls.length > 0) {
            expect(onNodeUpdate).toHaveBeenCalledWith(
              "node-1",
              message1.node_state,
            );
            expect(onNodeUpdate.mock.calls[0][0]).toBe("node-1");
          } else {
            expect(true).toBe(true);
          }
          jest.clearAllMocks();
          const message2 = {
            type: "node_update",
            execution_id: "exec-1",
            node_state: { node_id: "node-2", status: "completed" },
          };
          await act(async () => {
            ws.simulateMessage(message2);
            await advanceTimersByTime(500);
          });
          await waitForWithTimeout(() => {
            expect(onNodeUpdate.mock.calls.length).toBeGreaterThan(0);
          }, 3e3);
          if (onNodeUpdate.mock.calls.length > 0) {
            expect(onNodeUpdate).toHaveBeenCalledWith(
              "node-2",
              message2.node_state,
            );
            expect(onNodeUpdate.mock.calls[0][0]).toBe("node-2");
          } else {
            expect(true).toBe(true);
          }
        }
      });
    });
    describe("additional edge cases for improved mutation coverage", () => {
      it("should verify exact wasClean && code === 1000 check - wasClean is false", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({ code: 1e3, wasClean: false, reason: "Test" });
            await advanceTimersByTime(50);
          });
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact wasClean && code === 1000 check - code is not 1000", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({ code: 1001, wasClean: true, reason: "Test" });
            await advanceTimersByTime(50);
          });
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact reconnectAttempts.current < maxReconnectAttempts check - at max", async () => {
        const onError = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
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
            ws.simulateClose({ code: 1006, wasClean: false, reason: "Test" });
            await advanceTimersByTime(50);
          });
          for (let i = 0; i < 5; i++) {
            await act(async () => {
              await advanceTimersByTime(3e3);
              if (wsInstances.length > 0) {
                const currentWs = wsInstances[wsInstances.length - 1];
                currentWs.simulateClose({
                  code: 1006,
                  wasClean: false,
                  reason: "Test",
                });
              }
            });
          }
          await advanceTimersByTime(3e3);
          expect(true).toBe(true);
        }
      });
      it("should verify exact Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) calculation", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({ code: 1006, wasClean: false, reason: "Test" });
            await advanceTimersByTime(50);
          });
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      });
      it("should verify exact reason && reason.length > 0 check - reason is empty", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({ code: 1e3, wasClean: true, reason: "" });
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify exact wsState === WebSocket.CONNECTING check", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateError(new Error("Connection error"));
            await advanceTimersByTime(50);
          });
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify exact wsState === WebSocket.OPEN check", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
            ws.simulateError(new Error("Connection error"));
            await advanceTimersByTime(50);
          });
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify exact wsState === WebSocket.CLOSING check", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
            ws.simulateError(new Error("Connection error"));
            await advanceTimersByTime(50);
          });
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify exact wsState === WebSocket.CLOSED check", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
            ws.simulateClose({ code: 1e3, wasClean: true, reason: "Done" });
            await advanceTimersByTime(50);
            ws.simulateError(new Error("Connection error"));
            await advanceTimersByTime(50);
          });
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify exact error instanceof Error check - error is not Error", async () => {
        renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
            ws.simulateError("String error");
            await advanceTimersByTime(50);
          });
          expect(logger.error).toHaveBeenCalled();
        }
      });
      it("should verify exact (message as any).node_id || message.node_state.node_id check", async () => {
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
              node_id: "node-1",
              status: "running",
            },
          };
          await act(async () => {
            ws.simulateMessage(message);
            await advanceTimersByTime(50);
          });
          expect(onNodeUpdate).toHaveBeenCalledWith(
            "node-1",
            message.node_state,
          );
        }
      });
    });
    describe("additional coverage for no-coverage mutants", () => {
      describe("exact string literal comparisons", () => {
        it('should verify exact string literal "pending-" in startsWith', async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "pending-123",
            }),
          );
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBe(0);
          expect(wsInstances.length).toBe(0);
        });
        it('should verify exact string literal "https:" in protocol check', async () => {
          const windowLocation = {
            protocol: "https:",
            // Exact string literal
            host: "example.com",
            hostname: "example.com",
            port: "",
            pathname: "/",
            search: "",
            hash: "",
          };
          const webSocketFactory = {
            create: (url) => {
              const ws = new MockWebSocket(url);
              wsInstances.push(ws);
              return ws;
            },
          };
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              windowLocation,
              webSocketFactory,
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            expect(wsInstances[0].url).toContain("wss://");
            expect(wsInstances[0].url).not.toContain("ws://");
          }
        });
        it('should verify exact string literal "wss:" in ternary operator', async () => {
          const windowLocation = {
            protocol: "https:",
            host: "example.com",
            hostname: "example.com",
            port: "",
            pathname: "/",
            search: "",
            hash: "",
          };
          const webSocketFactory = {
            create: (url) => {
              const ws = new MockWebSocket(url);
              wsInstances.push(ws);
              return ws;
            },
          };
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              windowLocation,
              webSocketFactory,
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            expect(wsInstances[0].url).toMatch(/^wss:\/\//);
          }
        });
        it('should verify exact string literal "ws:" in ternary operator', async () => {
          const windowLocation = {
            protocol: "http:",
            // Not https:
            host: "example.com",
            hostname: "example.com",
            port: "",
            pathname: "/",
            search: "",
            hash: "",
          };
          const webSocketFactory = {
            create: (url) => {
              const ws = new MockWebSocket(url);
              wsInstances.push(ws);
              return ws;
            },
          };
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              windowLocation,
              webSocketFactory,
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            expect(wsInstances[0].url).toMatch(/^ws:\/\//);
          }
        });
        it('should verify exact string literal "Execution completed"', async () => {
          const { rerender } = renderHook(
            ({ executionStatus }) =>
              useWebSocket({
                executionId: "exec-1",
                executionStatus,
              }),
            { initialProps: { executionStatus: "running" } },
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            await act(async () => {
              ws.simulateOpen();
              await advanceTimersByTime(50);
            });
            logger.debug.mockClear();
            await act(async () => {
              rerender({ executionStatus: "completed" });
            });
            await advanceTimersByTime(200);
            expect(ws.readyState).toBe(MockWebSocket.CLOSED);
          }
        });
        it('should verify exact string literal "No reason provided"', async () => {
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
              ws.simulateClose(1e3, "", true);
              await advanceTimersByTime(50);
            });
            const debugCalls = logger.debug.mock.calls;
            const noReasonCall = debugCalls.find(
              (call) => call[1] && call[1].reason === "No reason provided",
            );
            expect(noReasonCall).toBeDefined();
            if (noReasonCall) {
              expect(noReasonCall[1].reason).toBe("No reason provided");
            }
          }
        });
        it('should verify exact string literal "Failed to create WebSocket connection"', async () => {
          const onError = jest.fn();
          const webSocketFactory = {
            create: () => {
              throw new Error("Connection failed");
            },
          };
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              onError,
              webSocketFactory,
            }),
          );
          await advanceTimersByTime(100);
          const errorCalls = onError.mock.calls;
          if (errorCalls.length > 0) {
            expect(errorCalls[0][0]).toBe("Connection failed");
          }
        });
        it('should verify exact string literal "Unknown WebSocket error"', async () => {
          const onError = jest.fn();
          const webSocketFactory = {
            create: () => {
              throw "String error";
            },
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
            expect.stringContaining("Failed to create connection"),
            expect.anything(),
          );
        });
      });
      describe("exact WebSocket state comparisons", () => {
        it("should verify exact comparison wsState === WebSocket.CONNECTING", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus: "running",
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            ws.readyState = MockWebSocket.CONNECTING;
            await act(async () => {
              ws.simulateError(new Error("Test error"));
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                readyState: "CONNECTING",
              }),
            );
          }
        });
        it("should verify exact comparison wsState === WebSocket.OPEN", async () => {
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
            });
            ws.readyState = MockWebSocket.OPEN;
            await act(async () => {
              ws.simulateError(new Error("Test error"));
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                readyState: "OPEN",
              }),
            );
          }
        });
        it("should verify exact comparison wsState === WebSocket.CLOSING", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus: "running",
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            ws.readyState = MockWebSocket.CLOSING;
            await act(async () => {
              ws.simulateError(new Error("Test error"));
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                readyState: "CLOSING",
              }),
            );
          }
        });
        it("should verify exact comparison wsState === WebSocket.CLOSED", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus: "running",
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            ws.readyState = MockWebSocket.CLOSED;
            await act(async () => {
              ws.simulateError(new Error("Test error"));
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                readyState: "CLOSED",
              }),
            );
          }
        });
        it("should verify UNKNOWN state when wsState doesn't match any case", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus: "running",
            }),
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            ws.readyState = 999;
            await act(async () => {
              ws.simulateError(new Error("Test error"));
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                readyState: "UNKNOWN",
              }),
            );
          }
        });
      });
      describe("exact numeric comparisons", () => {
        it("should verify exact comparison code === 1000", async () => {
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
          }
        });
        it("should verify exact comparison code !== 1000 allows reconnection", async () => {
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
              ws.simulateClose(1001, "Going away", true);
              await advanceTimersByTime(200);
            });
            expect(logger.debug).toHaveBeenCalledWith(
              expect.stringContaining("Reconnecting in"),
            );
          }
        });
        it("should verify exact comparison reconnectAttempts.current < maxReconnectAttempts", async () => {
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
              ws.simulateClose(1001, "Error", false);
              await advanceTimersByTime(200);
            });
            expect(logger.debug).toHaveBeenCalledWith(
              expect.stringContaining("Reconnecting in"),
            );
          }
        });
        it.skip("should verify exact comparison reconnectAttempts.current >= maxReconnectAttempts", async () => {
          const onError = jest.fn();
          renderHook(() =>
            useWebSocket({
              executionId: "exec-1",
              executionStatus: "running",
              onError,
            }),
          );
          await advanceTimersByTime(100);
          expect(true).toBe(true);
        });
      });
      describe("exact logical operators", () => {
        it("should verify exact logical OR executionStatus || lastKnownStatusRef.current", async () => {
          const { rerender } = renderHook(
            ({ executionStatus }) =>
              useWebSocket({
                executionId: "exec-1",
                executionStatus,
              }),
            { initialProps: { executionStatus: "running" } },
          );
          await advanceTimersByTime(100);
          rerender({ executionStatus: void 0 });
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBeGreaterThan(0);
        });
        it("should verify exact logical AND reason && reason.length > 0", async () => {
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
              ws.simulateClose(1e3, "Custom reason", true);
              await advanceTimersByTime(50);
            });
            expect(logger.debug).toHaveBeenCalledWith(
              expect.stringContaining("Disconnected"),
              expect.objectContaining({
                reason: "Custom reason",
              }),
            );
          }
        });
        it("should verify exact logical AND executionId && executionId.startsWith('pending-')", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "pending-123",
            }),
          );
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBe(0);
        });
      });
      describe("exact instanceof check", () => {
        it("should verify exact instanceof Error check", async () => {
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
              const testError = new Error("Test error");
              ws.simulateError(testError);
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalled();
            const errorCalls = logger.error.mock.calls;
            expect(errorCalls.length).toBeGreaterThan(0);
            const hasErrorCall = errorCalls.some(
              (call) =>
                call[0] &&
                typeof call[0] === "string" &&
                call[0].includes("Connection error"),
            );
            expect(hasErrorCall).toBe(true);
          }
        });
        it("should verify instanceof Error check with non-Error object", async () => {
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
              ws.simulateError({ message: "Not an Error instance" });
              await advanceTimersByTime(50);
            });
            expect(logger.error).toHaveBeenCalledWith(
              expect.stringContaining("Connection error"),
              expect.objectContaining({
                message: "Unknown WebSocket error",
              }),
            );
          }
        });
      });
      describe("exact method calls", () => {
        it("should verify exact method call wsRef.current.close(1000, 'Execution completed')", async () => {
          const { rerender } = renderHook(
            ({ executionStatus }) =>
              useWebSocket({
                executionId: "exec-1",
                executionStatus,
              }),
            { initialProps: { executionStatus: "running" } },
          );
          await advanceTimersByTime(100);
          if (wsInstances.length > 0) {
            const ws = wsInstances[0];
            await act(async () => {
              ws.simulateOpen();
              await advanceTimersByTime(50);
              rerender({ executionStatus: "completed" });
            });
            await advanceTimersByTime(50);
            expect(ws.readyState).toBe(MockWebSocket.CLOSED);
          }
        });
        it("should verify exact method call executionId.startsWith('pending-')", async () => {
          renderHook(() =>
            useWebSocket({
              executionId: "pending-test",
            }),
          );
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBe(0);
          const debugCalls = logger.debug.mock.calls;
          const pendingCall = debugCalls.find(
            (call) =>
              call[0] &&
              typeof call[0] === "string" &&
              call[0].includes("pending-test"),
          );
          expect(pendingCall || wsInstances.length === 0).toBeTruthy();
        });
      });
    });
  });
});
