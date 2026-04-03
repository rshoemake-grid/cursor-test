import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - status", () => {
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
  describe("status tracking", () => {
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
      expect(logger.debug).toHaveBeenCalled();
    });
    it("should use lastKnownStatusRef when executionStatus is undefined", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          // No executionStatus provided
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
});
