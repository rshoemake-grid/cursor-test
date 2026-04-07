import { render, screen } from "@testing-library/react";
import {
  WorkflowNodeCard,
  WorkflowTerminalNode,
} from "./workflowNodes.styled";

describe("workflowNodes.styled", () => {
  it("WorkflowNodeCard exposes data-visual-state default", () => {
    render(
      <WorkflowNodeCard
        data-testid="card"
        $width={200}
        $borderPalette="indigo"
        $hasError={false}
        $selected={false}
      />,
    );
    expect(screen.getByTestId("card")).toHaveAttribute(
      "data-visual-state",
      "default",
    );
  });

  it("WorkflowNodeCard exposes data-visual-state selected", () => {
    render(
      <WorkflowNodeCard
        data-testid="card"
        $width={200}
        $borderPalette="indigo"
        $hasError={false}
        $selected={true}
      />,
    );
    expect(screen.getByTestId("card")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });

  it("WorkflowNodeCard exposes data-visual-state error", () => {
    render(
      <WorkflowNodeCard
        data-testid="card"
        $width={200}
        $borderPalette="indigo"
        $hasError={true}
        $selected={false}
      />,
    );
    expect(screen.getByTestId("card")).toHaveAttribute(
      "data-visual-state",
      "error",
    );
  });

  it("WorkflowTerminalNode exposes data-visual-state", () => {
    render(
      <WorkflowTerminalNode
        data-testid="term"
        $variant="start"
        $selected={true}
      />,
    );
    expect(screen.getByTestId("term")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
});
