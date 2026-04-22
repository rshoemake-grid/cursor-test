import { renderHook, act, waitFor } from "@testing-library/react";
import { useWorkflowExecution } from "./useWorkflowExecution";
import { showError, showSuccess } from "../../utils/notifications";
import { showConfirm } from "../../utils/confirm";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));
jest.mock("../../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("../../api/client", () => ({
  api: {
    executeWorkflow: jest.fn(),
  },
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
describe("useWorkflowExecution - No Coverage Paths", () => {
  let mockSaveWorkflow;
  let mockOnExecutionStart;
  let mockWorkflowIdRef;
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveWorkflow = jest.fn().mockResolvedValue("saved-workflow-123");
    mockOnExecutionStart = jest.fn();
    mockWorkflowIdRef = { current: "workflow-123" };
    const mockShowConfirm = showConfirm;
    const mockShowError = showError;
    const mockShowSuccess = showSuccess;
    const mockExecuteWorkflow = api.executeWorkflow;
    mockShowConfirm.mockResolvedValue(true);
    mockShowError.mockImplementation(() => {});
    mockShowSuccess.mockImplementation(() => {});
    mockExecuteWorkflow.mockResolvedValue({
      execution_id: "exec-123",
    });
  });
  describe("executeWorkflow - catch block", () => {
    it("should handle saveWorkflow throwing error", async () => {
      mockSaveWorkflow.mockRejectedValue(new Error("Save failed"));
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(showError).toHaveBeenCalledWith(
        "Failed to save workflow. Cannot execute.",
      );
    });
  });
  describe("handleConfirmExecute - catch blocks and optional chaining", () => {
    it("should handle JSON.parse throwing in catch block", async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs("invalid json");
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(showError).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        "[WorkflowExecution] Failed to parse inputs:",
        expect.any(Error),
      );
      expect(logger.error).toHaveBeenCalledWith(
        "[WorkflowBuilder] Execution failed:",
        expect.any(Error),
      );
    });
    it("should handle api.executeWorkflow error with optional chaining", async () => {
      const mockError = {
        response: {
          data: {
            detail: "API error detail",
          },
          status: 500,
        },
        message: "Network error",
      };
      api.executeWorkflow.mockRejectedValue(mockError);
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(showError).toHaveBeenCalledWith(
        "Failed to execute workflow: API error detail",
      );
    });
    it("should handle api.executeWorkflow error without response.data", async () => {
      const mockError = {
        message: "Network error",
      };
      api.executeWorkflow.mockRejectedValue(mockError);
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(showError).toHaveBeenCalledWith(
        "Failed to execute workflow: Network error",
      );
    });
    it("should handle api.executeWorkflow error without message", async () => {
      const mockError = {};
      api.executeWorkflow.mockRejectedValue(mockError);
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(showError).toHaveBeenCalledWith(
        "Failed to execute workflow: Unknown error",
      );
    });
    it("should handle unhandled promise rejection catch block", async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      const mockExecuteWorkflow = api.executeWorkflow;
      mockExecuteWorkflow.mockImplementation(() => {
        return Promise.reject(new Error("Execution failed"));
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(showError).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
    it("should verify finally block executes", async () => {
      const mockExecuteWorkflow = api.executeWorkflow;
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: "exec-123",
      });
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
      });
    });
    it("should verify optional chaining - onExecutionStart is undefined", async () => {
      const mockExecuteWorkflow = api.executeWorkflow;
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: "exec-123",
      });
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: void 0,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(showSuccess).toHaveBeenCalled();
      expect(mockOnExecutionStart).not.toHaveBeenCalled();
    });
    it("should verify logical AND - execution && execution.execution_id", async () => {
      const mockExecuteWorkflow = api.executeWorkflow;
      mockExecuteWorkflow.mockResolvedValue({
        execution_id: "exec-123",
      });
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      await act(async () => {
        result.current.handleConfirmExecute();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockOnExecutionStart).toHaveBeenCalledWith(
        "exec-123",
        "workflow-123",
      );
    });
  });
  describe("executeWorkflow - authentication and validation paths", () => {
    it("should handle user not authenticated - logger.error and showError (lines 58-61)", async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: false,
          localWorkflowId: "workflow-123",
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(logger.error).toHaveBeenCalledWith(
        "[WorkflowBuilder] User not authenticated",
      );
      expect(showError).toHaveBeenCalledWith(
        "Please log in to execute workflows.",
      );
    });
    it("should handle user canceling save confirmation (lines 75-76)", async () => {
      const mockShowConfirm = showConfirm;
      mockShowConfirm.mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          // No workflow ID, will prompt to save
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(result.current.showInputs).toBe(false);
    });
    it("should handle workflow save returning invalid ID (lines 79-84)", async () => {
      const mockShowConfirm = showConfirm;
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue(null);
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(showError).toHaveBeenCalledWith(
        "Failed to save workflow. Cannot execute.",
      );
      expect(result.current.showInputs).toBe(false);
    });
    it("should assign savedId to currentWorkflowId when save succeeds (line 84)", async () => {
      const mockShowConfirm = showConfirm;
      mockShowConfirm.mockResolvedValue(true);
      mockSaveWorkflow.mockResolvedValue("saved-workflow-456");
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: null,
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
      expect(mockSaveWorkflow).toHaveBeenCalled();
    });
    it("should set showInputs to true when workflow ID exists (lines 90-92)", async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          // Has workflow ID
          workflowIdRef: mockWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      await act(async () => {
        await result.current.executeWorkflow();
      });
      expect(result.current.showInputs).toBe(true);
    });
  });
  describe("handleConfirmExecute - validation paths", () => {
    it("should handle no workflow ID found (lines 129-132)", async () => {
      const emptyWorkflowIdRef = { current: null };
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: emptyWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      await act(async () => {
        await result.current.handleConfirmExecute();
      });
      expect(logger.error).toHaveBeenCalledWith(
        "[WorkflowBuilder] No workflow ID found - workflow must be saved",
      );
      expect(showError).toHaveBeenCalledWith(
        "Workflow must be saved before executing.",
      );
    });
    it("should throw error when workflowIdToExecute is null (lines 137-138)", async () => {
      const emptyWorkflowIdRef = { current: null };
      const mockExecuteWorkflow = api.executeWorkflow;
      mockExecuteWorkflow.mockResolvedValue({ execution_id: "exec-123" });
      const { result } = renderHook(() =>
        useWorkflowExecution({
          isAuthenticated: true,
          localWorkflowId: "workflow-123",
          workflowIdRef: emptyWorkflowIdRef,
          saveWorkflow: mockSaveWorkflow,
          onExecutionStart: mockOnExecutionStart,
        }),
      );
      act(() => {
        result.current.setExecutionInputs('{"test": "value"}');
      });
      await act(async () => {
        await result.current.handleConfirmExecute();
      });
      expect(showError).toHaveBeenCalledWith(
        "Workflow must be saved before executing.",
      );
    });
  });
});
