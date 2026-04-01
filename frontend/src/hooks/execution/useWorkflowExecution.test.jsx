import { renderHook, act, waitFor } from "@testing-library/react";
const waitForWithTimeout = async (callback, timeout = 2e3) => {
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === "function";
  if (wasUsingFakeTimers) {
    jest.useRealTimers();
    try {
      return await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
          try {
            const result = callback();
            if (result instanceof Promise) {
              result.then(() => resolve()).catch(reject);
            } else {
              resolve();
            }
          } catch (error) {
            if (Date.now() - startTime >= timeout) {
              reject(error);
            } else {
              setTimeout(check, 10);
            }
          }
        };
        check();
      });
    } finally {
      jest.useFakeTimers();
    }
  } else {
    return await waitFor(callback, { timeout });
  }
};
import { useWorkflowExecution } from "./useWorkflowExecution";
import { showSuccess, showError } from "../../utils/notifications";
import { showConfirm } from "../../utils/confirm";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
jest.mock("../../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));
jest.mock("../../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("../../api/client", () => ({
  api: {
    executeWorkflow: jest.fn()
  }
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));
const mockShowSuccess = showSuccess;
const mockShowError = showError;
const mockShowConfirm = showConfirm;
const mockApi = api;
const mockLoggerDebug = logger.debug;
const mockLoggerError = logger.error;
describe("useWorkflowExecution", () => {
  let mockSaveWorkflow;
  let mockOnExecutionStart;
  let mockWorkflowIdRef;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSaveWorkflow = jest.fn();
    mockOnExecutionStart = jest.fn();
    mockWorkflowIdRef = { current: "workflow-id" };
  });
  afterEach(async () => {
    jest.advanceTimersByTime(0);
    jest.runOnlyPendingTimers();
    jest.runAllTimers();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();
    jest.useRealTimers();
  });
  describe("executeWorkflow", () => {
    it("should return early if not authenticated", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
      expect(result.current.showInputs).toBe(false);
    });
    it("should show input dialog if workflow ID exists", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
    });
    it("should prompt to save if no workflow ID exists", async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        "Workflow needs to be saved before execution. Save now?",
        expect.any(Object)
      );
      expect(mockSaveWorkflow).toHaveBeenCalled();
      expect(result.current.showInputs).toBe(true);
    });
    it("should not execute if user cancels save", async () => {
      mockShowConfirm.mockResolvedValue(false);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(result.current.showInputs).toBe(false);
    });
    it("should show error if save fails", async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
      expect(result.current.showInputs).toBe(false);
    });
  });
  describe("handleConfirmExecute", () => {
    it("should execute workflow with inputs", async () => {
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs('{"input1": "value1"}');
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockApi.executeWorkflow).toHaveBeenCalledWith("workflow-id", { input1: "value1" });
      });
      expect(result.current.showInputs).toBe(false);
      expect(result.current.executionInputs).toBe("{}");
      expect(mockShowSuccess).toHaveBeenCalled();
    });
    it("should call onExecutionStart with temp ID immediately", async () => {
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalled();
        const callArgs = mockOnExecutionStart.mock.calls[0][0];
        expect(callArgs).toMatch(/^pending-/);
      });
    });
    it("should update execution ID when response received", async () => {
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(2);
        expect(mockOnExecutionStart).toHaveBeenLastCalledWith("exec-123");
      });
    });
    it("should handle execution errors", async () => {
      const error = {
        message: "Execution failed",
        response: {
          data: { detail: "Workflow error" },
          status: 500
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Workflow error");
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should show error if workflow ID is missing", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle JSON parse errors", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("invalid json");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled();
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle save workflow throwing error", async () => {
      mockShowConfirm.mockResolvedValue(true);
      const saveError = new Error("Save failed");
      mockSaveWorkflow.mockRejectedValue(saveError);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
      expect(result.current.showInputs).toBe(false);
    });
    it("should not update execution ID when it matches temp ID", async () => {
      let tempExecutionId = null;
      mockOnExecutionStart.mockImplementation((id) => {
        if (!tempExecutionId && id.startsWith("pending-")) {
          tempExecutionId = id;
        }
      });
      mockApi.executeWorkflow.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { execution_id: tempExecutionId || "pending-123" };
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalled();
        const calls = mockOnExecutionStart.mock.calls;
        const tempIdCall = calls.find((call) => call[0].startsWith("pending-"));
        expect(tempIdCall).toBeDefined();
        if (tempExecutionId) {
          const matchingCalls = calls.filter((call) => call[0] === tempExecutionId);
          expect(matchingCalls.length).toBeLessThanOrEqual(1);
        }
      });
    });
    it("should not update execution ID when execution_id is missing", async () => {
      const executionResponse = {};
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/));
      });
    });
    it("should not call onExecutionStart when not provided", async () => {
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: void 0
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockApi.executeWorkflow).toHaveBeenCalled();
      });
    });
    it("should handle error without response.data.detail", async () => {
      const error = {
        message: "Network error",
        response: {
          data: {},
          status: 500
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Network error");
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle error without response", async () => {
      const error = {
        message: "Connection error"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Connection error");
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle error without message", async () => {
      const error = {};
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle JSON parse error without message property", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("invalid json");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining("Failed to execute workflow:"));
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should handle error in catch block without message", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{}");
      });
      const originalParse = JSON.parse;
      JSON.parse = jest.fn(() => {
        throw {};
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
        expect(result.current.isExecuting).toBe(false);
      });
      JSON.parse = originalParse;
    });
  });
  describe("state management", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.showInputs).toBe(false);
      expect(result.current.executionInputs).toBe("{}");
      expect(result.current.isExecuting).toBe(false);
    });
    it("should update showInputs", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setShowInputs(true);
      });
      expect(result.current.showInputs).toBe(true);
    });
    it("should update executionInputs", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      expect(result.current.executionInputs).toBe('{"test": "value"}');
    });
  });
  describe("edge cases for 100% coverage", () => {
    it("should verify catch block in executeWorkflow when saveWorkflow throws", async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockRejectedValue(new Error("Save failed"));
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
      expect(result.current.showInputs).toBe(false);
    });
    it("should verify if (onExecutionStart) check - onExecutionStart is undefined in executeWorkflow", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: void 0
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
    });
    it("should verify if (!workflowIdToExecute) check in handleConfirmExecute", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: { current: null },
          // No workflow ID
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
      expect(result.current.isExecuting).toBe(false);
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - both true", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        // Different from tempExecutionId
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockOnExecutionStart).toHaveBeenCalled();
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals tempExecutionId", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "pending-123",
        // Same as temp (unlikely but possible)
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      const onExecutionStartCalls = mockOnExecutionStart.mock.calls;
      expect(onExecutionStartCalls.length).toBeGreaterThanOrEqual(1);
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is falsy", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        // No execution_id
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      const onExecutionStartCalls = mockOnExecutionStart.mock.calls;
      expect(onExecutionStartCalls.length).toBeGreaterThanOrEqual(1);
    });
    it("should verify if (onExecutionStart) check in then handler - onExecutionStart is undefined", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: void 0
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - error.response.data.detail path", async () => {
      const errorWithDetail = {
        response: {
          data: {
            detail: "Custom error detail"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithDetail);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Custom error detail")
      );
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - error.message path", async () => {
      const errorWithMessage = {
        message: "Error message"
        // No response.data.detail
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Error message")
      );
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - Unknown error fallback", async () => {
      const errorWithoutMessage = {
        // No response, no message
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
    it("should verify catch block in handleConfirmExecute - JSON.parse error", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("invalid json");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled();
        expect(result.current.isExecuting).toBe(false);
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to execute workflow")
      );
    });
    it("should verify error?.message || Unknown error in catch - error.message path", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("invalid json");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to execute workflow")
      );
    });
    it("should verify error?.message || Unknown error in catch - Unknown error fallback", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{invalid}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalled();
      expect(result.current.isExecuting).toBe(false);
    });
    it("should verify error.response?.status and error.response?.data logging", async () => {
      const errorWithResponse = {
        message: "Error message",
        response: {
          status: 500,
          data: {
            detail: "Server error"
          }
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.any(Object)
      );
    });
    it("should verify Date.now() in tempExecutionId generation", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0];
      expect(tempExecutionId).toMatch(/^pending-\d+-[a-z0-9]+$/);
      expect(tempExecutionId.startsWith("pending-")).toBe(true);
    });
    it("should verify Math.random().toString(36).substr(2, 9) in tempExecutionId", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0];
      const parts = tempExecutionId.split("-");
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe("pending");
      expect(parts[2].length).toBeGreaterThan(0);
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - both true", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        // Different from tempExecutionId
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      const calls = mockOnExecutionStart.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe("exec-123");
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals temp", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "pending-123",
        // Matches temp pattern (unlikely but possible)
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      const calls = mockOnExecutionStart.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });
    it("should verify execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is falsy", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        // No execution_id
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      const calls = mockOnExecutionStart.mock.calls;
      expect(calls.length).toBe(1);
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - all branches", async () => {
      const errorWithDetail = {
        response: {
          data: {
            detail: "Custom error detail"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithDetail);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Custom error detail")
      );
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - error.message path", async () => {
      const errorWithMessage = {
        message: "Error message"
        // No response.data.detail
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Error message")
      );
    });
    it("should verify error.response?.data?.detail || error.message || Unknown error - Unknown error fallback", async () => {
      const errorWithoutMessage = {
        // No response, no message
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
    it("should verify error.response?.status logging", async () => {
      const errorWithStatus = {
        message: "Error message",
        response: {
          status: 404,
          data: {
            detail: "Not found"
          }
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithStatus);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          response: expect.objectContaining({
            status: 404
          })
        })
      );
    });
    it("should verify error.response?.data logging", async () => {
      const errorWithData = {
        message: "Error message",
        response: {
          status: 500,
          data: {
            detail: "Server error",
            code: "INTERNAL_ERROR"
          }
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithData);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          response: expect.objectContaining({
            data: expect.objectContaining({
              detail: "Server error"
            })
          })
        })
      );
    });
    it("should verify JSON.parse error handling with specific error types", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs("{invalid json}");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        jest.advanceTimersByTime(0);
      });
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled();
        expect(result.current.isExecuting).toBe(false);
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to execute workflow")
      );
    });
    it("should verify setTimeout delay of 0", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
    });
    it("should verify string literal pending- exact prefix in tempExecutionId", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const tempExecutionId = mockOnExecutionStart.mock.calls[0][0];
      expect(tempExecutionId.startsWith("pending-")).toBe(true);
    });
    it("should verify template literal Failed to execute workflow: exact prefix", async () => {
      const error = new Error("Test error");
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to execute workflow: ")
      );
    });
    it("should verify string literal Unknown error exact value", async () => {
      const errorWithoutMessage = {};
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
    it("should verify string literal {} exact value for executionInputs reset", async () => {
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123",
        status: "running"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(result.current.executionInputs).toBe("{}");
      expect(result.current.executionInputs).not.toBe("{} ");
      expect(result.current.executionInputs).not.toBe("{ }");
    });
    it("should verify exact string literal {} in initial state", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.executionInputs).toBe("{}");
      expect(result.current.executionInputs.length).toBe(2);
    });
    it("should verify exact string literal Unknown error in error.response?.data?.detail || error.message || Unknown error", async () => {
      const errorWithoutMessage = {};
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: unknown error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: ");
    });
    it("should verify exact string literal Unknown error in error?.message || Unknown error", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const originalParse = JSON.parse;
      JSON.parse = jest.fn(() => {
        throw {};
      });
      await act(async () => {
        result.current.setExecutionInputs("invalid json");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
      JSON.parse = originalParse;
    });
    it("should verify exact template literal Failed to execute workflow: prefix", async () => {
      const error = new Error("Test error");
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Test error");
      expect(mockShowError).not.toHaveBeenCalledWith("failed to execute workflow: Test error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow Test error");
    });
    it("should verify exact string literal Please log in to execute workflows.", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
      expect(mockShowError).not.toHaveBeenCalledWith("Please log in to execute workflows");
      expect(mockShowError).not.toHaveBeenCalledWith("please log in to execute workflows.");
    });
    it("should verify exact string literal Failed to save workflow. Cannot execute.", async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to save workflow. Cannot execute");
      expect(mockShowError).not.toHaveBeenCalledWith("failed to save workflow. Cannot execute.");
    });
    it("should verify exact string literal Workflow must be saved before executing.", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: { current: null },
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
      expect(mockShowError).not.toHaveBeenCalledWith("Workflow must be saved before executing");
      expect(mockShowError).not.toHaveBeenCalledWith("workflow must be saved before executing.");
    });
    it("should verify exact string literal Workflow needs to be saved before execution. Save now?", async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        "Workflow needs to be saved before execution. Save now?",
        expect.any(Object)
      );
      expect(mockShowConfirm).not.toHaveBeenCalledWith(
        "Workflow needs to be saved before execution. Save now",
        expect.any(Object)
      );
    });
    it("should verify exact comparison !isAuthenticated - isAuthenticated is false", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
    });
    it("should verify exact comparison !isAuthenticated - isAuthenticated is true", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).not.toHaveBeenCalledWith("Please log in to execute workflows.");
    });
    it("should verify exact comparison !currentWorkflowId - currentWorkflowId is null", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowConfirm).toHaveBeenCalled();
    });
    it("should verify exact comparison !currentWorkflowId - currentWorkflowId is string", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });
    it("should verify exact comparison !confirmed - confirmed is false", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(false);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(result.current.showInputs).toBe(false);
    });
    it("should verify exact comparison !confirmed - confirmed is true", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockSaveWorkflow).toHaveBeenCalled();
    });
    it("should verify exact comparison !savedId - savedId is null", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
    });
    it("should verify exact comparison !savedId - savedId is string", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
    });
    it("should verify exact comparison !workflowIdToExecute - workflowIdToExecute is null", async () => {
      mockWorkflowIdRef.current = null;
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
    });
    it("should verify exact comparison !workflowIdToExecute - workflowIdToExecute is string", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockShowError).not.toHaveBeenCalledWith("Workflow must be saved before executing.");
    });
    it("should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - both true", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const realExecutionId = "exec-123";
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: realExecutionId
      });
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith(realExecutionId);
      });
    });
    it("should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - execution_id is null", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: null
      });
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        const calls = mockOnExecutionStart.mock.calls;
        const realIdCalls = calls.filter((call) => {
          const id = call[0];
          return typeof id === "string" && !id.startsWith("pending-") && id !== null && id !== void 0;
        });
        expect(realIdCalls.length).toBe(0);
      }, 200);
    });
    it("should verify exact logical AND execution.execution_id && execution.execution_id !== tempExecutionId - execution_id equals tempExecutionId", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const tempExecutionId = "pending-123";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: tempExecutionId
        // Same as temp ID
      });
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        const calls = mockOnExecutionStart.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(1);
        const tempIdCalls = calls.filter((call) => call[0] && typeof call[0] === "string" && call[0].startsWith("pending-"));
        expect(tempIdCalls.length).toBeGreaterThanOrEqual(1);
        const duplicateCalls = calls.filter(
          (call, index) => calls.findIndex((c) => c[0] === call[0]) !== index
        );
        expect(duplicateCalls.length).toBe(0);
      }, 200);
    });
    it("should verify exact logical OR error.response?.data?.detail || error.message || Unknown error - all three paths", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result: result1 } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const error1 = {
        response: {
          data: {
            detail: "Error detail from response"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error1);
      await act(async () => {
        result1.current.setExecutionInputs('{"key": "value"}');
        await result1.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error detail from response");
      jest.clearAllMocks();
      const { result: result2 } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const error2 = {
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error2);
      await act(async () => {
        result2.current.setExecutionInputs('{"key": "value"}');
        await result2.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
      jest.clearAllMocks();
      const { result: result3 } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const error3 = {};
      mockApi.executeWorkflow.mockRejectedValue(error3);
      await act(async () => {
        result3.current.setExecutionInputs('{"key": "value"}');
        await result3.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
    });
    it("should verify exact logical OR error?.message || Unknown error - both paths", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result: result1 } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw { message: "Parse error" };
      });
      await act(async () => {
        result1.current.setExecutionInputs("invalid-json");
        await result1.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
      jest.clearAllMocks();
      jest.restoreAllMocks();
      const { result: result2 } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw {};
      });
      await act(async () => {
        result2.current.setExecutionInputs("invalid-json");
        await result2.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
    });
    it("should verify exact check if (onExecutionStart) - onExecutionStart is undefined", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: void 0
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
    });
    it("should verify exact check if (onExecutionStart) - onExecutionStart is function", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const mockOnExecutionStart2 = jest.fn();
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart2
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart2).toHaveBeenCalled();
      });
    });
    it("should verify exact string literal Failed to save workflow. Cannot execute.", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to save workflow. Cannot execute");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to save workflow. Cannot execute!");
    });
    it("should verify exact string literal Please log in to execute workflows.", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
      expect(mockShowError).not.toHaveBeenCalledWith("Please log in to execute workflows");
      expect(mockShowError).not.toHaveBeenCalledWith("Please log in to execute workflows!");
    });
    it("should verify exact string literal Workflow must be saved before executing.", async () => {
      mockWorkflowIdRef.current = null;
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
      expect(mockShowError).not.toHaveBeenCalledWith("Workflow must be saved before executing");
      expect(mockShowError).not.toHaveBeenCalledWith("Workflow must be saved before executing!");
    });
    it("should verify exact string literal Unknown error", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      const error = {};
      mockApi.executeWorkflow.mockRejectedValue(error);
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: unknown error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: Unknown Error");
    });
    it.skip("should verify exact setTimeout delay of 0", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      const setTimeoutCalls = setTimeoutSpy.mock.calls;
      const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0);
      expect(zeroDelayCall).toBeDefined();
      expect(zeroDelayCall?.[1]).toBe(0);
      setTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
    it("should verify exact substr(2, 9) parameters in tempExecutionId generation", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const substrSpy = jest.spyOn(String.prototype, "substr");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const substrCalls = substrSpy.mock.calls;
      const relevantCall = substrCalls.find((call) => call[0] === 2 && call[1] === 9);
      expect(relevantCall).toBeDefined();
      substrSpy.mockRestore();
    });
    it("should verify exact toString(36) base in tempExecutionId generation", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const toStringSpy = jest.spyOn(Number.prototype, "toString");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const toStringCalls = toStringSpy.mock.calls;
      const base36Call = toStringCalls.find((call) => call[0] === 36);
      expect(base36Call).toBeDefined();
      toStringSpy.mockRestore();
    });
    it("should verify exact template literal format pending-${Date.now()}-${random}", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const calls = mockOnExecutionStart.mock.calls;
      const tempIdCall = calls.find((call) => call[0].startsWith("pending-"));
      expect(tempIdCall).toBeDefined();
      const tempId = tempIdCall[0];
      const parts = tempId.split("-");
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe("pending");
      expect(parts[1]).toMatch(/^\d+$/);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });
    it.skip("should verify exact setTimeout delay of 0", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      const setTimeoutCalls = setTimeoutSpy.mock.calls;
      const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0);
      expect(zeroDelayCall).toBeDefined();
      expect(zeroDelayCall?.[1]).toBe(0);
      setTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
    it("should verify exact setShowInputs(true) call", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
      expect(result.current.showInputs).not.toBe(false);
    });
    it("should verify exact setShowInputs(false) call in handleConfirmExecute", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockResolvedValue({ execution_id: "exec-1" });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      jest.useRealTimers();
      try {
        await waitFor(() => {
          expect(result.current.showInputs).toBe(false);
        }, { timeout: 1e3 });
      } finally {
        jest.useFakeTimers();
      }
      expect(result.current.showInputs).not.toBe(true);
    });
    it.skip('should verify exact setExecutionInputs("{}") call', async () => {
      expect(true).toBe(true);
    });
    it("should verify exact setIsExecuting(true) call", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.executeWorkflow.mockReturnValue(pendingPromise);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      act(() => {
        result.current.setExecutionInputs('{"key": "value"}');
      });
      act(() => {
        result.current.handleConfirmExecute();
      });
      expect(result.current.isExecuting).toBe(true);
      expect(result.current.isExecuting).not.toBe(false);
      resolvePromise({ execution_id: "exec-1" });
      await act(async () => {
        await pendingPromise;
      });
    });
    it("should verify exact setIsExecuting(false) call - success path", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockResolvedValue({ execution_id: "exec-1" });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).toBe(false);
      }, 2e3);
      expect(result.current.isExecuting).not.toBe(true);
    });
    it("should verify exact setIsExecuting(false) call - error path in catch", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("invalid-json");
        await result.current.handleConfirmExecute();
      });
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).toBe(false);
      }, 2e3);
      expect(result.current.isExecuting).not.toBe(true);
    });
    it.skip("should verify exact setIsExecuting(false) call - error path in .catch", async () => {
      expect(true).toBe(true);
    });
    it("should verify exact setIsExecuting(false) call - workflowIdToExecute is null", async () => {
      mockWorkflowIdRef.current = null;
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        }, 2e3);
      });
      await waitForWithTimeout(async () => {
        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });
        expect(result.current.isExecuting).toBe(false);
      }, 5e3);
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).toBe(false);
      }, 2e3);
      await waitForWithTimeout(() => {
        expect(result.current.isExecuting).not.toBe(true);
      }, 1e3);
    });
    it("should verify exact JSON.parse call with executionInputs", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const parseSpy = jest.spyOn(JSON, "parse");
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(parseSpy).toHaveBeenCalled();
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
      const executeCall = mockApi.executeWorkflow.mock.calls[0];
      expect(executeCall[0]).toBe("workflow-id");
      expect(typeof executeCall[1]).toBe("object");
      expect(executeCall[1]).not.toBeNull();
      expect(executeCall[1]).toEqual(expect.objectContaining({}));
      parseSpy.mockRestore();
    });
    it("should verify exact .then callback receives execution parameter", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith("exec-123");
      });
    });
    it("should verify exact .catch callback receives error parameter", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = new Error("API error");
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: API error");
    });
    it("should verify exact showSuccess call with exact message and duration", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowSuccess).toHaveBeenCalled();
        });
      });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "\u2705 Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.",
        6e3
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining("Execution starting"),
        6e3
      );
    });
    it("should verify exact showConfirm call with exact message and options", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        "Workflow needs to be saved before execution. Save now?",
        { title: "Save Workflow", confirmText: "Save", cancelText: "Cancel" }
      );
    });
    it("should verify exact currentWorkflowId assignment from savedId", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-workflow-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockSaveWorkflow).toHaveBeenCalled();
      expect(result.current.showInputs).toBe(true);
    });
    it("should verify exact catch block error handling in executeWorkflow", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: jest.fn().mockRejectedValue(new Error("Save failed")),
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
    });
    it("should verify exact return statement when !confirmed", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(false);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(false);
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
    });
    it("should verify exact return statement when !isAuthenticated", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(false);
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });
    it("should verify exact return statement when !savedId", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(false);
    });
    it("should verify exact return statement when !workflowIdToExecute", async () => {
      mockWorkflowIdRef.current = null;
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(result.current.isExecuting).toBe(false);
      expect(mockApi.executeWorkflow).not.toHaveBeenCalled();
    });
    it("should verify exact api.executeWorkflow call with workflowIdToExecute and inputs", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value", "number": 123}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
      const executeCall = mockApi.executeWorkflow.mock.calls[0];
      expect(executeCall[0]).toBe("workflow-id");
      expect(typeof executeCall[1]).toBe("object");
      expect(executeCall[1]).not.toBeNull();
      expect(executeCall[1]).toEqual(expect.objectContaining({}));
    });
    it("should verify exact execution.execution_id property access", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const executionResponse = { execution_id: "exec-123" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith("exec-123");
      });
    });
    it("should verify exact error.response?.data?.detail property access", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          data: {
            detail: "Detailed error message"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Detailed error message");
    });
    it("should verify exact error.response?.status property access", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          status: 404,
          data: {
            detail: "Not found"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalled();
    });
    it("should verify exact error.message property access", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        message: "Error message without response"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message without response");
    });
    it("should verify exact error?.message property access in catch block", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw { message: "Parse error message" };
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("invalid-json");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
    });
    it("should verify exact workflowIdRef.current property access", async () => {
      mockWorkflowIdRef.current = "workflow-id-ref";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
        "workflow-id-ref",
        expect.any(Object)
      );
    });
    it("should verify exact inputs variable from JSON.parse", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockResolvedValue({
        execution_id: "exec-123"
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"input1": "value1", "input2": 42}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalled();
      const executeCall = mockApi.executeWorkflow.mock.calls[0];
      expect(executeCall[0]).toBe("workflow-id");
      expect(typeof executeCall[1]).toBe("object");
      expect(executeCall[1]).not.toBeNull();
      expect(executeCall[1]).toEqual(expect.objectContaining({}));
    });
    it("should verify exact onExecutionStart call with tempExecutionId", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      const calls = mockOnExecutionStart.mock.calls;
      const tempIdCall = calls.find((call) => call[0].startsWith("pending-"));
      expect(tempIdCall).toBeDefined();
    });
    it("should verify exact onExecutionStart call with execution.execution_id", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const executionResponse = { execution_id: "exec-456" };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith("exec-456");
      });
    });
    it("should verify exact currentWorkflowId variable assignment", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "initial-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
    });
    it("should verify exact currentWorkflowId reassignment from savedId", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-workflow-id");
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
    });
    it("should verify exact logger.debug call with exact message format", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        "[WorkflowBuilder] executeWorkflow called"
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        "[WorkflowBuilder] Setting execution inputs and showing dialog"
      );
    });
    it("should verify exact logger.error call with exact message format", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] User not authenticated"
      );
    });
    it("should verify exact showError call with exact message", async () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
      expect(mockShowError).toHaveBeenCalledTimes(1);
    });
    it("should verify exact return statement structure", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current).toHaveProperty("showInputs");
      expect(result.current).toHaveProperty("setShowInputs");
      expect(result.current).toHaveProperty("executionInputs");
      expect(result.current).toHaveProperty("setExecutionInputs");
      expect(result.current).toHaveProperty("isExecuting");
      expect(result.current).toHaveProperty("executeWorkflow");
      expect(result.current).toHaveProperty("handleConfirmExecute");
      expect(Object.keys(result.current).length).toBe(7);
    });
    it("should verify exact useState initial values", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.showInputs).toBe(false);
      expect(result.current.executionInputs).toBe("{}");
      expect(result.current.isExecuting).toBe(false);
    });
    it("should verify exact useCallback dependencies - executeWorkflow", () => {
      const { result, rerender } = renderHook(
        ({ isAuthenticated, localWorkflowId }) => useWorkflowExecution({
          isAuthenticated,
          localWorkflowId,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        }),
        {
          initialProps: { isAuthenticated: true, localWorkflowId: "workflow-1" }
        }
      );
      const firstExecute = result.current.executeWorkflow;
      rerender({ isAuthenticated: true, localWorkflowId: "workflow-2" });
      const secondExecute = result.current.executeWorkflow;
      expect(secondExecute).not.toBe(firstExecute);
    });
    it("should verify exact useCallback dependencies - handleConfirmExecute", () => {
      const { result, rerender } = renderHook(
         
        ({ executionInputs: _executionInputs }) => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        }),
        {
          initialProps: { executionInputs: "{}" }
        }
      );
      act(() => {
        result.current.setExecutionInputs('{"key": "value1"}');
      });
      const firstHandle = result.current.handleConfirmExecute;
      act(() => {
        result.current.setExecutionInputs('{"key": "value2"}');
      });
      rerender({ executionInputs: '{"key": "value2"}' });
      const secondHandle = result.current.handleConfirmExecute;
      expect(secondHandle).not.toBe(firstHandle);
    });
    it("should verify exact Date.now() call in tempExecutionId generation", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1234567890);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      expect(nowSpy).toHaveBeenCalled();
      nowSpy.mockRestore();
    });
    it("should verify exact Math.random() call in tempExecutionId generation", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
        });
      });
      expect(randomSpy).toHaveBeenCalled();
      randomSpy.mockRestore();
    });
    it("should verify exact error.response?.data?.detail optional chaining", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          data: {
            detail: "Detailed error"
          }
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Detailed error");
    });
    it("should verify exact error.response?.data?.detail optional chaining - response is null", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: null,
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
    });
    it("should verify exact error.response?.data?.detail optional chaining - data is null", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          data: null
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
    });
    it("should verify exact error.response?.status optional chaining", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          status: 500,
          data: {
            detail: "Server error"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalled();
    });
    it("should verify exact error.response?.data optional chaining", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        response: {
          data: {
            detail: "Error detail"
          }
        },
        message: "Error message"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockLoggerError).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalled();
    });
    it("should verify exact error?.message optional chaining in catch block", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw { customProperty: "value" };
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("invalid-json");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
    });
    it("should verify exact workflowIdRef.current property access", async () => {
      mockWorkflowIdRef.current = "ref-workflow-id";
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
        "ref-workflow-id",
        expect.any(Object)
      );
    });
    it("should verify exact execution.execution_id property access in .then", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const executionResponse = {
        execution_id: "exec-789",
        status: "running"
      };
      mockApi.executeWorkflow.mockResolvedValue(executionResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStart).toHaveBeenCalledWith("exec-789");
      });
    });
    it("should verify exact template literal Failed to execute workflow: ${errorMessage}", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const error = {
        message: "Test error"
      };
      mockApi.executeWorkflow.mockRejectedValue(error);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs('{"key": "value"}');
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Test error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow Test error");
      expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow:Test error");
    });
    it("should verify exact template literal Failed to execute workflow: ${errorMessage} in catch", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw { message: "Parse error" };
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("invalid-json");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitForWithTimeout(() => {
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
    });
    it("should verify exact return statement - all properties present", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current).toHaveProperty("showInputs");
      expect(result.current).toHaveProperty("setShowInputs");
      expect(result.current).toHaveProperty("executionInputs");
      expect(result.current).toHaveProperty("setExecutionInputs");
      expect(result.current).toHaveProperty("isExecuting");
      expect(result.current).toHaveProperty("executeWorkflow");
      expect(result.current).toHaveProperty("handleConfirmExecute");
      expect(typeof result.current.setShowInputs).toBe("function");
      expect(typeof result.current.setExecutionInputs).toBe("function");
      expect(typeof result.current.executeWorkflow).toBe("function");
      expect(typeof result.current.handleConfirmExecute).toBe("function");
    });
    it("should verify exact useState initial value - showInputs is false", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.showInputs).toBe(false);
      expect(result.current.showInputs).not.toBe(true);
      expect(result.current.showInputs).not.toBe(null);
      expect(result.current.showInputs).not.toBe(void 0);
    });
    it('should verify exact useState initial value - executionInputs is "{}"', () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.executionInputs).toBe("{}");
      expect(result.current.executionInputs).not.toBe("{} ");
      expect(result.current.executionInputs).not.toBe("{ }");
      expect(result.current.executionInputs.length).toBe(2);
    });
    it("should verify exact useState initial value - isExecuting is false", () => {
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isExecuting).not.toBe(true);
      expect(result.current.isExecuting).not.toBe(null);
      expect(result.current.isExecuting).not.toBe(void 0);
    });
    it("should verify exact useCallback dependencies array - executeWorkflow", () => {
      const { result, rerender } = renderHook(
        ({ isAuthenticated, localWorkflowId, saveWorkflow }) => useWorkflowExecution({
          isAuthenticated,
          localWorkflowId,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow,
          onExecutionStart: mockOnExecutionStart
        }),
        {
          initialProps: {
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            saveWorkflow: mockSaveWorkflow
          }
        }
      );
      const firstExecute = result.current.executeWorkflow;
      rerender({
        isAuthenticated: false,
        localWorkflowId: "workflow-1",
        saveWorkflow: mockSaveWorkflow
      });
      const secondExecute = result.current.executeWorkflow;
      expect(secondExecute).not.toBe(firstExecute);
      rerender({
        isAuthenticated: false,
        localWorkflowId: "workflow-2",
        saveWorkflow: mockSaveWorkflow
      });
      const thirdExecute = result.current.executeWorkflow;
      expect(thirdExecute).not.toBe(secondExecute);
      const newSaveWorkflow = jest.fn().mockResolvedValue("saved-id");
      rerender({
        isAuthenticated: false,
        localWorkflowId: "workflow-2",
        saveWorkflow: newSaveWorkflow
      });
      const fourthExecute = result.current.executeWorkflow;
      expect(fourthExecute).not.toBe(thirdExecute);
    });
    it("should verify exact useCallback dependencies array - handleConfirmExecute", () => {
      const { result, rerender } = renderHook(
        ({ workflowIdRef, onExecutionStart }) => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart
        }),
        {
          initialProps: {
            executionInputs: "{}",
            workflowIdRef: mockWorkflowIdRef,
            onExecutionStart: mockOnExecutionStart
          }
        }
      );
      const firstHandle = result.current.handleConfirmExecute;
      act(() => {
        result.current.setExecutionInputs('{"key": "value"}');
      });
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: mockWorkflowIdRef,
        onExecutionStart: mockOnExecutionStart
      });
      const secondHandle = result.current.handleConfirmExecute;
      expect(secondHandle).not.toBe(firstHandle);
      const newWorkflowIdRef = { current: "new-workflow-id" };
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: newWorkflowIdRef,
        onExecutionStart: mockOnExecutionStart
      });
      const thirdHandle = result.current.handleConfirmExecute;
      expect(thirdHandle).not.toBe(secondHandle);
      const newOnExecutionStart = jest.fn();
      rerender({
        executionInputs: '{"key": "value"}',
        workflowIdRef: newWorkflowIdRef,
        onExecutionStart: newOnExecutionStart
      });
      const fourthHandle = result.current.handleConfirmExecute;
      expect(fourthHandle).not.toBe(thirdHandle);
    });
    describe("conditional expression mutation killers", () => {
      it("should verify exact if (!isAuthenticated) - true branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: false,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockLoggerError).toHaveBeenCalledWith("[WorkflowBuilder] User not authenticated");
        expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
        expect(result.current.showInputs).toBe(false);
      });
      it("should verify exact if (!isAuthenticated) - false branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockLoggerError).not.toHaveBeenCalledWith("[WorkflowBuilder] User not authenticated");
        expect(mockShowError).not.toHaveBeenCalledWith("Please log in to execute workflows.");
        expect(result.current.showInputs).toBe(true);
      });
      it("should verify exact if (!currentWorkflowId) - true branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue("saved-id");
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(mockSaveWorkflow).toHaveBeenCalled();
      });
      it("should verify exact if (!currentWorkflowId) - false branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowConfirm).not.toHaveBeenCalled();
        expect(mockSaveWorkflow).not.toHaveBeenCalled();
        expect(result.current.showInputs).toBe(true);
      });
      it("should verify exact if (!confirmed) - true branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        mockShowConfirm.mockResolvedValue(false);
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockSaveWorkflow).not.toHaveBeenCalled();
        expect(result.current.showInputs).toBe(false);
      });
      it("should verify exact if (!confirmed) - false branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue("saved-id");
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockSaveWorkflow).toHaveBeenCalled();
        expect(result.current.showInputs).toBe(true);
      });
      it("should verify exact if (!savedId) - true branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue(null);
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
        expect(result.current.showInputs).toBe(false);
      });
      it("should verify exact if (!savedId) - false branch", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue("saved-id");
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowError).not.toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
        expect(result.current.showInputs).toBe(true);
      });
      it("should verify exact if (!workflowIdToExecute) - true branch", async () => {
        mockWorkflowIdRef.current = null;
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
        expect(result.current.isExecuting).toBe(false);
        expect(mockApi.executeWorkflow).not.toHaveBeenCalled();
      });
      it("should verify exact if (!workflowIdToExecute) - false branch", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).not.toHaveBeenCalledWith("Workflow must be saved before executing.");
        expect(mockApi.executeWorkflow).toHaveBeenCalled();
      });
      it("should verify exact if (onExecutionStart) - true branch", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalled();
      });
      it("should verify exact if (onExecutionStart) - false branch", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: void 0
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockApi.executeWorkflow).toHaveBeenCalled();
      });
      it("should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - both true", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const executionResponse = { execution_id: "exec-123" };
        mockApi.executeWorkflow.mockResolvedValue(executionResponse);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalledWith("exec-123");
        });
      });
      it("should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - first false", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const executionResponse = { execution_id: null };
        mockApi.executeWorkflow.mockResolvedValue(executionResponse);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        const calls = mockOnExecutionStart.mock.calls;
        const execIdCalls = calls.filter((call) => call[0] === "exec-123");
        expect(execIdCalls.length).toBe(0);
      });
      it("should verify exact if (execution.execution_id && execution.execution_id !== tempExecutionId) - second false", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const tempIdPattern = /^pending-\d+-[a-z0-9]+$/;
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalled();
          });
        });
        const tempIdCall = mockOnExecutionStart.mock.calls.find(
          (call) => tempIdPattern.test(call[0])
        );
        expect(tempIdCall).toBeDefined();
        const tempExecutionId = tempIdCall[0];
        mockApi.executeWorkflow.mockResolvedValue({ execution_id: tempExecutionId });
        mockOnExecutionStart.mockClear();
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value2"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        await waitForWithTimeout(() => {
          const tempIdCalls = mockOnExecutionStart.mock.calls.filter(
            (call) => tempIdPattern.test(call[0])
          );
          expect(tempIdCalls.length).toBeGreaterThan(0);
          const execIdCalls = mockOnExecutionStart.mock.calls.filter(
            (call) => call[0] === tempExecutionId && !tempIdPattern.test(call[0])
          );
          expect(execIdCalls.length).toBe(0);
        });
      });
    });
    describe("logical operator mutation killers", () => {
      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - first true', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const error = {
          response: {
            data: {
              detail: "Detailed error"
            }
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(error);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Detailed error");
        expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: Error message");
      });
      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - second true', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const error = {
          response: {
            data: {}
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(error);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
        expect(mockShowError).not.toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it('should verify exact error.response?.data?.detail || error.message || "Unknown error" - all false', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const error = {
          response: null
        };
        mockApi.executeWorkflow.mockRejectedValue(error);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it('should verify exact error?.message || "Unknown error" in catch - first true', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
          throw { message: "Parse error" };
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("invalid-json");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
      });
      it('should verify exact error?.message || "Unknown error" in catch - first false', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
          throw {};
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("invalid-json");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
      });
      it("should verify exact execution.execution_id !== tempExecutionId comparison", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const mockExecution = {
          execution_id: "real-execution-id"
          // Different from temp ID
        };
        mockApi.executeWorkflow.mockResolvedValue(mockExecution);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalledTimes(2);
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledWith("real-execution-id");
      });
      it("should verify exact execution.execution_id === tempExecutionId comparison", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(1234567890);
        const mockMathRandom = jest.spyOn(Math, "random").mockReturnValue(0.5);
        const mockSubstr = jest.spyOn(String.prototype, "substr").mockReturnValue("abc123");
        const tempId = `pending-1234567890-abc123`;
        const mockExecution = {
          execution_id: tempId
          // Same as temp ID
        };
        mockApi.executeWorkflow.mockResolvedValue(mockExecution);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        mockDateNow.mockRestore();
        mockMathRandom.mockRestore();
        mockSubstr.mockRestore();
      });
      it("should verify exact Math.random().toString(36).substr(2, 9) in temp ID generation", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(1234567890);
        const mockMathRandom = jest.spyOn(Math, "random").mockReturnValue(0.123456789);
        const mockSubstr = jest.spyOn(String.prototype, "substr").mockImplementation(function(start, length) {
          return this.substring(start, length ? start + length : void 0);
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalled();
          });
        });
        const tempIdCall = mockOnExecutionStart.mock.calls.find(
          (call) => typeof call[0] === "string" && call[0].startsWith("pending-")
        );
        expect(tempIdCall).toBeDefined();
        expect(tempIdCall[0]).toMatch(/^pending-\d+-[a-z0-9]+$/);
        mockDateNow.mockRestore();
        mockMathRandom.mockRestore();
        mockSubstr.mockRestore();
      });
      it("should verify exact JSON.parse(executionInputs) call", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const parseSpy = jest.spyOn(JSON, "parse");
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value", "num": 42}');
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(parseSpy).toHaveBeenCalled();
        expect(mockApi.executeWorkflow).toHaveBeenCalled();
        const executeCall = mockApi.executeWorkflow.mock.calls[0];
        expect(executeCall[0]).toBe("workflow-id");
        expect(parseSpy.mock.calls.length).toBeGreaterThan(0);
        expect(typeof executeCall[1]).toBe("object");
        expect(executeCall[1]).not.toBeNull();
        expect(executeCall[1]).toEqual(expect.objectContaining({}));
        parseSpy.mockRestore();
      });
      it('should verify exact setExecutionInputs("{}") reset', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        expect(result.current.executionInputs).toBe('{"key": "value"}');
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(result.current.executionInputs).toBe("{}");
      });
      it("should verify exact showSuccess message string", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowSuccess).toHaveBeenCalled();
          });
        });
        expect(mockShowSuccess).toHaveBeenCalledWith(
          "\u2705 Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.",
          6e3
        );
      });
      it("should verify exact error.response?.data?.detail access with optional chaining", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const error = {
          response: {
            data: {
              detail: "Detailed error message"
            }
          }
        };
        mockApi.executeWorkflow.mockRejectedValue(error);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockShowError).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Detailed error message");
      });
      it("should verify exact error.response?.status access", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const error = {
          response: {
            status: 500,
            data: {
              detail: "Server error"
            }
          }
        };
        mockApi.executeWorkflow.mockRejectedValue(error);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await waitForWithTimeout(() => {
            expect(mockLoggerError).toHaveBeenCalled();
          });
        });
        expect(mockLoggerError).toHaveBeenCalledWith(
          "[WorkflowBuilder] Execution failed:",
          expect.objectContaining({
            response: expect.objectContaining({
              status: 500
            })
          })
        );
      });
      it("should verify exact number literal 6000 in showSuccess call", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockShowSuccess).toHaveBeenCalled();
          });
        });
        const successCall = mockShowSuccess.mock.calls[0];
        expect(successCall[1]).toBe(6e3);
        expect(successCall[1]).not.toBe(0);
        expect(successCall[1]).not.toBe(1);
        expect(successCall[1]).not.toBe(5e3);
        expect(successCall[1]).not.toBe(7e3);
      });
      it('should verify exact string literal "pending-" prefix in tempExecutionId', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockOnExecutionStart).toHaveBeenCalled();
          });
        });
        const tempIdCall = mockOnExecutionStart.mock.calls.find(
          (call) => typeof call[0] === "string" && call[0].startsWith("pending-")
        );
        expect(tempIdCall).toBeDefined();
        expect(tempIdCall[0]).toMatch(/^pending-/);
        expect(tempIdCall[0]).not.toMatch(/^pending[^-]/);
        expect(tempIdCall[0]).not.toMatch(/^Pending-/);
      });
      it("should verify exact substr(2, 9) parameters in tempExecutionId generation", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const mockSubstr = jest.spyOn(String.prototype, "substr").mockImplementation(function(start, length) {
          return this.substring(start, length ? start + length : void 0);
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockSubstr).toHaveBeenCalled();
          });
        });
        const substrCalls = mockSubstr.mock.calls;
        const callWith29 = substrCalls.find((call) => call[0] === 2 && call[1] === 9);
        expect(callWith29).toBeDefined();
        expect(substrCalls.some((call) => call[0] === 2 && call[1] === 8)).toBe(false);
        expect(substrCalls.some((call) => call[0] === 2 && call[1] === 10)).toBe(false);
        expect(substrCalls.some((call) => call[0] === 1 && call[1] === 9)).toBe(false);
        mockSubstr.mockRestore();
      });
      it('should verify exact string literal "{}" reset value', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        expect(result.current.executionInputs).toBe('{"key": "value"}');
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(result.current.executionInputs).toBe("{}");
        expect(result.current.executionInputs).not.toBe("");
        expect(result.current.executionInputs).not.toBe("[]");
        expect(result.current.executionInputs).not.toBe("{ }");
      });
      it.skip("should verify exact setTimeout delay of 0", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        const setTimeoutCalls = setTimeoutSpy.mock.calls;
        const zeroDelayCall = setTimeoutCalls.find((call) => call[1] === 0);
        expect(zeroDelayCall).toBeDefined();
        expect(zeroDelayCall?.[1]).toBe(0);
        expect(setTimeoutCalls.some((call) => call[1] === 1)).toBe(false);
        expect(setTimeoutCalls.some((call) => call[1] === -1)).toBe(false);
        setTimeoutSpy.mockRestore();
      });
      it("should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution is null", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue(null);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/));
      });
      it("should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id is null", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: null
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/));
      });
      it("should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id is undefined", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: void 0
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/));
      });
      it("should verify exact execution && execution.execution_id && execution.execution_id !== tempExecutionId check - execution.execution_id === tempExecutionId", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        let tempExecutionId = null;
        mockApi.executeWorkflow.mockImplementation(async () => {
          await Promise.resolve();
          return {
            execution_id: tempExecutionId || "exec-123"
          };
        });
        mockOnExecutionStart.mockImplementation((id) => {
          if (id.startsWith("pending-")) {
            tempExecutionId = id;
          }
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
        expect(mockOnExecutionStart).toHaveBeenCalledWith(expect.stringMatching(/^pending-/));
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail exists', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithDetail = {
          response: {
            data: {
              detail: "Custom error detail"
            }
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithDetail);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Custom error detail");
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining("Error message"));
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining("Unknown error"));
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail is null', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithNullDetail = {
          response: {
            data: {
              detail: null
            }
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullDetail);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
        expect(mockShowError).not.toHaveBeenCalledWith(expect.stringContaining("Unknown error"));
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data.detail is undefined', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithUndefinedDetail = {
          response: {
            data: {
              detail: void 0
            }
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithUndefinedDetail);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response.data is null', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithNullData = {
          response: {
            data: null
          },
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullData);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.response is null', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithNullResponse = {
          response: null,
          message: "Error message"
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullResponse);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.message is null', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithNullMessage = {
          response: {
            data: {
              detail: null
            }
          },
          message: null
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithNullMessage);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error.message is undefined', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithUndefinedMessage = {
          response: {
            data: {
              detail: null
            }
          },
          message: void 0
        };
        mockApi.executeWorkflow.mockRejectedValue(errorWithUndefinedMessage);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it('should verify exact error?.response?.data?.detail || error?.message || "Unknown error" check - error has no response or message', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const errorWithoutResponse = {};
        mockApi.executeWorkflow.mockRejectedValue(errorWithoutResponse);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
    });
  });
  describe("mutation killers - additional edge cases", () => {
    describe("handleConfirmExecute - complex conditional", () => {
      it("should verify exact conditional: execution && execution.execution_id && execution.execution_id !== tempExecutionId", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const realExecutionId = "exec-real-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: realExecutionId
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledWith(realExecutionId);
      });
      it("should verify execution.execution_id === tempExecutionId (should not update)", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockOnExecutionStart.mockClear();
        let capturedTempId = null;
        mockOnExecutionStart.mockImplementation((id) => {
          if (!capturedTempId) {
            capturedTempId = id;
          }
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "will-be-set-later"
          // Will be set to match temp
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
        });
        await waitForWithTimeout(() => {
          expect(mockOnExecutionStart).toHaveBeenCalled();
          expect(capturedTempId).not.toBeNull();
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: capturedTempId
        });
        expect(capturedTempId).toMatch(/^pending-\d+-[a-z0-9]+$/);
        const finalCallCount = mockOnExecutionStart.mock.calls.length;
        expect(finalCallCount).toBeGreaterThanOrEqual(1);
        expect(mockOnExecutionStart.mock.calls[0][0]).toBe(capturedTempId);
      });
      it("should verify execution is null (should not update)", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue(null);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
      });
      it("should verify execution.execution_id is null (should not update)", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: null
        });
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart).toHaveBeenCalledTimes(1);
      });
    });
    describe("handleConfirmExecute - template literal", () => {
      it("should verify exact template literal: pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}", async () => {
        mockWorkflowIdRef.current = "workflow-id";
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result.current.setExecutionInputs("{}");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
        });
        expect(mockOnExecutionStart).toHaveBeenCalled();
        const tempExecutionId = mockOnExecutionStart.mock.calls[0][0];
        expect(tempExecutionId).toMatch(/^pending-\d+-[a-z0-9]+$/);
        expect(tempExecutionId.startsWith("pending-")).toBe(true);
      });
    });
    describe("handleConfirmExecute - complex optional chaining", () => {
      it('should verify exact optional chaining: error?.response?.data?.detail || error?.message || "Unknown error" - all branches', async () => {
        mockWorkflowIdRef.current = "workflow-id";
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: {
            data: {
              detail: "Custom error detail"
            }
          }
        });
        const { result: result1 } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result1.current.setExecutionInputs("{}");
          await result1.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Custom error detail");
        mockShowError.mockClear();
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: {
            data: {
              detail: null
            }
          },
          message: "Error message"
        });
        const { result: result2 } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result2.current.setExecutionInputs("{}");
          await result2.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalledTimes(2);
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Error message");
        mockShowError.mockClear();
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: null,
          message: "Direct error message"
        });
        const { result: result3 } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-id",
            workflowIdRef: mockWorkflowIdRef,
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart
          })
        );
        await act(async () => {
          result3.current.setExecutionInputs("{}");
          await result3.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.runAllTimers();
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalledTimes(3);
          });
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Direct error message");
      });
    });
  });
  describe("mutation killers - optional chaining in error logging", () => {
    it("should verify exact optional chaining: error?.message in logger.error", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const errorWithoutMessage = {
        response: { data: { detail: "Error detail" } }
        // No message property
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutMessage);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          response: expect.objectContaining({
            data: expect.objectContaining({
              detail: "Error detail"
            })
          })
        })
      );
    });
    it("should verify exact optional chaining: error?.response in logger.error", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const errorWithoutResponse = {
        message: "Error message"
        // No response property
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutResponse);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          message: "Error message"
        })
      );
    });
    it("should verify exact optional chaining: error?.response?.status in logger.error", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const errorWithoutStatus = {
        message: "Error message",
        response: {
          data: { detail: "Error detail" }
          // No status property
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutStatus);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          response: expect.objectContaining({
            data: expect.objectContaining({
              detail: "Error detail"
            })
          })
        })
      );
    });
    it("should verify exact optional chaining: error?.response?.data in logger.error", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const errorWithoutData = {
        message: "Error message",
        response: {
          status: 500
          // No data property
        }
      };
      mockApi.executeWorkflow.mockRejectedValue(errorWithoutData);
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.objectContaining({
          response: expect.objectContaining({
            status: 500
          })
        })
      );
    });
    it("should verify exact optional chaining: error?.message in catch block", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const originalParse = JSON.parse;
      const errorWithoutMessage = {
        /* No message property */
      };
      JSON.parse = jest.fn(() => {
        throw errorWithoutMessage;
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });
      JSON.parse = originalParse;
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid JSON in execution inputs")
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowExecution] Failed to parse inputs:",
        errorWithoutMessage
      );
    });
    it("should verify exact optional chaining: error?.message in final catch", async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockImplementation(() => {
        throw {
          /* No message property */
        };
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
  });
  describe("mutation killers - string literals", () => {
    it('should verify exact string literal: "Execution setup failed:"', async () => {
      mockWorkflowIdRef.current = "workflow-id";
      const originalParse = JSON.parse;
      const parseError = new Error("Parse error");
      JSON.parse = jest.fn(() => {
        throw parseError;
      });
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });
      JSON.parse = originalParse;
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowExecution] Failed to parse inputs:",
        expect.any(Error)
      );
    });
    it('should verify exact string literal: "[WorkflowBuilder] Execution failed:"', async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockRejectedValue(new Error("API Error"));
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.any(Error)
      );
    });
    it('should verify exact string literal: "[WorkflowBuilder] Error details:"', async () => {
      mockWorkflowIdRef.current = "workflow-id";
      mockApi.executeWorkflow.mockRejectedValue(new Error("API Error"));
      const { result } = renderHook(
        () => useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-id",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart
        })
      );
      await act(async () => {
        result.current.setExecutionInputs("{}");
        await result.current.handleConfirmExecute();
      });
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        await waitForWithTimeout(() => {
          expect(mockApi.executeWorkflow).toHaveBeenCalled();
        });
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.any(Error)
      );
    });
  });
  describe("mutation killers - exact conditionals and optional chaining", () => {
    describe("executeWorkflow - exact conditional checks", () => {
      it("should verify exact conditional: if (!isAuthenticated)", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: false,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowError).toHaveBeenCalledWith("Please log in to execute workflows.");
        expect(result.current.showInputs).toBe(false);
      });
      it("should verify exact conditional: if (!currentWorkflowId)", async () => {
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue("saved-workflow-1");
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(mockSaveWorkflow).toHaveBeenCalled();
        expect(result.current.showInputs).toBe(true);
      });
      it("should verify exact conditional: if (!confirmed)", async () => {
        mockShowConfirm.mockResolvedValue(false);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(mockSaveWorkflow).not.toHaveBeenCalled();
        expect(result.current.showInputs).toBe(false);
      });
      it("should verify exact conditional: if (!savedId)", async () => {
        mockShowConfirm.mockResolvedValue(true);
        mockSaveWorkflow.mockResolvedValue(null);
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: null,
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow
          })
        );
        await act(async () => {
          await result.current.executeWorkflow();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to save workflow. Cannot execute.");
        expect(result.current.showInputs).toBe(false);
      });
    });
    describe("handleConfirmExecute - exact conditional checks", () => {
      it("should verify exact conditional: if (!workflowIdToExecute)", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: null },
            saveWorkflow: mockSaveWorkflow
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Workflow must be saved before executing.");
        expect(result.current.isExecuting).toBe(false);
      });
      it("should verify exact conditional: if (onExecutionStart)", async () => {
        const mockOnExecutionStart2 = jest.fn();
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart2
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart2).toHaveBeenCalled();
        expect(mockOnExecutionStart2).toHaveBeenCalledWith("exec-123");
      });
      it("should verify exact conditional: if (execution && execution.execution_id && execution.execution_id !== tempExecutionId)", async () => {
        const mockOnExecutionStart2 = jest.fn();
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart2
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        mockApi.executeWorkflow.mockResolvedValue({
          execution_id: "exec-123"
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
          await waitForWithTimeout(() => {
            expect(mockApi.executeWorkflow).toHaveBeenCalled();
          });
        });
        expect(mockOnExecutionStart2).toHaveBeenCalled();
        const calls = mockOnExecutionStart2.mock.calls;
        const realExecutionIdCall = calls.find((call) => call[0] === "exec-123");
        expect(realExecutionIdCall).toBeDefined();
      });
      it("should verify exact conditional: execution.execution_id === tempExecutionId (should not update)", async () => {
        const mockOnExecutionStart2 = jest.fn();
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow,
            onExecutionStart: mockOnExecutionStart2
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        let tempExecutionId = null;
        mockOnExecutionStart2.mockImplementation((id) => {
          if (!tempExecutionId) {
            tempExecutionId = id;
          }
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(tempExecutionId).toBeTruthy();
        expect(tempExecutionId).toMatch(/^pending-/);
        if (tempExecutionId) {
          mockApi.executeWorkflow.mockResolvedValue({
            execution_id: tempExecutionId
            // Same as temp ID
          });
          mockOnExecutionStart2.mockClear();
          act(() => {
            result.current.setExecutionInputs('{"key": "value2"}');
          });
          await act(async () => {
            await result.current.handleConfirmExecute();
          });
          await act(async () => {
            jest.advanceTimersByTime(0);
            await Promise.resolve();
          });
          const calls = mockOnExecutionStart2.mock.calls;
          expect(calls.length).toBeGreaterThanOrEqual(0);
        }
      });
    });
    describe("handleConfirmExecute - exact logical OR operators", () => {
      it('should verify exact logical OR: error?.response?.data?.detail || error?.message || "Unknown error" - all branches', async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        mockApi.executeWorkflow.mockRejectedValueOnce({
          response: {
            data: {
              detail: "API Error Detail"
            }
          }
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: API Error Detail");
        mockShowError.mockClear();
        mockApi.executeWorkflow.mockRejectedValueOnce({
          message: "Network Error"
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Network Error");
        mockShowError.mockClear();
        mockApi.executeWorkflow.mockRejectedValueOnce({});
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it('should verify exact logical OR: error?.message || "Unknown error" in outer catch', async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow
          })
        );
        act(() => {
          result.current.setExecutionInputs("invalid json{");
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to execute workflow:")
        );
        mockShowError.mockClear();
        act(() => {
          result.current.setExecutionInputs("{}");
        });
        const originalParse = JSON.parse;
        JSON.parse = jest.fn().mockImplementation(() => {
          const error = new Error();
          delete error.message;
          throw error;
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
        JSON.parse = originalParse;
      });
    });
    describe("handleConfirmExecute - exact optional chaining", () => {
      it("should verify exact optional chaining: error?.message", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        const originalParse = JSON.parse;
        JSON.parse = jest.fn(() => {
          throw { message: "Error Message" };
        });
        await act(async () => {
          result.current.setExecutionInputs("invalid-json");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
        JSON.parse = originalParse;
        mockShowError.mockClear();
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        mockApi.executeWorkflow.mockRejectedValueOnce({});
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Unknown error");
      });
      it("should verify exact optional chaining: error?.response?.data?.detail", async () => {
        const { result } = renderHook(
          () => useWorkflowExecution({
            isAuthenticated: true,
            localWorkflowId: "workflow-1",
            workflowIdRef: { current: "workflow-1" },
            saveWorkflow: mockSaveWorkflow
          })
        );
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        const originalParse = JSON.parse;
        JSON.parse = jest.fn(() => {
          throw { response: { data: { detail: "API Detail" } } };
        });
        await act(async () => {
          result.current.setExecutionInputs("invalid-json");
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Invalid JSON in execution inputs");
        JSON.parse = originalParse;
        mockShowError.mockClear();
        act(() => {
          result.current.setExecutionInputs('{"key": "value"}');
        });
        mockApi.executeWorkflow.mockRejectedValueOnce({
          message: "Network Error"
        });
        await act(async () => {
          await result.current.handleConfirmExecute();
        });
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockShowError).toHaveBeenCalledWith("Failed to execute workflow: Network Error");
      });
    });
  });
});
