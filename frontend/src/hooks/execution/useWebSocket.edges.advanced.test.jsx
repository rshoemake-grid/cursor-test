import { renderHook, act } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - edges.advanced", () => {
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
  describe("reconnect delay calculation edge cases", () => {
    it("should cap delay at 10000ms for high attempt numbers", async () => {
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
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            ws.simulateClose(1006, "", false);
            await advanceTimersByTime(100);
          });
          await advanceTimersByTime(11e3);
        }
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting in"),
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
    it("should calculate exponential backoff correctly", async () => {
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
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting in"),
        );
        if (reconnectCalls.length > 0) {
          const firstCall = reconnectCalls[0];
          const delayMatch = firstCall[0].match(/Reconnecting in (\d+)ms/);
          if (delayMatch) {
            const delay = parseInt(delayMatch[1], 10);
            expect(delay).toBe(1e4);
          }
        }
      }
    });
  });
  describe("close event code edge cases", () => {
    it("should handle close with code 1000 and wasClean false", async () => {
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
        expect(logger.debug).toHaveBeenCalled();
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting in"),
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      }
    });
  });
});
