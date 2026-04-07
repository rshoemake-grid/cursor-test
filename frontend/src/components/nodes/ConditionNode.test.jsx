import { render, screen } from "@testing-library/react";
import ConditionNode from "./ConditionNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("ConditionNode", () => {
  it("should render condition node", () => {
    renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test Condition",
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByText("Test Condition")).toBeInTheDocument();
  });
  it("should show selected state", () => {
    renderWithProvider(
      <ConditionNode
        selected={true}
        data={{
          label: "Test",
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByTestId("condition-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show error state when executionStatus is failed", () => {
    renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test",
          executionStatus: "failed",
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByTestId("condition-node")).toHaveAttribute(
      "data-visual-state",
      "error",
    );
  });
  it("should display description when provided", () => {
    renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test",
          description: "Test description",
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
  it("should display condition config when provided", () => {
    renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test",
          condition_config: {
            condition_type: "equals",
            field: "status",
          },
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByText(/equals: status/)).toBeInTheDocument();
  });
  it("should display True and False handles", () => {
    renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test",
        }}
        id="condition-1"
      />,
    );
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });
  it("should expose true and false source handles on the right plus left target", () => {
    const { container } = renderWithProvider(
      <ConditionNode
        selected={false}
        data={{
          label: "Test",
        }}
        id="condition-1"
      />,
    );
    expect(
      container.querySelector('.react-flow__handle[data-handlepos="left"]'),
    ).toBeInTheDocument();
    const rightHandles = container.querySelectorAll(
      '.react-flow__handle[data-handlepos="right"]',
    );
    expect(rightHandles.length).toBe(2);
  });
});
