import { renderHook } from "@testing-library/react";
import {
  wsInstances,
  advanceTimersByTime,
  useWebSocket,
} from "./useWebSocket.test.setup";

describe("useWebSocket callback stability", () => {
  beforeEach(() => {
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
  });

  it("does not open another WebSocket when only callback identities change", async () => {
    const onLogA = jest.fn();
    const onLogB = jest.fn();
    const common = {
      executionId: "exec-cb-stable",
      executionStatus: "running",
      onStatus: jest.fn(),
      onNodeUpdate: jest.fn(),
      onCompletion: jest.fn(),
      onError: jest.fn(),
    };
    const { rerender } = renderHook(
      ({ onLog }) => useWebSocket({ ...common, onLog }),
      { initialProps: { onLog: onLogA } },
    );
    await advanceTimersByTime(50);
    const nAfterMount = wsInstances.length;

    rerender({ onLog: onLogB });
    await advanceTimersByTime(50);
    const nAfterRerender = wsInstances.length;

    expect(nAfterMount).toBeGreaterThan(0);
    expect(nAfterRerender).toBe(nAfterMount);
  });
});
