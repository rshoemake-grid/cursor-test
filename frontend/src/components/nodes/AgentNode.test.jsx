import { jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import AgentNode from "./AgentNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(
    /* @__PURE__ */ jsx(ReactFlowProvider, { children: component })
  );
};
describe("AgentNode", () => {
  it("should render agent node", () => {
    const nodeData = {
      label: "Test Agent",
      name: "Test Agent"
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
  });
  it("should render with description", () => {
    const nodeData = {
      label: "Test Agent",
      description: "Test description"
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
  it("should render with model", () => {
    const nodeData = {
      label: "Test Agent",
      agent_config: {
        model: "gpt-4"
      }
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
  });
  it("should show selected state", () => {
    const nodeData = {
      label: "Test Agent"
    };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: true, id: "node-1" })
    );
    const nodeElement = container.querySelector(".border-primary-500");
    expect(nodeElement).toBeInTheDocument();
  });
  it("should show error state", () => {
    const nodeData = {
      label: "Test Agent",
      executionStatus: "failed"
    };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    const nodeElement = container.querySelector(".border-red-500");
    expect(nodeElement).toBeInTheDocument();
  });
  it("should handle empty label", () => {
    const nodeData = {
      label: ""
    };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    const nodeElement = container.querySelector(".bg-white");
    expect(nodeElement).toBeInTheDocument();
  });
  it("should render top, left, bottom, and right connection handles", () => {
    const nodeData = { label: "Agent" };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(AgentNode, { data: nodeData, selected: false, id: "node-1" })
    );
    const handles = container.querySelectorAll(".react-flow__handle");
    expect(handles.length).toBe(4);
    expect(container.querySelector('.react-flow__handle[data-handlepos="left"]')).toBeInTheDocument();
    expect(container.querySelector('.react-flow__handle[data-handlepos="right"]')).toBeInTheDocument();
  });
});
