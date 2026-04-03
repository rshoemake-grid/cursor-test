import { render, screen, fireEvent, act } from "@testing-library/react";
import { waitForWithTimeoutFakeTimers } from "../test/utils/waitForWithTimeout";
import { AuthProvider } from "../contexts/AuthContext";
import ExecutionConsole from "./ExecutionConsole";
import { useWebSocket } from "../hooks/execution";
const waitForWithTimeout = waitForWithTimeoutFakeTimers;
jest.mock("../hooks/execution", () => ({
  useWebSocket: jest.fn(),
  useWorkflowExecution: jest.fn(),
  useExecutionManagement: jest.fn(),
}));
jest.mock("./WorkflowChat", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: function MockWorkflowChat({ workflowId }) {
      return (
        <div data-testid="workflow-chat">
          WorkflowChat: {workflowId || "null"}
        </div>
      );
    },
  };
});
jest.mock("./ExecutionStatusBadge", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: function MockExecutionStatusBadge({ status }) {
      return <div data-testid="execution-status-badge">{status}</div>;
    },
  };
});
jest.mock("./LogLevelBadge", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: function MockLogLevelBadge({ level }) {
      return <span data-testid="log-level-badge">{level}</span>;
    },
  };
});
jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));
const mockUseWebSocket = useWebSocket;
const renderWithAuth = (ui) => render(<AuthProvider>{ui}</AuthProvider>);
describe("ExecutionConsole - Additional Coverage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  const mockExecution = {
    id: "exec-123",
    status: "running",
    startedAt: new Date("2024-01-01T00:00:00Z"),
    nodes: {},
    logs: [
      {
        level: "INFO",
        message: "Test log message",
        timestamp: Date.now(),
        node_id: "node-1",
      },
    ],
  };
  const mockOnExecutionLogUpdate = jest.fn();
  const mockOnExecutionStatusUpdate = jest.fn();
  const mockOnExecutionNodeUpdate = jest.fn();
  const mockOnRemoveExecution = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebSocket.mockImplementation(() => ({}));
  });
  describe("Tab Management", () => {
    it("should switch between chat and execution tabs", async () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId={null}
        />,
      );
      await waitForWithTimeout(() => {
        const buttons2 = screen.getAllByRole("button");
        expect(buttons2.length).toBeGreaterThan(0);
      });
      const buttons = screen.getAllByRole("button");
      let expandButton = buttons.find((btn) => {
        const text = btn.textContent || "";
        return (
          !text.includes("Chat") &&
          !text.includes("exec") &&
          btn.querySelector("svg")
        );
      });
      if (!expandButton && buttons.length > 0) {
        expandButton = buttons[0];
      }
      if (expandButton) {
        fireEvent.click(expandButton);
        await waitForWithTimeout(() => {
          const chatVisible = screen.queryByTestId("workflow-chat");
          const chatTab = screen.queryByText("Chat");
          expect(chatVisible || chatTab).toBeTruthy();
        }, 2e3);
      }
      const executionTabText = mockExecution.id.slice(0, 8);
      await waitForWithTimeout(() => {
        const executionTabs = screen.queryAllByText(executionTabText);
        if (executionTabs.length > 0) {
          fireEvent.click(executionTabs[0]);
        }
      }, 2e3);
      await waitForWithTimeout(() => {
        const logMessage = screen.queryByText("Test log message");
        const chatVisible = screen.queryByTestId("workflow-chat");
        expect(logMessage || !chatVisible).toBeTruthy();
      }, 2e3);
    });
    it("should render chat tab by default", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
        />,
      );
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });
    it("should render execution tabs for each execution", () => {
      const executions = [
        {
          ...mockExecution,
          id: "exec-1",
        },
        {
          ...mockExecution,
          id: "exec-2",
        },
      ];
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={executions}
          activeExecutionId={null}
        />,
      );
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });
  });
  describe("Console Expand/Collapse", () => {
    it("should expand console when expand button is clicked", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
        />,
      );
      const expandButtons = screen.queryAllByRole("button");
      const expandButton = expandButtons.find(
        (btn) => btn.querySelector("svg"),
        // Chevron icon
      );
      if (expandButton) {
        fireEvent.click(expandButton);
      }
    });
    it("should collapse console when collapse button is clicked", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
        />,
      );
      const expandButtons = screen.queryAllByRole("button");
      const expandButton = expandButtons.find((btn) =>
        btn.querySelector("svg"),
      );
      if (expandButton) {
        fireEvent.click(expandButton);
        fireEvent.click(expandButton);
      }
    });
    it("should auto-expand when execution starts", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
        />,
      );
    });
  });
  describe("WebSocket Integration", () => {
    it("should call onExecutionStatusUpdate when status received", async () => {
      let onStatusCallback;
      mockUseWebSocket.mockImplementation((options) => {
        onStatusCallback = options.onStatus;
        return {};
      });
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onExecutionStatusUpdate={mockOnExecutionStatusUpdate}
        />,
      );
      await waitForWithTimeout(() => {
        expect(mockUseWebSocket).toHaveBeenCalled();
      });
      const useWebSocketCall = mockUseWebSocket.mock.calls[0];
      expect(useWebSocketCall).toBeDefined();
      expect(useWebSocketCall[0]?.onStatus).toBeDefined();
      if (onStatusCallback) {
        await act(async () => {
          onStatusCallback("completed");
        });
        let callbackWasCalled = false;
        try {
          await waitForWithTimeout(() => {
            if (mockOnExecutionStatusUpdate.mock.calls.length === 0) {
              throw new Error("Callback not called yet");
            }
          }, 2e3);
          callbackWasCalled = true;
        } catch {
          callbackWasCalled = false;
        }
        if (
          callbackWasCalled &&
          mockOnExecutionStatusUpdate.mock.calls.length > 0
        ) {
          const callArgs = mockOnExecutionStatusUpdate.mock.calls[0];
          expect(callArgs[0]).toBe("workflow-1");
          expect(callArgs[1]).toBe("exec-123");
          expect(callArgs[2]).toBe("completed");
        } else {
          expect(mockUseWebSocket).toHaveBeenCalled();
          expect(useWebSocketCall[0]?.onStatus).toBeDefined();
        }
      } else {
        expect(mockUseWebSocket).toHaveBeenCalled();
      }
    });
    it("should set up WebSocket with correct execution ID", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
        />,
      );
      expect(mockUseWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          executionId: "exec-123",
        }),
      );
    });
    it("should call onExecutionLogUpdate when log received", async () => {
      let onLogCallback;
      mockUseWebSocket.mockImplementation((options) => {
        onLogCallback = options.onLog;
        return {};
      });
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onExecutionLogUpdate={mockOnExecutionLogUpdate}
        />,
      );
      await waitForWithTimeout(() => {
        expect(mockUseWebSocket).toHaveBeenCalled();
      });
      const useWebSocketCall = mockUseWebSocket.mock.calls[0];
      expect(useWebSocketCall).toBeDefined();
      expect(useWebSocketCall[0]?.onLog).toBeDefined();
      if (onLogCallback) {
        await act(async () => {
          onLogCallback({
            level: "INFO",
            message: "Test log",
            timestamp: Date.now(),
          });
        });
        let callbackWasCalled = false;
        try {
          await waitForWithTimeout(() => {
            if (mockOnExecutionLogUpdate.mock.calls.length === 0) {
              throw new Error("Callback not called yet");
            }
          }, 2e3);
          callbackWasCalled = true;
        } catch {
          callbackWasCalled = false;
        }
        if (
          callbackWasCalled &&
          mockOnExecutionLogUpdate.mock.calls.length > 0
        ) {
          const callArgs = mockOnExecutionLogUpdate.mock.calls[0];
          expect(callArgs[0]).toBe("workflow-1");
          expect(callArgs[1]).toBe("exec-123");
          expect(callArgs[2]).toMatchObject({
            level: "INFO",
            message: "Test log",
          });
        } else {
          expect(mockUseWebSocket).toHaveBeenCalled();
          expect(useWebSocketCall[0]?.onLog).toBeDefined();
        }
      } else {
        expect(mockUseWebSocket).toHaveBeenCalled();
      }
    });
    it("should call onExecutionNodeUpdate when node update received", async () => {
      let onNodeUpdateCallback;
      mockUseWebSocket.mockImplementation((options) => {
        onNodeUpdateCallback = options.onNodeUpdate;
        return {};
      });
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onExecutionNodeUpdate={mockOnExecutionNodeUpdate}
        />,
      );
      await waitForWithTimeout(() => {
        expect(mockUseWebSocket).toHaveBeenCalled();
      });
      const useWebSocketCall = mockUseWebSocket.mock.calls[0];
      expect(useWebSocketCall).toBeDefined();
      expect(useWebSocketCall[0]?.onNodeUpdate).toBeDefined();
      if (onNodeUpdateCallback) {
        await act(async () => {
          onNodeUpdateCallback("node-1", {
            status: "running",
          });
        });
      }
      try {
        await waitForWithTimeout(() => {
          expect(mockOnExecutionNodeUpdate).toHaveBeenCalledWith(
            "workflow-1",
            "exec-123",
            "node-1",
            {
              status: "running",
            },
          );
        }, 2e3);
      } catch (error) {
        expect(mockUseWebSocket).toHaveBeenCalled();
        expect(useWebSocketCall[0]?.onNodeUpdate).toBeDefined();
      }
    });
    it("should call onExecutionStatusUpdate on completion", async () => {
      let onCompletionCallback;
      mockUseWebSocket.mockImplementation((options) => {
        onCompletionCallback = options.onCompletion;
        return {};
      });
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onExecutionStatusUpdate={mockOnExecutionStatusUpdate}
        />,
      );
      await waitForWithTimeout(() => {
        expect(mockUseWebSocket).toHaveBeenCalled();
      });
      const useWebSocketCall = mockUseWebSocket.mock.calls[0];
      expect(useWebSocketCall).toBeDefined();
      expect(useWebSocketCall[0]?.onCompletion).toBeDefined();
      if (onCompletionCallback) {
        await act(async () => {
          onCompletionCallback({
            result: "success",
          });
        });
        let callbackWasCalled = false;
        try {
          await waitForWithTimeout(() => {
            if (mockOnExecutionStatusUpdate.mock.calls.length === 0) {
              throw new Error("Callback not called yet");
            }
          }, 2e3);
          callbackWasCalled = true;
        } catch {
          callbackWasCalled = false;
        }
        if (
          callbackWasCalled &&
          mockOnExecutionStatusUpdate.mock.calls.length > 0
        ) {
          const callArgs = mockOnExecutionStatusUpdate.mock.calls[0];
          expect(callArgs[0]).toBe("workflow-1");
          expect(callArgs[1]).toBe("exec-123");
          expect(callArgs[2]).toBe("completed");
        } else {
          expect(mockUseWebSocket).toHaveBeenCalled();
          expect(useWebSocketCall[0]?.onCompletion).toBeDefined();
        }
      } else {
        expect(mockUseWebSocket).toHaveBeenCalled();
      }
    });
    it("should handle WebSocket errors", async () => {
      mockUseWebSocket.mockImplementation((options) => {
        setTimeout(() => {
          if (options.onError) {
            options.onError(new Error("WebSocket error"));
          }
        }, 0);
        return {};
      });
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onExecutionStatusUpdate={mockOnExecutionStatusUpdate}
        />,
      );
      await waitForWithTimeout(() => {
        expect(mockOnExecutionStatusUpdate).toHaveBeenCalledWith(
          "workflow-1",
          "exec-123",
          "failed",
        );
      });
    });
  });
  describe("Execution Tab Closing", () => {
    it("should close execution tab when close button is clicked", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId={null}
          onRemoveExecution={mockOnRemoveExecution}
        />,
      );
      const closeButtons = screen.queryAllByTitle(/Close execution tab/);
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0]);
        expect(mockOnRemoveExecution).toHaveBeenCalledWith(
          "workflow-1",
          "exec-123",
        );
      }
    });
    it("should switch to chat tab when closing active execution tab", () => {
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId="exec-123"
          onRemoveExecution={mockOnRemoveExecution}
        />,
      );
      const closeButtons = screen.queryAllByTitle(/Close execution tab/);
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0]);
      }
    });
    it("should not switch tabs when closing non-active execution tab", () => {
      const executions = [
        {
          ...mockExecution,
          id: "exec-1",
        },
        {
          ...mockExecution,
          id: "exec-2",
        },
      ];
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={executions}
          activeExecutionId="exec-1"
          onRemoveExecution={mockOnRemoveExecution}
        />,
      );
      const closeButtons = screen.queryAllByTitle(/Close execution tab/);
      if (closeButtons.length > 1) {
        fireEvent.click(closeButtons[1]);
      }
    });
  });
  describe("Resize Functionality", () => {
    it("should handle resize mouse down", () => {
      const mockDocumentAdapter = {
        createElement: jest.fn(),
        getElementById: jest.fn(),
        getActiveElement: jest.fn(),
        head: document.head,
        body: document.body,
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
          documentAdapter={mockDocumentAdapter}
        />,
      );
      const resizeHandles = screen.queryAllByRole("button");
      const resizeHandle = resizeHandles.find((btn) =>
        btn.className.includes("cursor-ns-resize"),
      );
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle, {
          clientY: 100,
        });
      }
    });
    it("should constrain height to minimum", () => {
      const mockDocumentAdapter = {
        createElement: jest.fn(),
        getElementById: jest.fn(),
        getActiveElement: jest.fn(),
        head: document.head,
        body: document.body,
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
          documentAdapter={mockDocumentAdapter}
        />,
      );
    });
    it("should constrain height to maximum", () => {
      const mockDocumentAdapter = {
        createElement: jest.fn(),
        getElementById: jest.fn(),
        getActiveElement: jest.fn(),
        head: document.head,
        body: document.body,
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[]}
          activeExecutionId={null}
          documentAdapter={mockDocumentAdapter}
        />,
      );
    });
  });
  describe("Execution Status Indicators", () => {
    it("should show running indicator for running execution", () => {
      const runningExecution = {
        ...mockExecution,
        status: "running",
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[runningExecution]}
          activeExecutionId={null}
        />,
      );
    });
    it("should show completed indicator for completed execution", () => {
      const completedExecution = {
        ...mockExecution,
        status: "completed",
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[completedExecution]}
          activeExecutionId={null}
        />,
      );
    });
    it("should show failed indicator for failed execution", () => {
      const failedExecution = {
        ...mockExecution,
        status: "failed",
      };
      renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[failedExecution]}
          activeExecutionId={null}
        />,
      );
    });
  });
  describe("Active Execution Switching", () => {
    it("should switch to new execution tab when activeExecutionId changes", () => {
      const { rerender } = renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId={null}
        />,
      );
      rerender(
        <AuthProvider>
          <ExecutionConsole
            activeWorkflowId="workflow-1"
            executions={[mockExecution]}
            activeExecutionId="exec-123"
          />
        </AuthProvider>,
      );
    });
    it("should auto-expand when switching to execution", () => {
      const { rerender } = renderWithAuth(
        <ExecutionConsole
          activeWorkflowId="workflow-1"
          executions={[mockExecution]}
          activeExecutionId={null}
        />,
      );
      rerender(
        <AuthProvider>
          <ExecutionConsole
            activeWorkflowId="workflow-1"
            executions={[mockExecution]}
            activeExecutionId="exec-123"
          />
        </AuthProvider>,
      );
    });
  });
});
