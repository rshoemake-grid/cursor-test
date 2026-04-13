import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  useWebSocket,
} from "./useWebSocket.test.setup";

describe("useWebSocket - auth gate", () => {
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

  it("does not open a socket when authReady is false", async () => {
    renderHook(() =>
      useWebSocket({
        executionId: "exec-1",
        executionStatus: "running",
        authReady: false,
        getAuthToken: () => "jwt-token",
      }),
    );
    await advanceTimersByTime(100);
    expect(wsInstances.length).toBe(0);
  });

  it("opens a socket when authReady becomes true", async () => {
    const { rerender } = renderHook(
      ({ authReady }) =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          authReady,
          getAuthToken: () => "jwt-token",
        }),
      { initialProps: { authReady: false } },
    );
    await advanceTimersByTime(100);
    expect(wsInstances.length).toBe(0);
    rerender({ authReady: true });
    await advanceTimersByTime(100);
    expect(wsInstances.length).toBeGreaterThan(0);
  });
});
