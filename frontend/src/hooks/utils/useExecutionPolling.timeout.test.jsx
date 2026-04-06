import { renderHook, waitFor } from "@testing-library/react";
import { useExecutionPolling } from "./useExecutionPolling";
describe("useExecutionPolling - Timeout Guards", () => {
  let mockApiClient;
  let mockLogger;
  let tabsRef;
  let setTabs;
  beforeEach(() => {
    jest.useFakeTimers();
    mockApiClient = {
      getExecution: jest.fn(),
    };
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    tabsRef = { current: [] };
    setTabs = jest.fn();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  describe("Max iteration guard", () => {
    it("should stop polling after max iterations", async () => {
      const runningExecution = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
      };
      tabsRef.current = [
        {
          id: "tab-1",
          executions: [runningExecution],
        },
      ];
      mockApiClient.getExecution.mockResolvedValue({
        id: "exec-1",
        status: "running",
        completed_at: null,
        node_states: {},
        logs: [],
      });
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 100,
          // Fast interval for testing
        }),
      );
      for (let i = 0; i < 1001; i++) {
        jest.advanceTimersByTime(100);
      }
      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining("Max polling iterations (1000) reached"),
        );
      });
      const callCountBefore = mockApiClient.getExecution.mock.calls.length;
      jest.advanceTimersByTime(1e3);
      expect(mockApiClient.getExecution.mock.calls.length).toBe(
        callCountBefore,
      );
    });
  });
  describe("Invalid poll interval guard", () => {
    it("should clamp negative interval to default", () => {
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: -100,
          // Invalid negative interval
        }),
      );
      jest.advanceTimersByTime(2e3);
      expect(mockApiClient.getExecution).not.toHaveBeenCalled();
    });
    it("should clamp zero interval to default", () => {
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 0,
          // Invalid zero interval
        }),
      );
      jest.advanceTimersByTime(2e3);
      expect(mockApiClient.getExecution).not.toHaveBeenCalled();
    });
    it("should clamp very large interval to max", () => {
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 1e5,
          // Very large interval (> 60000)
        }),
      );
      jest.advanceTimersByTime(2e3);
      expect(mockApiClient.getExecution).not.toHaveBeenCalled();
    });
    it("should use valid interval when provided", () => {
      const runningExecution = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
      };
      tabsRef.current = [
        {
          id: "tab-1",
          executions: [runningExecution],
        },
      ];
      mockApiClient.getExecution.mockResolvedValue({
        id: "exec-1",
        status: "running",
        completed_at: null,
        node_states: {},
        logs: [],
      });
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 5e3,
          // Valid interval
        }),
      );
      jest.advanceTimersByTime(4e3);
      expect(mockApiClient.getExecution).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1e3);
      expect(mockApiClient.getExecution).toHaveBeenCalled();
    });
  });
  describe("Execution limit guard", () => {
    it("should limit concurrent executions to 50", async () => {
      const runningExecutions = Array.from({ length: 60 }, (_, i) => ({
        id: `exec-${i}`,
        status: "running",
        startedAt: new Date(),
      }));
      tabsRef.current = [
        {
          id: "tab-1",
          executions: runningExecutions,
        },
      ];
      mockApiClient.getExecution.mockResolvedValue({
        id: "exec-1",
        status: "running",
        completed_at: null,
        node_states: {},
        logs: [],
      });
      renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 100,
        }),
      );
      jest.advanceTimersByTime(100);
      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            "Too many running executions (60), limiting to 50",
          ),
        );
        expect(
          mockApiClient.getExecution.mock.calls.length,
        ).toBeLessThanOrEqual(50);
      });
    });
  });
  describe("Cleanup", () => {
    it("should clear interval on unmount", () => {
      const { unmount } = renderHook(() =>
        useExecutionPolling({
          tabsRef,
          setTabs,
          apiClient: mockApiClient,
          logger: mockLogger,
          pollInterval: 100,
        }),
      );
      const callCountBefore = mockApiClient.getExecution.mock.calls.length;
      unmount();
      jest.advanceTimersByTime(1e3);
      expect(mockApiClient.getExecution.mock.calls.length).toBe(
        callCountBefore,
      );
    });
  });
});
