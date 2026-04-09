import { render, screen } from "@testing-library/react";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import { isValidExecutionStatus } from "../utils/executionStatus";

describe("ExecutionStatusBadge", () => {
  it("should render completed status", () => {
    render(<ExecutionStatusBadge status="completed" />);
    const el = screen.getByText("completed");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-execution-status", "completed");
    expect(el).toHaveAttribute("data-variant", "dark");
  });
  it("should render failed status", () => {
    render(<ExecutionStatusBadge status="failed" />);
    expect(screen.getByText("failed")).toHaveAttribute(
      "data-execution-status",
      "failed",
    );
  });
  it("should render running status", () => {
    render(<ExecutionStatusBadge status="running" />);
    expect(screen.getByText("running")).toHaveAttribute(
      "data-execution-status",
      "running",
    );
  });
  it("should render pending status", () => {
    render(<ExecutionStatusBadge status="pending" />);
    expect(screen.getByText("pending")).toHaveAttribute(
      "data-execution-status",
      "pending",
    );
  });
  it("should render paused status", () => {
    render(<ExecutionStatusBadge status="paused" />);
    expect(screen.getByText("paused")).toHaveAttribute(
      "data-execution-status",
      "paused",
    );
  });
  it("should render cancelled status", () => {
    render(<ExecutionStatusBadge status="cancelled" />);
    expect(screen.getByText("cancelled")).toHaveAttribute(
      "data-execution-status",
      "cancelled",
    );
  });
  it("should use light variant when specified", () => {
    render(<ExecutionStatusBadge status="completed" variant="light" />);
    expect(screen.getByText("completed")).toHaveAttribute(
      "data-variant",
      "light",
    );
  });
  it("should normalize invalid status to pending", () => {
    render(<ExecutionStatusBadge status="invalid-status" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
  it("should apply custom className", () => {
    render(
      <ExecutionStatusBadge status="completed" className="custom-class" />,
    );
    expect(screen.getByText("completed")).toHaveClass("custom-class");
  });

  describe("edge cases", () => {
    it("should handle variant being undefined (dark)", () => {
      render(<ExecutionStatusBadge status="running" />);
      expect(screen.getByText("running")).toHaveAttribute(
        "data-variant",
        "dark",
      );
    });
    it("should handle isValidExecutionStatus check for all statuses", () => {
      const statuses = [
        "running",
        "completed",
        "failed",
        "pending",
        "paused",
        "cancelled",
        "INVALID",
      ];
      for (const status of statuses) {
        const { unmount } = render(<ExecutionStatusBadge status={status} />);
        const label = isValidExecutionStatus(status) ? status : "pending";
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
        document.body.innerHTML = "";
      }
    });
    it("should handle all variant values", () => {
      for (const variant of ["dark", "light"]) {
        const { unmount } = render(
          <ExecutionStatusBadge status="running" variant={variant} />,
        );
        expect(screen.getByText("running")).toHaveAttribute(
          "data-variant",
          variant,
        );
        unmount();
      }
    });
    it("should handle status being empty string", () => {
      render(<ExecutionStatusBadge status="" />);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
    it("should handle status being null", () => {
      render(<ExecutionStatusBadge status={null} />);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
    it("should handle status being undefined", () => {
      render(<ExecutionStatusBadge status={void 0} />);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
    it("should handle className with multiple classes", () => {
      render(
        <ExecutionStatusBadge
          status="completed"
          className="class1 class2 class3"
        />,
      );
      const el = screen.getByText("completed");
      expect(el).toHaveClass("class1", "class2", "class3");
    });
    it("should handle all valid statuses with light variant", () => {
      const statuses = [
        "running",
        "completed",
        "failed",
        "pending",
        "paused",
        "cancelled",
      ];
      for (const status of statuses) {
        const { unmount } = render(
          <ExecutionStatusBadge status={status} variant="light" />,
        );
        expect(screen.getByText(status)).toHaveAttribute(
          "data-variant",
          "light",
        );
        unmount();
        document.body.innerHTML = "";
      }
    });
  });
});
