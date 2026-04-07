import { render, screen, fireEvent } from "@testing-library/react";
import ExecutionListItem from "./ExecutionListItem";
describe("ExecutionListItem", () => {
  const mockExecution = {
    execution_id: "exec-12345678",
    workflow_id: "workflow-12345678",
    status: "completed",
    started_at: "2024-01-01T10:00:00Z",
    completed_at: "2024-01-01T10:00:05Z",
    node_states: {},
    variables: {},
    logs: [],
  };
  const mockOnExecutionClick = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render execution details", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByText(/exec-123/)).toBeInTheDocument();
    expect(screen.getByText(/Workflow:/)).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });
  it("should call onExecutionClick when item is clicked", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    fireEvent.click(screen.getByTestId("execution-list-item"));
    expect(mockOnExecutionClick).toHaveBeenCalledWith("exec-12345678");
  });
  it("should call onExecutionClick when View button is clicked", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    const viewButton = screen.getByText("View");
    fireEvent.click(viewButton);
    expect(mockOnExecutionClick).toHaveBeenCalledWith("exec-12345678");
  });
  it("should display current node when present", () => {
    const executionWithNode = {
      ...mockExecution,
      current_node: "node-1",
    };
    render(
      <ExecutionListItem
        execution={executionWithNode}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByText("Current Node:")).toBeInTheDocument();
    expect(screen.getByText("node-1")).toBeInTheDocument();
  });
  it("should display progress bar for running executions", () => {
    const runningExecution = {
      ...mockExecution,
      status: "running",
      completed_at: void 0,
      node_states: {
        node1: {
          status: "completed",
        },
        node2: {
          status: "running",
        },
        node3: {
          status: "pending",
        },
      },
    };
    render(
      <ExecutionListItem
        execution={runningExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByText("Progress:")).toBeInTheDocument();
  });
  it("should not display progress bar for non-running executions", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.queryByText("Progress:")).not.toBeInTheDocument();
  });
  it("should display completed timestamp when present", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });
  it("should not display completed timestamp when absent", () => {
    const executionWithoutCompletion = {
      ...mockExecution,
      completed_at: void 0,
    };
    render(
      <ExecutionListItem
        execution={executionWithoutCompletion}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.queryByText(/Completed:/)).not.toBeInTheDocument();
  });
  it("should display duration", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
  });
  it("should apply active styling for running execution", () => {
    const runningExecution = {
      ...mockExecution,
      status: "running",
    };
    render(
      <ExecutionListItem
        execution={runningExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByTestId("execution-list-item")).toHaveAttribute(
      "data-active",
      "true",
    );
  });
  it("should apply active styling for pending execution", () => {
    const pendingExecution = {
      ...mockExecution,
      status: "pending",
    };
    render(
      <ExecutionListItem
        execution={pendingExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    expect(screen.getByTestId("execution-list-item")).toHaveAttribute(
      "data-active",
      "true",
    );
  });
  it("should apply inactive styling for completed execution", () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />,
    );
    const row = screen.getByTestId("execution-list-item");
    expect(row).toHaveAttribute("data-active", "false");
    expect(row).toHaveAttribute("data-selected", "false");
  });
});
