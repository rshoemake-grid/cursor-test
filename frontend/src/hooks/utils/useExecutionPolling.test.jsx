import { renderHook, act } from "@testing-library/react";
import { useExecutionPolling } from "./useExecutionPolling";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
jest.mock("../../api/client", () => ({
  api: {
    getExecution: jest.fn()
  }
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));
const mockApi = api;
const mockLoggerDebug = logger.debug;
const mockLoggerError = logger.error;
const mockLoggerWarn = logger.warn;
describe("useExecutionPolling", () => {
  let mockTabsRef;
  let mockSetTabs;
  const createMockTab = (workflowId, executions) => ({
    id: `tab-${workflowId}`,
    name: `Workflow ${workflowId}`,
    workflowId,
    isUnsaved: false,
    executions,
    activeExecutionId: null
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSetTabs = jest.fn((fn) => {
      if (typeof fn === "function") {
        const currentTabs = mockTabsRef.current;
        const newTabs = fn(currentTabs);
        mockTabsRef.current = newTabs;
      }
    });
    mockTabsRef = {
      current: []
    };
  });
  it("should handle null tabsRef.current", async () => {
    mockTabsRef.current = null;
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should handle tabsRef.current that is not an array", async () => {
    mockTabsRef.current = {};
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should handle tabs without executions array", async () => {
    const tabWithoutExecutions = {
      id: "tab-1",
      name: "Workflow 1",
      workflowId: "workflow-1",
      isUnsaved: false,
      activeExecutionId: null
    };
    mockTabsRef.current = [tabWithoutExecutions];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should handle tabs with null executions", async () => {
    const tabWithNullExecutions = {
      id: "tab-1",
      name: "Workflow 1",
      workflowId: "workflow-1",
      isUnsaved: false,
      executions: null,
      activeExecutionId: null
    };
    mockTabsRef.current = [tabWithNullExecutions];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should handle tabs with executions that is not an array", async () => {
    const tabWithInvalidExecutions = {
      id: "tab-1",
      name: "Workflow 1",
      workflowId: "workflow-1",
      isUnsaved: false,
      executions: {},
      activeExecutionId: null
    };
    mockTabsRef.current = [tabWithInvalidExecutions];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("should poll running executions", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "completed",
      completed_at: (/* @__PURE__ */ new Date()).toISOString(),
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).toHaveBeenCalledWith("exec-1");
    expect(mockSetTabs).toHaveBeenCalled();
    expect(mockLoggerDebug).toHaveBeenCalled();
  });
  it("should not poll pending executions", async () => {
    const pendingExecution = {
      id: "pending-123",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [pendingExecution])];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should not poll when no running executions", async () => {
    const completedExecution = {
      id: "exec-1",
      status: "completed",
      startedAt: /* @__PURE__ */ new Date(),
      completedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [completedExecution])];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should handle API errors gracefully", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    mockApi.getExecution.mockRejectedValue(new Error("API Error"));
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalled();
  });
  it("should update execution status", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "completed",
      completed_at: (/* @__PURE__ */ new Date()).toISOString(),
      node_states: { node1: { state: "done" } },
      logs: [{ message: "Log 1" }]
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockSetTabs).toHaveBeenCalled();
    const updateCall = mockSetTabs.mock.calls[0][0];
    const updatedTabs = updateCall(mockTabsRef.current);
    expect(updatedTabs[0].executions[0].status).toBe("completed");
  });
  it("should handle paused status by keeping as running", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "paused",
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockSetTabs).toHaveBeenCalled();
    const updateCall = mockSetTabs.mock.calls[0][0];
    const updatedTabs = updateCall(mockTabsRef.current);
    expect(updatedTabs[0].executions[0].status).toBe("running");
  });
  it("should handle paused status branch explicitly", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "paused",
      completed_at: null,
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).toHaveBeenCalledWith("exec-1");
    const updateCall = mockSetTabs.mock.calls[0][0];
    const updatedTabs = updateCall(mockTabsRef.current);
    expect(updatedTabs[0].executions[0].status).toBe("running");
  });
  it("should cover paused status ternary branch", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "paused",
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    const updateCall = mockSetTabs.mock.calls[0][0];
    const updatedTabs = updateCall(mockTabsRef.current);
    expect(updatedTabs[0].executions[0].status).toBe("running");
  });
  it("should handle unknown status by keeping as running", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "unknown-status",
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockSetTabs).toHaveBeenCalled();
    const updateCall = mockSetTabs.mock.calls[0][0];
    const updatedTabs = updateCall(mockTabsRef.current);
    expect(updatedTabs[0].executions[0].status).toBe("running");
  });
  it("should handle tabs with falsy executions in update", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    const mockExecutionResponse = {
      status: "running",
      node_states: {},
      logs: []
    };
    mockApi.getExecution.mockResolvedValue(mockExecutionResponse);
    mockSetTabs.mockImplementation((fn) => {
      if (typeof fn === "function") {
        const currentTabs = mockTabsRef.current;
        const newTabs = fn(currentTabs);
        newTabs[0].executions = null;
        mockTabsRef.current = newTabs;
      }
    });
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockSetTabs).toHaveBeenCalled();
    const updateCall = mockSetTabs.mock.calls[0][0];
    const testTabs = [createMockTab("workflow-1", [execution])];
    testTabs[0].executions = null;
    const updatedTabs = updateCall(testTabs);
    expect(updatedTabs[0].executions).toEqual([]);
  });
  it("should handle tabs with falsy executions", async () => {
    const tabWithFalsyExecutions = {
      id: "tab-1",
      name: "Workflow 1",
      workflowId: "workflow-1",
      isUnsaved: false,
      executions: null,
      activeExecutionId: null
    };
    mockTabsRef.current = [tabWithFalsyExecutions];
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    if (mockSetTabs.mock.calls.length > 0) {
      const updateCall = mockSetTabs.mock.calls[0][0];
      const updatedTabs = updateCall(mockTabsRef.current);
      expect(updatedTabs[0].executions).toEqual([]);
    }
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  it("should use custom poll interval", async () => {
    const execution = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [createMockTab("workflow-1", [execution])];
    mockApi.getExecution.mockResolvedValue({ status: "running" });
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 5e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(5e3);
    });
    expect(mockApi.getExecution).toHaveBeenCalled();
  });
  it("should handle multiple tabs with running executions", async () => {
    const execution1 = {
      id: "exec-1",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    const execution2 = {
      id: "exec-2",
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      nodes: {},
      logs: []
    };
    mockTabsRef.current = [
      createMockTab("workflow-1", [execution1]),
      createMockTab("workflow-2", [execution2])
    ];
    mockApi.getExecution.mockResolvedValue({ status: "running" });
    renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    await act(async () => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).toHaveBeenCalledTimes(2);
    expect(mockApi.getExecution).toHaveBeenCalledWith("exec-1");
    expect(mockApi.getExecution).toHaveBeenCalledWith("exec-2");
  });
  it("should clean up interval on unmount", () => {
    const { unmount } = renderHook(
      () => useExecutionPolling({
        tabsRef: mockTabsRef,
        setTabs: mockSetTabs,
        apiClient: mockApi,
        pollInterval: 1e3
      })
    );
    unmount();
    act(() => {
      jest.advanceTimersByTime(1e3);
    });
    expect(mockApi.getExecution).not.toHaveBeenCalled();
  });
  describe("Timeout Guards", () => {
    it("should stop polling after max iterations (1000)", async () => {
      const execution = {
        id: "exec-1",
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        nodes: {},
        logs: []
      };
      mockTabsRef.current = [createMockTab("workflow-1", [execution])];
      mockApi.getExecution.mockResolvedValue({ status: "running" });
      renderHook(
        () => useExecutionPolling({
          tabsRef: mockTabsRef,
          setTabs: mockSetTabs,
          apiClient: mockApi,
          pollInterval: 1e3
        })
      );
      const MAX_ITERATIONS = 1e3;
      for (let i = 0; i <= MAX_ITERATIONS; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1e3);
        });
      }
      expect(mockApi.getExecution).toHaveBeenCalledTimes(MAX_ITERATIONS);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining(`Max polling iterations (${MAX_ITERATIONS}) reached`)
      );
    });
    it("should clamp invalid poll interval to safe range", async () => {
      const execution = {
        id: "exec-1",
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        nodes: {},
        logs: []
      };
      mockTabsRef.current = [createMockTab("workflow-1", [execution])];
      mockApi.getExecution.mockResolvedValue({ status: "running" });
      renderHook(
        () => useExecutionPolling({
          tabsRef: mockTabsRef,
          setTabs: mockSetTabs,
          apiClient: mockApi,
          pollInterval: -1e3
        })
      );
      await act(async () => {
        jest.advanceTimersByTime(2e3);
      });
      expect(mockApi.getExecution).toHaveBeenCalled();
    });
    it("should clamp poll interval greater than 60000 to safe range", async () => {
      const execution = {
        id: "exec-1",
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        nodes: {},
        logs: []
      };
      mockTabsRef.current = [createMockTab("workflow-1", [execution])];
      mockApi.getExecution.mockResolvedValue({ status: "running" });
      renderHook(
        () => useExecutionPolling({
          tabsRef: mockTabsRef,
          setTabs: mockSetTabs,
          apiClient: mockApi,
          pollInterval: 1e5
        })
      );
      await act(async () => {
        jest.advanceTimersByTime(2e3);
      });
      expect(mockApi.getExecution).toHaveBeenCalled();
    });
    it("should limit concurrent executions to 50", async () => {
      const executions = Array.from({ length: 60 }, (_, i) => ({
        id: `exec-${i}`,
        status: "running",
        startedAt: /* @__PURE__ */ new Date(),
        nodes: {},
        logs: []
      }));
      mockTabsRef.current = [createMockTab("workflow-1", executions)];
      mockApi.getExecution.mockResolvedValue({ status: "running" });
      renderHook(
        () => useExecutionPolling({
          tabsRef: mockTabsRef,
          setTabs: mockSetTabs,
          apiClient: mockApi,
          pollInterval: 1e3
        })
      );
      await act(async () => {
        jest.advanceTimersByTime(1e3);
      });
      expect(mockApi.getExecution).toHaveBeenCalledTimes(50);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("Too many running executions (60), limiting to 50")
      );
    });
  });
});
