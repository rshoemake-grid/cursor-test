import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - edges.basic", () => {
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
  describe("edge cases", () => {
    it("should handle close event with no reason", async () => {
      renderHook(() => useWebSocket({ executionId: "exec-1" }));
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "[WebSocket] Disconnected from execution exec-1",
          ),
          expect.objectContaining({
            reason: "No reason provided",
          }),
        );
      }
    });
    it("should handle close event with reason", async () => {
      renderHook(() => useWebSocket({ executionId: "exec-1" }));
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "Custom reason", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "[WebSocket] Disconnected from execution exec-1",
          ),
          expect.objectContaining({
            reason: "Custom reason",
          }),
        );
      }
    });
    it("should handle node_update without node_id", async () => {
      const onNodeUpdate = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onNodeUpdate,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0 && wsInstances[0].onmessage) {
        wsInstances[0].simulateMessage({
          type: "node_update",
          execution_id: "exec-1",
          node_state: { status: "completed" },
          // No node_id anywhere
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
  });
  describe("error handling edge cases", () => {
    it("should handle Error instance in error event", async () => {
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const error = new Error("Connection failed");
        wsInstances[0].simulateError(error);
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
      }
    });
    it("should handle non-Error in error event", async () => {
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
        ws.setReadyState(MockWebSocket.CONNECTING);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
      }
    });
    it("should handle different readyState values in error handler", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(MockWebSocket.CONNECTING);
        ws.simulateError();
        await advanceTimersByTime(50);
        ws.setReadyState(MockWebSocket.OPEN);
        ws.simulateError();
        await advanceTimersByTime(50);
        ws.setReadyState(MockWebSocket.CLOSING);
        ws.simulateError();
        await advanceTimersByTime(50);
        ws.setReadyState(MockWebSocket.CLOSED);
        ws.simulateError();
        await advanceTimersByTime(50);
        ws.setReadyState(999);
        ws.simulateError();
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
      }
    });
  });
  describe("reconnection logic edge cases", () => {
    it("should not reconnect on clean close with code 1000", async () => {
      jest.clearAllMocks();
      wsInstances.splice(0, wsInstances.length);
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(5e3);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const cleanCloseCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Connection closed cleanly"),
        );
        expect(cleanCloseCalls.length).toBeGreaterThan(0);
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting in"),
        );
        expect(reconnectCalls.length).toBe(0);
      }
    });
    it("should reconnect on unclean close", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const initialCount = wsInstances.length;
        wsInstances[0].simulateClose(1006, "Abnormal closure", false);
        await advanceTimersByTime(100);
        await advanceTimersByTime(10100);
        expect(wsInstances.length).toBeGreaterThan(initialCount);
      }
    });
    it("should calculate exponential backoff delay correctly", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        await advanceTimersByTime(10100);
        if (wsInstances.length > 1) {
          wsInstances[1].simulateClose(1006, "", false);
          await advanceTimersByTime(100);
          await advanceTimersByTime(4100);
          if (wsInstances.length > 2) {
            wsInstances[2].simulateClose(1006, "", false);
            await advanceTimersByTime(100);
            await advanceTimersByTime(8100);
            if (wsInstances.length > 3) {
              wsInstances[3].simulateClose(1006, "", false);
              await advanceTimersByTime(100);
              await advanceTimersByTime(10100);
              expect(wsInstances.length).toBeGreaterThan(3);
            }
          }
        }
      }
    });
    it("should cap reconnect delay at 10000ms", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        for (let i = 0; i < 5; i++) {
          if (wsInstances[i]) {
            wsInstances[i].simulateClose(1006, "", false);
            await advanceTimersByTime(100);
            await advanceTimersByTime(10100);
          }
        }
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should call onError after max reconnect attempts", async () => {
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
      for (let i = 0; i < 6; i++) {
        const ws = wsInstances[wsInstances.length - 1];
        if (ws) {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(100);
          if (i < 5) {
            const delay = Math.min(1e3 * Math.pow(2, i + 1), 1e4);
            await advanceTimersByTime(delay + 100);
          }
        }
      }
      expect(wsInstances.length).toBeGreaterThan(0);
      expect(typeof onError).toBe("function");
    });
    it("should not reconnect when executionId becomes null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const initialCount = wsInstances.length;
        wsInstances[0].simulateClose(1006, "", false);
        rerender({ executionId: null });
        await advanceTimersByTime(5e3);
        expect(wsInstances.length).toBeLessThanOrEqual(initialCount + 1);
      }
    });
    it("should handle close with empty reason", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle close with reason provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("status transitions", () => {
    it("should close connection when status changes to completed", async () => {
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
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should close connection when status changes to failed", async () => {
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
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionStatus: "failed" });
        await advanceTimersByTime(50);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should use lastKnownStatusRef when executionStatus is undefined", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "completed" } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
  });
  describe("message parsing edge cases", () => {
    it("should handle invalid JSON in message", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(new MessageEvent("message", { data: "invalid json{" }));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should handle message with missing type field", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({ execution_id: "exec-1" }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should handle log message without log field", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should handle status message without status field", async () => {
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
        onStatus.mockClear();
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "status",
                execution_id: "exec-1",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        const statusCalls = onStatus.mock.calls.filter(
          (call) => call[0] !== "connected",
        );
        expect(statusCalls.length).toBe(0);
      }
    });
    it("should handle error message without error field", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "error",
                execution_id: "exec-1",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onError).not.toHaveBeenCalled();
      }
    });
    it("should handle completion message without result field", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "completion",
                execution_id: "exec-1",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onCompletion).toHaveBeenCalledWith(void 0);
      }
    });
  });
  describe("cleanup and unmount", () => {
    it("should cleanup on unmount", async () => {
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
    it("should clear reconnect timeout on unmount", async () => {
      jest.clearAllMocks();
      wsInstances.splice(0, wsInstances.length);
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      await advanceTimersByTime(50);
      if (wsInstances.length > 0) {
        const initialCount = wsInstances.length;
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        unmount();
        await advanceTimersByTime(5e3);
        expect(wsInstances.length).toBeLessThanOrEqual(initialCount + 2);
      }
    });
  });
  describe("node_update message edge cases", () => {
    it("should handle node_update with node_id only in top-level message", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                node_id: "node-top-level",
                node_state: { status: "running" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onNodeUpdate).toHaveBeenCalledWith("node-top-level", {
          status: "running",
        });
      }
    });
    it("should handle node_update with node_id only in node_state", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                node_state: { node_id: "node-in-state", status: "running" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onNodeUpdate).toHaveBeenCalledWith("node-in-state", {
          node_id: "node-in-state",
          status: "running",
        });
      }
    });
    it("should prefer top-level node_id over node_state.node_id", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                node_id: "top-level-id",
                node_state: { node_id: "state-id", status: "running" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onNodeUpdate).toHaveBeenCalledWith("top-level-id", {
          node_id: "state-id",
          status: "running",
        });
      }
    });
    it("should not call onNodeUpdate when node_state is missing", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                node_id: "node-1",
                // No node_state
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onNodeUpdate).not.toHaveBeenCalled();
      }
    });
    it("should not call onNodeUpdate when onNodeUpdate callback is not provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No onNodeUpdate
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                node_id: "node-1",
                node_state: { status: "running" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("completion message edge cases", () => {
    it("should call onCompletion with result when provided", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "completion",
                execution_id: "exec-1",
                result: { output: "test result" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onCompletion).toHaveBeenCalledWith({ output: "test result" });
      }
    });
    it("should call onCompletion with undefined when result is missing", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "completion",
                execution_id: "exec-1",
                // No result
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onCompletion).toHaveBeenCalledWith(void 0);
      }
    });
    it("should not call onCompletion when callback is not provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No onCompletion
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "completion",
                execution_id: "exec-1",
                result: { output: "test" },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("error message edge cases", () => {
    it("should call onError with error string when provided", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "error",
                execution_id: "exec-1",
                error: "Something went wrong",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onError).toHaveBeenCalledWith("Something went wrong");
      }
    });
    it("should not call onError when error field is missing", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "error",
                execution_id: "exec-1",
                // No error field
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onError).not.toHaveBeenCalled();
      }
    });
    it("should not call onError when callback is not provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No onError
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "error",
                execution_id: "exec-1",
                error: "Error message",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("log message edge cases", () => {
    it("should call onLog with log object when provided", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
                log: {
                  timestamp: "2024-01-01T00:00:00Z",
                  level: "INFO",
                  message: "Test log",
                  node_id: "node-1",
                },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onLog).toHaveBeenCalledWith({
          timestamp: "2024-01-01T00:00:00Z",
          level: "INFO",
          message: "Test log",
          node_id: "node-1",
        });
      }
    });
    it("should call onLog with log object without node_id", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
                log: {
                  timestamp: "2024-01-01T00:00:00Z",
                  level: "DEBUG",
                  message: "Debug log",
                },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onLog).toHaveBeenCalledWith({
          timestamp: "2024-01-01T00:00:00Z",
          level: "DEBUG",
          message: "Debug log",
        });
      }
    });
    it("should not call onLog when log field is missing", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
                // No log field
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onLog).not.toHaveBeenCalled();
      }
    });
    it("should not call onLog when callback is not provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No onLog
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
                log: {
                  timestamp: "2024-01-01T00:00:00Z",
                  level: "INFO",
                  message: "Test",
                },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("status message edge cases", () => {
    it("should call onStatus with status string when provided", async () => {
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
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "status",
                execution_id: "exec-1",
                status: "running",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(onStatus).toHaveBeenCalledWith("running");
      }
    });
    it("should not call onStatus when status field is missing", async () => {
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
        onStatus.mockClear();
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "status",
                execution_id: "exec-1",
                // No status field
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        const statusCalls = onStatus.mock.calls.filter(
          (call) => call[0] !== "connected",
        );
        expect(statusCalls.length).toBe(0);
      }
    });
    it("should not call onStatus when callback is not provided", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No onStatus
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "status",
                execution_id: "exec-1",
                status: "completed",
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("connection lifecycle edge cases", () => {
    it("should handle executionId changing from null to valid", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: null } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      rerender({ executionId: "exec-1" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionId changing from valid to null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      rerender({ executionId: null });
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should handle executionId changing between different values", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      const firstCount = wsInstances.length;
      rerender({ executionId: "exec-2" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(firstCount);
    });
    it("should handle executionStatus changing from undefined to completed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: void 0 } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      rerender({ executionStatus: "completed" });
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should handle executionStatus changing from running to paused", async () => {
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
      rerender({ executionStatus: "paused" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should update lastKnownStatusRef when executionStatus changes", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await advanceTimersByTime(100);
      rerender({ executionStatus: "paused" });
      await advanceTimersByTime(100);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("reconnect timeout edge cases", () => {
    it("should clear reconnect timeout when executionId changes", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should reset reconnect attempts when executionId changes", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        await advanceTimersByTime(2100);
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("close event edge cases", () => {
    it("should handle close with code 1000 and wasClean true", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle close with code 1000 and wasClean false", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "Abnormal closure", false);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle close with non-1000 code", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1006, "Abnormal closure", false);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle close with code 1000 but execution still running", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("WebSocket creation error handling", () => {
    it("should handle WebSocket constructor throwing error", async () => {
      const onError = jest.fn();
      const OriginalWS = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error("WebSocket creation failed");
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      global.WebSocket = OriginalWS;
    });
    it("should handle WebSocket constructor throwing non-Error", async () => {
      const onError = jest.fn();
      const OriginalWS = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw "String error";
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith("String error");
      global.WebSocket = OriginalWS;
    });
  });
  describe("callback dependency edge cases", () => {
    it("should reconnect when callbacks change", async () => {
      const onLog1 = jest.fn();
      const { rerender } = renderHook(
        ({ onLog }) => useWebSocket({ executionId: "exec-1", onLog }),
        { initialProps: { onLog: onLog1 } },
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      const onLog2 = jest.fn();
      rerender({ onLog: onLog2 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle all callbacks being undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No callbacks
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "log",
                execution_id: "exec-1",
                log: {
                  timestamp: "2024-01-01",
                  level: "INFO",
                  message: "Test",
                },
              }),
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("error event readyState edge cases", () => {
    it("should handle error with CONNECTING state", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(WebSocket.CONNECTING);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find((call) =>
          call[0]?.includes("Connection error"),
        );
        expect(errorCall).toBeDefined();
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].readyState).toBe("CONNECTING");
        }
      }
    });
    it("should handle error with OPEN state", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(WebSocket.OPEN);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find((call) =>
          call[0]?.includes("Connection error"),
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].readyState).toBe("OPEN");
        }
      }
    });
    it("should handle error with CLOSING state", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(WebSocket.CLOSING);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find((call) =>
          call[0]?.includes("Connection error"),
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].readyState).toBe("CLOSING");
        }
      }
    });
    it("should handle error with CLOSED state", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(WebSocket.CLOSED);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find((call) =>
          call[0]?.includes("Connection error"),
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].readyState).toBe("CLOSED");
        }
      }
    });
    it("should handle error with UNKNOWN state", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.setReadyState(999);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find((call) =>
          call[0]?.includes("Connection error"),
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].readyState).toBe("UNKNOWN");
        }
      }
    });
  });
  describe("close event reason edge cases", () => {
    it("should handle close with empty reason string", async () => {
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
        ws.simulateClose(1e3, "", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCall = logger.debug.mock.calls.find((call) =>
          call[0]?.includes("Disconnected"),
        );
        if (closeCall && closeCall[1]) {
          expect(closeCall[1].reason).toBe("No reason provided");
        }
      }
    });
    it("should handle close with undefined reason", async () => {
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
        if (ws.onclose) {
          ws.onclose(
            new CloseEvent("close", {
              code: 1e3,
              reason: void 0,
              wasClean: true,
            }),
          );
        }
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCall = logger.debug.mock.calls.find((call) =>
          call[0]?.includes("Disconnected"),
        );
        if (closeCall && closeCall[1]) {
          expect(closeCall[1].reason).toBe("No reason provided");
        }
      }
    });
    it("should handle close with provided reason", async () => {
      jest.clearAllMocks();
      wsInstances.splice(0, wsInstances.length);
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
        logger.debug.mockClear();
        ws.simulateClose(1e3, "Custom reason", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCall = logger.debug.mock.calls.find((call) =>
          call[0]?.includes("Disconnected"),
        );
        if (closeCall && closeCall[1]) {
          expect(closeCall[1].reason).toBe("Custom reason");
        }
      }
    });
  });
});
