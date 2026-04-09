import { render, screen, fireEvent } from "@testing-library/react";
import ExecutionDetailsModal from "./ExecutionDetailsModal";
import { api } from "../../api/client";

describe("ExecutionDetailsModal", () => {
  const mockExecution = {
    execution_id: "exec-123",
    workflow_id: "workflow-456",
    status: "completed",
    started_at: "2024-01-01T10:00:00Z",
    completed_at: "2024-01-01T10:00:05Z",
    node_states: {
      "node-1": {
        status: "completed",
        output: "Result 1",
      },
      "node-2": {
        status: "completed",
        output: "Result 2",
      },
    },
    variables: {
      var1: "value1",
      var2: "value2",
    },
    logs: ["Log entry 1", "Log entry 2"],
  };
  const mockOnClose = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(api, "getExecution").mockResolvedValue(mockExecution);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should not render when isOpen is false", () => {
    const { container } = render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={false}
        onClose={mockOnClose}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
  it("should not render when execution is null", () => {
    const { container } = render(
      <ExecutionDetailsModal
        execution={null}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
  it("should render when isOpen is true and execution is provided", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Execution Details")).toBeInTheDocument();
    expect(screen.getByText("exec-123")).toBeInTheDocument();
  });
  it("should display execution ID", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("exec-123")).toBeInTheDocument();
  });
  it("should display workflow ID", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("workflow-456")).toBeInTheDocument();
  });
  it("should display timestamps", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/Started At/)).toBeInTheDocument();
    expect(screen.getByText(/Completed At/)).toBeInTheDocument();
  });
  it("should display node states", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("node-1")).toBeInTheDocument();
    expect(screen.getByText("node-2")).toBeInTheDocument();
    expect(screen.getByText("Result 1")).toBeInTheDocument();
    expect(screen.getByText("Result 2")).toBeInTheDocument();
  });
  it("should display logs", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Log entry 1")).toBeInTheDocument();
    expect(screen.getByText("Log entry 2")).toBeInTheDocument();
  });
  it("should display variables", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/var1/)).toBeInTheDocument();
    expect(screen.getByText(/value1/)).toBeInTheDocument();
  });
  it("should call onClose when close button is clicked", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    const closeButton = screen.getByLabelText("Close modal");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("should call onClose when backdrop is clicked", () => {
    render(
      <ExecutionDetailsModal
        execution={mockExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByTestId("execution-details-modal-backdrop"));
    expect(mockOnClose).toHaveBeenCalled();
  });
  it("should display error when execution has error", () => {
    const executionWithError = {
      ...mockExecution,
      status: "failed",
      error: "Test error message",
    };
    render(
      <ExecutionDetailsModal
        execution={executionWithError}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });
  it("should display current node when present", () => {
    const executionWithCurrentNode = {
      ...mockExecution,
      current_node: "node-3",
    };
    render(
      <ExecutionDetailsModal
        execution={executionWithCurrentNode}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("node-3")).toBeInTheDocument();
  });
  it("should handle execution without completed_at", () => {
    const runningExecution = {
      ...mockExecution,
      status: "running",
      completed_at: void 0,
    };
    render(
      <ExecutionDetailsModal
        execution={runningExecution}
        isOpen={true}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/Started At/)).toBeInTheDocument();
    expect(screen.queryByText(/Completed At/)).not.toBeInTheDocument();
  });
  describe("Download Logs Functionality", () => {
    const mockApiClient = {
      getExecution: jest.fn(),
      downloadExecutionLogs: jest.fn(),
    };
    let mockAnchor;
    beforeEach(() => {
      mockApiClient.getExecution.mockResolvedValue(mockExecution);
      mockAnchor = {
        href: "",
        download: "",
        click: jest.fn(),
      };
      mockApiClient.getExecution.mockResolvedValue(mockExecution);
      mockApiClient.downloadExecutionLogs.mockReset();
      global.URL.createObjectURL = jest.fn(() => "blob:url");
      global.URL.revokeObjectURL = jest.fn();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName.toLowerCase() === "a") return mockAnchor;
        return originalCreateElement(tagName);
      });
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should render download buttons when execution has logs", () => {
      const executionWithLogs = {
        ...mockExecution,
        logs: ["Log 1", "Log 2"],
      };
      render(
        <ExecutionDetailsModal
          execution={executionWithLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      expect(screen.getByText(/Download Logs \(TXT\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Download Logs \(JSON\)/i)).toBeInTheDocument();
    });
    it("should not render download buttons when execution has no logs", () => {
      const executionWithoutLogs = {
        ...mockExecution,
        logs: [],
      };
      mockApiClient.getExecution.mockResolvedValue(executionWithoutLogs);
      render(
        <ExecutionDetailsModal
          execution={executionWithoutLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      expect(screen.queryByText(/Download Logs/i)).not.toBeInTheDocument();
    });
    it("should download logs as text when TXT button is clicked", async () => {
      const blob = new Blob(["Log content"], {
        type: "text/plain",
      });
      mockApiClient.downloadExecutionLogs.mockResolvedValue(blob);
      const executionWithLogs = {
        ...mockExecution,
        logs: ["Log 1"],
      };
      render(
        <ExecutionDetailsModal
          execution={executionWithLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      const txtButton = screen.getByText(/Download Logs \(TXT\)/i);
      fireEvent.click(txtButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockApiClient.downloadExecutionLogs).toHaveBeenCalledWith(
        "exec-123",
        "text",
      );
    });
    it("should download logs as json when JSON button is clicked", async () => {
      const blob = new Blob(['{"logs": []}'], {
        type: "application/json",
      });
      mockApiClient.downloadExecutionLogs.mockResolvedValue(blob);
      const executionWithLogs = {
        ...mockExecution,
        logs: ["Log 1"],
      };
      render(
        <ExecutionDetailsModal
          execution={executionWithLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      const jsonButton = screen.getByText(/Download Logs \(JSON\)/i);
      fireEvent.click(jsonButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockApiClient.downloadExecutionLogs).toHaveBeenCalledWith(
        "exec-123",
        "json",
      );
    });
    it("should show loading state during download", async () => {
      const blob = new Blob(["Log content"], {
        type: "text/plain",
      });
      let resolveDownload;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });
      mockApiClient.downloadExecutionLogs.mockReturnValue(downloadPromise);
      const executionWithLogs = {
        ...mockExecution,
        logs: ["Log 1"],
      };
      render(
        <ExecutionDetailsModal
          execution={executionWithLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      const txtButton = screen.getByText(/Download Logs \(TXT\)/i);
      fireEvent.click(txtButton);
      expect(txtButton).toBeDisabled();
      resolveDownload(blob);
      await downloadPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(txtButton).not.toBeDisabled();
    });
    it("should handle download errors gracefully", async () => {
      const error = new Error("Download failed");
      mockApiClient.downloadExecutionLogs.mockRejectedValue(error);
      global.alert = jest.fn();
      const executionWithLogs = {
        ...mockExecution,
        logs: ["Log 1"],
      };
      render(
        <ExecutionDetailsModal
          execution={executionWithLogs}
          isOpen={true}
          onClose={mockOnClose}
          apiClient={mockApiClient}
        />,
      );
      const txtButton = screen.getByText(/Download Logs \(TXT\)/i);
      fireEvent.click(txtButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining("Failed to download logs"),
      );
    });
  });
});
