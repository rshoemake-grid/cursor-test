import { act } from "@testing-library/react";
import { waitForWithTimeoutFakeTimers } from "./waitForWithTimeout";
import { isRunningUnderStryker } from "./detectStryker";
async function waitForWorkflowsOfWorkflowsToPopulate(
  result,
  expectedLengthOrMockHttpClient,
  expectedLengthOrTimeout,
  timeoutOrMockHttpClient,
) {
  let expectedLength = "greaterThanZero";
  let timeout;
  let mockHttpClient;
  if (
    typeof expectedLengthOrMockHttpClient === "object" &&
    expectedLengthOrMockHttpClient !== null &&
    "get" in expectedLengthOrMockHttpClient
  ) {
    mockHttpClient = expectedLengthOrMockHttpClient;
    if (
      typeof expectedLengthOrTimeout === "string" ||
      typeof expectedLengthOrTimeout === "number"
    ) {
      expectedLength = expectedLengthOrTimeout;
    }
    if (typeof timeoutOrMockHttpClient === "number") {
      timeout = timeoutOrMockHttpClient;
    }
  } else {
    if (
      typeof expectedLengthOrMockHttpClient === "string" ||
      typeof expectedLengthOrMockHttpClient === "number"
    ) {
      expectedLength = expectedLengthOrMockHttpClient;
    }
    if (typeof expectedLengthOrTimeout === "number") {
      timeout = expectedLengthOrTimeout;
    } else if (
      typeof expectedLengthOrTimeout === "object" &&
      expectedLengthOrTimeout !== null &&
      "get" in expectedLengthOrTimeout
    ) {
      mockHttpClient = expectedLengthOrTimeout;
    }
    if (
      typeof timeoutOrMockHttpClient === "object" &&
      timeoutOrMockHttpClient !== null &&
      "get" in timeoutOrMockHttpClient
    ) {
      mockHttpClient = timeoutOrMockHttpClient;
    } else if (typeof timeoutOrMockHttpClient === "number") {
      timeout = timeoutOrMockHttpClient;
    }
  }
  const actualTimeout = timeout ?? (isRunningUnderStryker() ? 12e4 : 9e4);
  await act(async () => {
    await result.current.fetchWorkflowsOfWorkflows();
  });
  if (mockHttpClient) {
    await waitForWithTimeoutFakeTimers(() => {
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockHttpClient.post).toHaveBeenCalled();
    }, actualTimeout);
  }
  if (!isRunningUnderStryker()) {
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1e3);
        jest.runOnlyPendingTimers();
      });
      await Promise.resolve();
    }
  } else {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
  }
  await waitForWithTimeoutFakeTimers(() => {
    expect(result.current.loading).toBe(false);
  }, actualTimeout);
  if (!isRunningUnderStryker()) {
    for (let i = 0; i < 15; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1e3);
        jest.runOnlyPendingTimers();
      });
      await Promise.resolve();
    }
  } else {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
  }
  await waitForWithTimeoutFakeTimers(() => {
    expect(result.current.workflowsOfWorkflows).toBeDefined();
    expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true);
    if (expectedLength === "greaterThanZero") {
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    } else if (expectedLength === "zero") {
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    } else {
      expect(result.current.workflowsOfWorkflows.length).toBe(expectedLength);
    }
  }, actualTimeout);
}
export { waitForWorkflowsOfWorkflowsToPopulate };
