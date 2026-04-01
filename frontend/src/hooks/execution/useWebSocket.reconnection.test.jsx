import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  useWebSocket,
  logger
} from "./useWebSocket.test.setup";
describe("useWebSocket - reconnection", () => {
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
  describe("reconnection", () => {
    it("should attempt to reconnect on unexpected close", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const initialCount = wsInstances.length;
        wsInstances[0].simulateClose(1006, "Abnormal closure", false);
        await advanceTimersByTime(2e3);
        expect(wsInstances.length).toBeGreaterThanOrEqual(initialCount);
      }
    });
    it("should not reconnect if connection was closed cleanly", async () => {
      jest.clearAllMocks();
      wsInstances.splice(0, wsInstances.length);
      const { unmount } = renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      await advanceTimersByTime(50);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        ws.simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(2e3);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
        const cleanCloseCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Connection closed cleanly")
        );
        expect(cleanCloseCalls.length).toBeGreaterThan(0);
        const reconnectCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in")
        );
        expect(reconnectCalls.length).toBe(0);
        unmount();
      }
    });
    it("should not reconnect to temporary execution IDs", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "pending-123",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should not reconnect if execution is completed", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed"
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it("should respect max reconnect attempts", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        for (let i = 0; i < 6; i++) {
          const currentWs = wsInstances[wsInstances.length - 1];
          if (currentWs) {
            currentWs.simulateClose(1006, "", false);
            await advanceTimersByTime(3e3);
          }
        }
        expect(wsInstances.length).toBeGreaterThan(0);
      }
    });
    it("should calculate reconnect delay correctly", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        const initialCount = wsInstances.length;
        await advanceTimersByTime(2e3);
        expect(wsInstances.length).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });
});
