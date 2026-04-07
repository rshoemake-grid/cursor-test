import { render, screen } from "@testing-library/react";
import {
  ExecutionStatusBadgeRoot,
  ExecutionStatusPill,
} from "./executionStatus.styled";

describe("executionStatus.styled", () => {
  it("renders ExecutionStatusBadgeRoot with data attributes", () => {
    render(
      <ExecutionStatusBadgeRoot $status="completed" $variant="dark">
        done
      </ExecutionStatusBadgeRoot>,
    );
    const el = screen.getByText("done");
    expect(el).toHaveAttribute("data-execution-status", "completed");
    expect(el).toHaveAttribute("data-variant", "dark");
  });

  it("renders ExecutionStatusPill", () => {
    render(
      <ExecutionStatusPill $status="running" data-testid="pill">
        RUNNING
      </ExecutionStatusPill>,
    );
    expect(screen.getByTestId("pill")).toHaveAttribute(
      "data-execution-status",
      "running",
    );
  });
});
