import { waitFor, act } from "@testing-library/react";
import { isRunningUnderStryker } from "./detectStryker";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
const waitForWithTimeoutFakeTimers = async (callback, timeoutOrOptions = 2e3) => {
  const timeout = typeof timeoutOrOptions === "number" ? timeoutOrOptions : timeoutOrOptions?.timeout ?? 2e3;
  const isStryker = isRunningUnderStryker();
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === "function";
  if (wasUsingFakeTimers) {
    const maxTimerIterations = isStryker ? 30 : 5;
    const timerAdvanceDelay = isStryker ? 50 : 10;
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(0);
      jest.runOnlyPendingTimers();
    });
    let timerIterations = 0;
    while (jest.getTimerCount() > 0 && timerIterations < maxTimerIterations) {
      await act(async () => {
        jest.runAllTimers();
        if (isStryker && timerIterations < maxTimerIterations - 1) {
          const advanceAmount = Math.min(10 * Math.pow(2, timerIterations), 500);
          jest.advanceTimersByTime(advanceAmount);
        }
      });
      await Promise.resolve();
      timerIterations++;
    }
    jest.useRealTimers();
    try {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, timerAdvanceDelay));
      });
      return await act(async () => {
        return await waitFor(callback, { timeout });
      });
    } finally {
      jest.useFakeTimers();
    }
  } else {
    const adjustedTimeout = isStryker ? Math.max(timeout, 5e3) : timeout;
    if (isStryker) {
      return await act(async () => {
        return await waitFor(callback, { timeout: adjustedTimeout });
      });
    }
    return await waitFor(callback, { timeout: adjustedTimeout });
  }
};
const waitForWithTimeoutAuto = waitForWithTimeoutFakeTimers;
export {
  waitForWithTimeout,
  waitForWithTimeoutAuto,
  waitForWithTimeoutFakeTimers
};
