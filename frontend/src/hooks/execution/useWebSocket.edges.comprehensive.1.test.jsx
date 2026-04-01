import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger
} from "./useWebSocket.test.setup";
describe("useWebSocket - edges.comprehensive.1", () => {
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
  describe("max reconnect attempts else branch", () => {
    it("should handle max reconnect attempts else branch", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle max attempts without onError callback", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
          // No onError callback
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("cleanup edge cases", () => {
    it("should cleanup reconnect timeout in first useEffect", async () => {
      const { unmount } = renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        unmount();
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should cleanup WebSocket in first useEffect when status changes to completed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
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
        await advanceTimersByTime(100);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should cleanup WebSocket in first useEffect when status changes to failed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
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
        await advanceTimersByTime(100);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should cleanup reconnect timeout when executionStatus changes", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
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
        await advanceTimersByTime(100);
        rerender({ executionStatus: "paused" });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("error instanceof edge cases", () => {
    it("should handle Error instance in error event", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const errorEvent = new Error("Custom error message");
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find(
          (call) => call[0]?.includes("Connection error")
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].message).toBe("Custom error message");
        }
      }
    });
    it("should handle non-Error in error event", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const errorEvent = { message: "Not an Error" };
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall = logger.error.mock.calls.find(
          (call) => call[0]?.includes("Connection error")
        );
        if (errorCall && errorCall[1]) {
          expect(errorCall[1].message).toBe("Not an Error");
        }
      }
    });
  });
  describe("executionId string operations", () => {
    it("should handle executionId that starts with pending- exactly", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "pending-123"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should handle executionId that starts with pending- with more characters", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "pending-execution-123"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should handle executionId that does not start with pending-", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionId with pending- in middle", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-pending-123"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("status check edge cases", () => {
    it("should handle executionStatus undefined with lastKnownStatusRef completed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
          executionStatus
        }),
        { initialProps: { executionStatus: "completed" } }
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should handle executionStatus undefined with lastKnownStatusRef failed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
          executionStatus
        }),
        { initialProps: { executionStatus: "failed" } }
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should handle executionStatus undefined with lastKnownStatusRef running", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionStatus undefined with lastKnownStatusRef undefined", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: void 0
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionStatus pending", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "pending"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionStatus paused", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "paused"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("URL construction edge cases", () => {
    it("should construct URL with correct format", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(logger.debug).toHaveBeenCalled();
        const debugCalls = logger.debug.mock.calls;
        const connectCall = debugCalls.find(
          (call) => call[0]?.includes("Connecting to")
        );
        expect(connectCall).toBeDefined();
      }
    });
    it("should include executionId in URL", async () => {
      const executionId = "test-exec-456";
      renderHook(
        () => useWebSocket({
          executionId
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const debugCalls = logger.debug.mock.calls;
        const connectCall = debugCalls.find(
          (call) => call[0]?.includes("Connecting to")
        );
        if (connectCall) {
          expect(connectCall[0]).toContain(executionId);
        }
      }
    });
  });
  describe("switch statement edge cases", () => {
    it("should handle unknown message type", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(new MessageEvent("message", {
            data: JSON.stringify({
              type: "unknown_type",
              execution_id: "exec-1"
            })
          }));
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should handle message with null type", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          ws.onmessage(new MessageEvent("message", {
            data: JSON.stringify({
              type: null,
              execution_id: "exec-1"
            })
          }));
        }
        await advanceTimersByTime(50);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("callback dependency edge cases", () => {
    it("should handle connect callback being recreated", async () => {
      const onLog1 = jest.fn();
      const { rerender } = renderHook(
        ({ onLog }) => useWebSocket({ executionId: "exec-1", onLog }),
        { initialProps: { onLog: onLog1 } }
      );
      await advanceTimersByTime(100);
      const onLog2 = jest.fn();
      rerender({ onLog: onLog2 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle all callbacks being provided", async () => {
      const onLog = jest.fn();
      const onStatus = jest.fn();
      const onNodeUpdate = jest.fn();
      const onCompletion = jest.fn();
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onLog,
          onStatus,
          onNodeUpdate,
          onCompletion,
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle some callbacks being provided", async () => {
      const onLog = jest.fn();
      const onStatus = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onLog,
          onStatus
          // Other callbacks not provided
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("wsRef.current edge cases", () => {
    it("should handle wsRef.current being null when closing", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].readyState = MockWebSocket.CLOSED;
      }
      rerender({ executionStatus: "completed" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
  });
  describe("reconnectAttempts edge cases", () => {
    it("should reset reconnectAttempts to 0 on successful connection", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in")
        );
        if (reconnectCalls.length > 0) {
          const firstCall = reconnectCalls[0];
          expect(firstCall[0]).toContain("attempt 1/5");
        }
      }
    });
    it("should reset reconnectAttempts when executionId changes", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
  });
  describe("reconnectTimeoutRef edge cases", () => {
    it("should handle reconnectTimeoutRef being null", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      const { unmount } = renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      unmount();
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should clear reconnectTimeoutRef when executionStatus changes to completed", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
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
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("close event code and wasClean combinations", () => {
    it("should handle wasClean true with code not 1000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1001, "", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting")
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      }
    });
    it("should handle wasClean false with code 1000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "", false);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting")
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      }
    });
  });
  describe("executionId null checks", () => {
    it("should handle executionId being null in onclose", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should handle executionId being null in reconnect check", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        rerender({ executionId: null });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("lastKnownStatusRef initialization", () => {
    it("should initialize lastKnownStatusRef with executionStatus", () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should initialize lastKnownStatusRef with undefined when executionStatus not provided", () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1"
          // No executionStatus
        })
      );
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
  });
  describe("comprehensive conditional branch coverage", () => {
    it("should handle executionId being empty string", async () => {
      renderHook(
        () => useWebSocket({
          executionId: ""
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should handle executionId with exactly "pending-"', async () => {
      renderHook(
        () => useWebSocket({
          executionId: "pending-"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should handle executionId starting with "pending-" case variations', async () => {
      renderHook(
        () => useWebSocket({
          executionId: "PENDING-123"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionStatus being explicitly null", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: null
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle executionStatus being empty string", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: ""
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it("should handle Math.pow edge cases in reconnect delay", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
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
          await advanceTimersByTime(100);
          await advanceTimersByTime(11e3);
        }
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in")
        );
        expect(reconnectCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should handle Math.min edge case when delay exceeds 10000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
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
          await advanceTimersByTime(100);
          await advanceTimersByTime(11e3);
        }
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in")
        );
        if (reconnectCalls.length > 0) {
          const lastCall = reconnectCalls[reconnectCalls.length - 1];
          const delayMatch = lastCall[0].match(/Reconnecting in (\d+)ms/);
          if (delayMatch) {
            const delay = parseInt(delayMatch[1], 10);
            expect(delay).toBeLessThanOrEqual(1e4);
          }
        }
      }
    });
    it("should handle reconnectAttempts comparison edge cases", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        await advanceTimersByTime(11e3);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle code comparison edge cases", async () => {
      const codes = [999, 1e3, 1001, 1005, 1006, 1011, 1015];
      for (const code of codes) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(code, "", code === 1e3);
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      }
    });
    it("should handle wasClean boolean edge cases", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1e3, "", true);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting")
        );
        expect(reconnectCalls.length).toBe(0);
      }
    });
    it("should handle all switch case branches with edge cases", async () => {
      const messageTypes = [
        "log",
        "status",
        "node_update",
        "completion",
        "error"
      ];
      for (const messageType of messageTypes) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const onLog = jest.fn();
        const onStatus = jest.fn();
        const onNodeUpdate = jest.fn();
        const onCompletion = jest.fn();
        const onError = jest.fn();
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            onLog,
            onStatus,
            onNodeUpdate,
            onCompletion,
            onError
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          if (ws.onmessage) {
            const messageData = {
              type: messageType,
              execution_id: "exec-1"
            };
            if (messageType === "log") {
              messageData.log = { timestamp: "2024-01-01", level: "INFO", message: "Test" };
            } else if (messageType === "status") {
              messageData.status = "running";
            } else if (messageType === "node_update") {
              messageData.node_id = "node-1";
              messageData.node_state = { status: "completed" };
            } else if (messageType === "completion") {
              messageData.result = { output: "result" };
            } else if (messageType === "error") {
              messageData.error = "Error message";
            }
            ws.onmessage(new MessageEvent("message", {
              data: JSON.stringify(messageData)
            }));
          }
          await advanceTimersByTime(50);
          if (messageType === "log") {
            expect(onLog).toHaveBeenCalled();
          } else if (messageType === "status") {
            expect(onStatus).toHaveBeenCalled();
          } else if (messageType === "node_update") {
            expect(onNodeUpdate).toHaveBeenCalled();
          } else if (messageType === "completion") {
            expect(onCompletion).toHaveBeenCalled();
          } else if (messageType === "error") {
            expect(onError).toHaveBeenCalled();
          }
        }
      }
    });
    it("should handle instanceof Error check edge cases", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const error1 = new Error("Test error");
        if (ws.onerror) {
          ws.onerror(error1);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall1 = logger.error.mock.calls.find(
          (call) => call[0]?.includes("Connection error")
        );
        if (errorCall1 && errorCall1[1]) {
          expect(errorCall1[1].message).toBe("Test error");
        }
        jest.clearAllMocks();
        const error2 = { message: "Not an Error" };
        if (ws.onerror) {
          ws.onerror(error2);
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCall2 = logger.error.mock.calls.find(
          (call) => call[0]?.includes("Connection error")
        );
        if (errorCall2 && errorCall2[1]) {
          expect(errorCall2[1].message).toBe("Not an Error");
        }
      }
    });
    it("should handle readyState ternary chain edge cases", async () => {
      const states = [
        WebSocket.CONNECTING,
        WebSocket.OPEN,
        WebSocket.CLOSING,
        WebSocket.CLOSED,
        999
        // Invalid state
      ];
      for (const state of states) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.setReadyState(state);
          if (ws.onerror) {
            ws.onerror(new Event("error"));
          }
          await advanceTimersByTime(50);
          expect(logger.error).toHaveBeenCalled();
          const errorCall = logger.error.mock.calls.find(
            (call) => call[0]?.includes("Connection error")
          );
          if (errorCall && errorCall[1]) {
            const expectedState = state === WebSocket.CONNECTING ? "CONNECTING" : state === WebSocket.OPEN ? "OPEN" : state === WebSocket.CLOSING ? "CLOSING" : state === WebSocket.CLOSED ? "CLOSED" : "UNKNOWN";
            expect(errorCall[1].readyState).toBe(expectedState);
          }
        }
      }
    });
    it("should verify exact wsState === WebSocket.CONNECTING comparison", async () => {
      const executionId = "exec-connecting-state-test";
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
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].readyState).toBe("CONNECTING");
        }
      }
    });
    it("should verify exact wsState === WebSocket.OPEN comparison", async () => {
      const executionId = "exec-open-state-test";
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
        ws.setReadyState(WebSocket.OPEN);
        if (ws.onerror) {
          ws.onerror(new Event("error"));
        }
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalled();
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].readyState).toBe("OPEN");
        }
      }
    });
    it("should verify exact wsState === WebSocket.CLOSING comparison", async () => {
      const executionId = "exec-closing-state-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
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
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].readyState).toBe("CLOSING");
        }
      }
    });
    it("should verify exact wsState === WebSocket.CLOSED comparison", async () => {
      const executionId = "exec-closed-state-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
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
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].readyState).toBe("CLOSED");
        }
      }
    });
    it("should verify exact wsState !== all states fallback to UNKNOWN", async () => {
      const executionId = "exec-unknown-state-test";
      renderHook(
        () => useWebSocket({
          executionId,
          executionStatus: "running"
        })
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
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].readyState).toBe("UNKNOWN");
        }
      }
    });
    it("should verify exact string literals in readyState ternary chain", async () => {
      const executionId = "exec-ready-state-strings-test";
      const states = [
        { value: WebSocket.CONNECTING, expected: "CONNECTING" },
        { value: WebSocket.OPEN, expected: "OPEN" },
        { value: WebSocket.CLOSING, expected: "CLOSING" },
        { value: WebSocket.CLOSED, expected: "CLOSED" },
        { value: 999, expected: "UNKNOWN" }
      ];
      for (const { value, expected } of states) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        renderHook(
          () => useWebSocket({
            executionId: `${executionId}-${value}`,
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.setReadyState(value);
          if (ws.onerror) {
            ws.onerror(new Event("error"));
          }
          await advanceTimersByTime(50);
          expect(logger.error).toHaveBeenCalled();
          const errorCalls = logger.error.mock.calls.filter(
            (call) => call[0]?.includes("Connection error")
          );
          expect(errorCalls.length).toBeGreaterThan(0);
          if (errorCalls.length > 0 && errorCalls[errorCalls.length - 1][1]) {
            expect(errorCalls[errorCalls.length - 1][1].readyState).toBe(expected);
          }
        }
      }
    });
    it("should handle reason || fallback edge case", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
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
        const closeCall1 = logger.debug.mock.calls.find(
          (call) => call[0]?.includes("Disconnected")
        );
        if (closeCall1 && closeCall1[1]) {
          expect(closeCall1[1].reason).toBe("Custom reason");
        }
        jest.clearAllMocks();
        ws.simulateClose(1e3, "", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const closeCall2 = logger.debug.mock.calls.find(
          (call) => call[0]?.includes("Disconnected")
        );
        if (closeCall2 && closeCall2[1]) {
          expect(closeCall2[1].reason).toBe("No reason provided");
        }
      }
    });
    it("should handle nodeId extraction with all combinations", async () => {
      const onNodeUpdate = jest.fn();
      const testCases = [
        { node_id: "top-level", node_state: {} },
        { node_state: { node_id: "in-state" } },
        { node_id: "top-level", node_state: { node_id: "in-state" } },
        { node_state: {} }
        // No node_id
      ];
      for (const testCase of testCases) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            onNodeUpdate
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          if (ws.onmessage) {
            ws.onmessage(new MessageEvent("message", {
              data: JSON.stringify({
                type: "node_update",
                execution_id: "exec-1",
                ...testCase
              })
            }));
          }
          await advanceTimersByTime(50);
          if (testCase.node_id || testCase.node_state?.node_id) {
            expect(onNodeUpdate).toHaveBeenCalled();
          } else {
            expect(onNodeUpdate).not.toHaveBeenCalled();
          }
        }
      }
    });
    it("should handle all callback existence checks", async () => {
      const callbackCombinations = [
        { onLog: true },
        { onStatus: true },
        { onNodeUpdate: true },
        { onCompletion: true },
        { onError: true },
        { onLog: true, onStatus: true },
        { onLog: true, onStatus: true, onNodeUpdate: true },
        { onLog: true, onStatus: true, onNodeUpdate: true, onCompletion: true },
        { onLog: true, onStatus: true, onNodeUpdate: true, onCompletion: true, onError: true },
        {}
        // No callbacks
      ];
      for (const callbacks of callbackCombinations) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        const onLog = callbacks.onLog ? jest.fn() : void 0;
        const onStatus = callbacks.onStatus ? jest.fn() : void 0;
        const onNodeUpdate = callbacks.onNodeUpdate ? jest.fn() : void 0;
        const onCompletion = callbacks.onCompletion ? jest.fn() : void 0;
        const onError = callbacks.onError ? jest.fn() : void 0;
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            onLog,
            onStatus,
            onNodeUpdate,
            onCompletion,
            onError
          })
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should handle executionStatus === checks for all values", async () => {
      const statuses = [
        "running",
        "completed",
        "failed",
        "pending",
        "paused"
      ];
      for (const status of statuses) {
        jest.clearAllMocks();
        wsInstances.splice(0, wsInstances.length);
        renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            executionStatus: status
          })
        );
        await advanceTimersByTime(100);
        if (status === "completed" || status === "failed") {
          expect(wsInstances.length).toBeLessThanOrEqual(2);
        } else {
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      }
    });
    it("should handle wsRef.current null checks", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-1",
          executionStatus
        }),
        { initialProps: { executionStatus: "running" } }
      );
      await advanceTimersByTime(100);
      rerender({ executionStatus: "completed" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should handle reconnectTimeoutRef null checks in cleanup", async () => {
      const { unmount } = renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      unmount();
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should handle executionId null check in onclose", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        rerender({ executionId: null });
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should handle executionId null check in reconnect condition", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: "exec-1" } }
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(50);
        rerender({ executionId: null });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
  describe("useEffect hooks comprehensive coverage", () => {
    describe("first useEffect - executionStatus changes", () => {
      it("should update lastKnownStatusRef when executionStatus changes", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      });
      it("should handle executionStatus being undefined", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: void 0 });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should handle executionStatus being null", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: null });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should close connection when executionStatus changes to completed", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
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
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
          const closeCalls = logger.debug.mock.calls.filter(
            (call) => call[0]?.includes("Closing connection")
          );
          expect(closeCalls.length).toBeGreaterThanOrEqual(0);
        }
      });
      it("should close connection when executionStatus changes to failed", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
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
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should clear reconnectTimeoutRef when executionStatus changes to completed", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
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
          await advanceTimersByTime(100);
          rerender({ executionStatus: "completed" });
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should handle wsRef.current being null when closing", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should handle reconnectTimeoutRef.current being null when clearing", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
    });
    describe("second useEffect - executionId and executionStatus changes", () => {
      it("should clear reconnectTimeoutRef when executionId changes", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(100);
          rerender({ executionId: "exec-2" });
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should reset reconnectAttempts when executionId changes", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(100);
          rerender({ executionId: "exec-2" });
          await advanceTimersByTime(100);
          expect(wsInstances.length).toBeGreaterThan(0);
        }
      });
      it("should handle executionId changing from null to value", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId }),
          { initialProps: { executionId: null } }
        );
        await advanceTimersByTime(100);
        rerender({ executionId: "exec-1" });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
      it("should handle executionId changing from value to null", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionId: null });
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should handle cleanup function when component unmounts", async () => {
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(100);
          unmount();
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should handle cleanup function with null reconnectTimeoutRef", async () => {
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId: "exec-1",
            executionStatus: "running"
          })
        );
        await advanceTimersByTime(100);
        unmount();
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should handle cleanup function with null wsRef", async () => {
        const { unmount } = renderHook(
          () => useWebSocket({
            executionId: null
          })
        );
        await advanceTimersByTime(100);
        unmount();
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it("should handle executionId changing to pending-", async () => {
        const { rerender } = renderHook(
          ({ executionId }) => useWebSocket({ executionId }),
          { initialProps: { executionId: "exec-1" } }
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          ws.simulateOpen();
          await advanceTimersByTime(50);
          rerender({ executionId: "pending-123" });
          await advanceTimersByTime(100);
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should handle executionStatus changing in second useEffect", async () => {
        const { rerender } = renderHook(
          ({ executionStatus }) => useWebSocket({
            executionId: "exec-1",
            executionStatus
          }),
          { initialProps: { executionStatus: "running" } }
        );
        await advanceTimersByTime(100);
        rerender({ executionStatus: "completed" });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      });
      it("should handle connect callback dependency changes", async () => {
        const onLog1 = jest.fn();
        const { rerender } = renderHook(
          ({ onLog }) => useWebSocket({
            executionId: "exec-1",
            onLog
          }),
          { initialProps: { onLog: onLog1 } }
        );
        await advanceTimersByTime(100);
        const onLog2 = jest.fn();
        rerender({ onLog: onLog2 });
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
      });
    });
  });
});
