import { jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import ConditionNode from "./ConditionNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(
    /* @__PURE__ */ jsx(ReactFlowProvider, { children: component })
  );
};
describe("ConditionNode", () => {
  it("should render condition node", () => {
    renderWithProvider(/* @__PURE__ */ jsx(ConditionNode, { selected: false, data: { label: "Test Condition" }, id: "condition-1" }));
    expect(screen.getByText("Test Condition")).toBeInTheDocument();
  });
  it("should show selected state", () => {
    const { container } = renderWithProvider(/* @__PURE__ */ jsx(ConditionNode, { selected: true, data: { label: "Test" }, id: "condition-1" }));
    const node = container.querySelector(".border-primary-500");
    expect(node).toBeInTheDocument();
  });
  it("should show error state when executionStatus is failed", () => {
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(
        ConditionNode,
        {
          selected: false,
          data: { label: "Test", executionStatus: "failed" },
          id: "condition-1"
        }
      )
    );
    const node = container.querySelector(".border-red-500");
    expect(node).toBeInTheDocument();
  });
  it("should display description when provided", () => {
    renderWithProvider(
      /* @__PURE__ */ jsx(
        ConditionNode,
        {
          selected: false,
          data: { label: "Test", description: "Test description" },
          id: "condition-1"
        }
      )
    );
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
  it("should display condition config when provided", () => {
    renderWithProvider(
      /* @__PURE__ */ jsx(
        ConditionNode,
        {
          selected: false,
          data: {
            label: "Test",
            condition_config: { condition_type: "equals", field: "status" }
          },
          id: "condition-1"
        }
      )
    );
    expect(screen.getByText(/equals: status/)).toBeInTheDocument();
  });
  it("should display True and False handles", () => {
    renderWithProvider(/* @__PURE__ */ jsx(ConditionNode, { selected: false, data: { label: "Test" }, id: "condition-1" }));
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });
  it("should expose true and false source handles on the right plus left target", () => {
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(ConditionNode, { selected: false, data: { label: "Test" }, id: "condition-1" })
    );
    expect(container.querySelector('.react-flow__handle[data-handlepos="left"]')).toBeInTheDocument();
    const rightHandles = container.querySelectorAll('.react-flow__handle[data-handlepos="right"]');
    expect(rightHandles.length).toBe(2);
  });
});
