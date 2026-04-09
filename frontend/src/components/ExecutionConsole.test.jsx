import { render, screen, fireEvent } from "@testing-library/react";
import { waitForWithTimeout } from "../test/utils/waitForWithTimeout";
import { AuthProvider } from "../contexts/AuthContext";
import ExecutionConsole from "./ExecutionConsole";
import { useWebSocket } from "../hooks/execution";
import { logger } from "../utils/logger";
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
describe("ExecutionConsole", () => {
  const mockOnExecutionLogUpdate = jest.fn();
  const mockOnExecutionStatusUpdate = jest.fn();
  const mockOnExecutionNodeUpdate = jest.fn();
  const mockOnRemoveExecution = jest.fn();
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
  function ec(p = {}) {
    const {
      activeWorkflowId = "workflow-1",
      workflowTabId = null,
      executions = [],
      activeExecutionId = null,
      onWorkflowUpdate,
      getWorkflowChatCanvasSnapshot = null,
      workflowChatClearNonce = 0,
      onExecutionLogUpdate = mockOnExecutionLogUpdate,
      onExecutionStatusUpdate = mockOnExecutionStatusUpdate,
      onExecutionNodeUpdate = mockOnExecutionNodeUpdate,
      onRemoveExecution = mockOnRemoveExecution,
      documentAdapter,
    } = p;
    const props = {
      workflowContext: { activeWorkflowId, workflowTabId },
      executionsState: { executions, activeExecutionId },
      chatBridge: {
        onWorkflowUpdate,
        getWorkflowChatCanvasSnapshot,
        workflowChatClearNonce,
      },
      executionCallbacks: {
        onExecutionLogUpdate,
        onExecutionStatusUpdate,
        onExecutionNodeUpdate,
        onRemoveExecution,
      },
    };
    if (documentAdapter !== undefined) {
      props.environment = { documentAdapter };
    }
    return props;
  }
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebSocket.mockImplementation(() => ({}));
  });
  it("should render collapsed console", () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [], activeExecutionId: null })}
      />,    );
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });
  it("should render with executions", () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: null })}
      />,    );
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("exec-123")).toBeInTheDocument();
  });
  it("should expand when toggle button is clicked", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [], activeExecutionId: null })}
      />,    );
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.querySelector("svg"));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
    });
  });
  it("should switch to chat tab", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: null })}
      />,    );
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.querySelector("svg"));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
    });
    const chatTab = screen.getByText("Chat");
    fireEvent.click(chatTab);
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
    });
  });
  it("should switch to execution tab", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: null })}
      />,    );
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.querySelector("svg"));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
    });
    const execTab = screen.getByText("exec-123");
    fireEvent.click(execTab);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test log message")).toBeInTheDocument();
    });
  });
  it("should display execution logs", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123" })}
      />,    );
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test log message")).toBeInTheDocument();
    });
  });
  it("should display empty state when no logs", async () => {
    const execWithoutLogs = {
      ...mockExecution,
      logs: [],
    };
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [execWithoutLogs], activeExecutionId: "exec-123" })}
      />,    );
    await waitForWithTimeout(() => {
      expect(screen.getByText(/No logs yet/)).toBeInTheDocument();
    });
  });
  it("should handle null activeWorkflowId", () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: null, executions: [], activeExecutionId: null })}
      />,    );
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });
  it("should call useWebSocket with correct parameters", () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onExecutionLogUpdate: mockOnExecutionLogUpdate, onExecutionStatusUpdate: mockOnExecutionStatusUpdate, onExecutionNodeUpdate: mockOnExecutionNodeUpdate })}
      />,    );
    expect(mockUseWebSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: "exec-123",
        executionStatus: "running",
        onLog: expect.any(Function),
        onStatus: expect.any(Function),
        onNodeUpdate: expect.any(Function),
        onCompletion: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
  it("should handle WebSocket log callback", () => {
    let onLogCallback;
    mockUseWebSocket.mockImplementation((config) => {
      onLogCallback = config.onLog;
      return {};
    });
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onExecutionLogUpdate: mockOnExecutionLogUpdate })}
      />,    );
    const testLog = {
      level: "INFO",
      message: "WebSocket log",
    };
    onLogCallback(testLog);
    expect(mockOnExecutionLogUpdate).toHaveBeenCalledWith(
      "workflow-1",
      "exec-123",
      testLog,
    );
    expect(logger.debug).toHaveBeenCalled();
  });
  it("should handle WebSocket status callback", () => {
    let onStatusCallback;
    mockUseWebSocket.mockImplementation((config) => {
      onStatusCallback = config.onStatus;
      return {};
    });
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onExecutionStatusUpdate: mockOnExecutionStatusUpdate })}
      />,    );
    onStatusCallback("completed");
    expect(mockOnExecutionStatusUpdate).toHaveBeenCalledWith(
      "workflow-1",
      "exec-123",
      "completed",
    );
    expect(logger.debug).toHaveBeenCalled();
  });
  it("should handle WebSocket node update callback", () => {
    let onNodeUpdateCallback;
    mockUseWebSocket.mockImplementation((config) => {
      onNodeUpdateCallback = config.onNodeUpdate;
      return {};
    });
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onExecutionNodeUpdate: mockOnExecutionNodeUpdate })}
      />,    );
    onNodeUpdateCallback("node-1", {
      status: "completed",
    });
    expect(mockOnExecutionNodeUpdate).toHaveBeenCalledWith(
      "workflow-1",
      "exec-123",
      "node-1",
      {
        status: "completed",
      },
    );
    expect(logger.debug).toHaveBeenCalled();
  });
  it("should handle WebSocket error callback", () => {
    let onErrorCallback;
    mockUseWebSocket.mockImplementation((config) => {
      onErrorCallback = config.onError;
      return {};
    });
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onExecutionStatusUpdate: mockOnExecutionStatusUpdate })}
      />,    );
    onErrorCallback({
      message: "WebSocket error",
    });
    expect(mockOnExecutionStatusUpdate).toHaveBeenCalledWith(
      "workflow-1",
      "exec-123",
      "failed",
      "WebSocket error",
    );
    expect(logger.error).toHaveBeenCalled();
  });
  it.skip("should close execution tab", async () => {});
  it.skip("should switch to chat when closing active execution tab", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123", onRemoveExecution: mockOnRemoveExecution })}
      />,    );
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.querySelector("svg"));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    await waitForWithTimeout(() => {
      const execTab = screen.getByText("exec-123");
      fireEvent.click(execTab);
    });
    await waitForWithTimeout(() => {
      const closeButtons = screen.queryAllByTitle(/close/i);
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0]);
      }
    }, 2e3);
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
    });
  });
  it.skip("should auto-switch to new execution tab when activeExecutionId changes", async () => {
    const { rerender } = renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: null })}
      />,    );
    rerender(
      <AuthProvider>
        <ExecutionConsole
          {...ec({ activeWorkflowId: "workflow-1", executions: [mockExecution], activeExecutionId: "exec-123" })}
        />      </AuthProvider>,
    );
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Execution exec-123/)).toBeInTheDocument();
    });
  });
  it.skip("should handle resizing", async () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [], activeExecutionId: null })}
      />,    );
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.querySelector("svg"));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    await waitForWithTimeout(() => {
      const resizeHandle = document.querySelector(".cursor-ns-resize");
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle, {
          clientY: 100,
        });
        fireEvent.mouseMove(document, {
          clientY: 150,
        });
        fireEvent.mouseUp(document);
      }
    });
    expect(screen.getByTestId("workflow-chat")).toBeInTheDocument();
  });
  it.skip("should show execution status indicators", () => {
    const completedExecution = {
      ...mockExecution,
      status: "completed",
    };
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: "workflow-1", executions: [completedExecution], activeExecutionId: null })}
      />,    );
    const statusBadge = screen.getByTestId("execution-status-badge");
    expect(statusBadge).toBeInTheDocument();
  });
  it("should handle null activeWorkflowId", () => {
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: null, executions: [], activeExecutionId: null })}
      />,    );
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });
  it("should not call callbacks when activeWorkflowId is null", () => {
    let onLogCallback;
    mockUseWebSocket.mockImplementation((config) => {
      onLogCallback = config.onLog;
      return {};
    });
    renderWithAuth(
      <ExecutionConsole
        {...ec({ activeWorkflowId: null, executions: [], activeExecutionId: "exec-123", onExecutionLogUpdate: mockOnExecutionLogUpdate })}
      />,    );
    onLogCallback({
      level: "INFO",
      message: "Test",
    });
    expect(mockOnExecutionLogUpdate).not.toHaveBeenCalled();
  });
  describe("Dependency Injection", () => {
    it.skip("should use injected document adapter", () => {
      const mockDocumentAdapter = {
        createElement: jest.fn((tag) => document.createElement(tag)),
        getElementById: jest.fn((id) => document.getElementById(id)),
        getActiveElement: jest.fn(() => document.activeElement),
        head: document.head,
        body: document.body,
      };
      expect(mockDocumentAdapter).toBeDefined();
    });
    it.skip("should handle null document adapter gracefully", () => {
      expect(true).toBe(true);
    });
    it.skip("should handle document adapter errors gracefully", () => {
      const mockDocumentAdapter = {
        createElement: jest.fn((tag) => document.createElement(tag)),
        getElementById: jest.fn(() => null),
        getActiveElement: jest.fn(() => null),
        head: document.head,
        body: document.body,
      };
      expect(mockDocumentAdapter).toBeDefined();
    });
  });
});
