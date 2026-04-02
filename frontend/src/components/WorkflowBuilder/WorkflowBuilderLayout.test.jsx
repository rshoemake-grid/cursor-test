import { jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import { WorkflowBuilderLayout } from "./WorkflowBuilderLayout";
jest.mock("../NodePanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "node-panel",
      children: "NodePanel"
    })
  };
});
jest.mock("../PropertyPanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "property-panel",
      children: "PropertyPanel"
    })
  };
});
jest.mock("../WorkflowCanvas", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "workflow-canvas",
      children: "WorkflowCanvas"
    })
  };
});
jest.mock("../ExecutionConsole", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "execution-console",
      children: "ExecutionConsole"
    })
  };
});
jest.mock("../KeyboardHandler", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    KeyboardHandler: () => /* @__PURE__ */jsx("div", {
      "data-testid": "keyboard-handler",
      children: "KeyboardHandler"
    })
  };
});
jest.mock("../ReactFlowInstanceCapture", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ReactFlowInstanceCapture: () => /* @__PURE__ */jsx("div", {
      "data-testid": "react-flow-instance-capture",
      children: "ReactFlowInstanceCapture"
    })
  };
});
describe("WorkflowBuilderLayout", () => {
  const mockNodes = [];
  const mockEdges = [];
  const mockReactFlowInstanceRef = {
    current: null
  };
  const defaultProps = {
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: jest.fn(),
    onEdgesChange: jest.fn(),
    onConnect: jest.fn(),
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onNodeClick: jest.fn(),
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    onPaneClick: jest.fn(),
    nodeExecutionStates: {},
    reactFlowInstanceRef: mockReactFlowInstanceRef,
    selectedNodeId: null,
    setSelectedNodeId: jest.fn(),
    selectedNodeIds: /* @__PURE__ */new Set(),
    notifyModified: jest.fn(),
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
    activeWorkflowId: null,
    executions: [],
    activeExecutionId: null,
    onWorkflowUpdate: jest.fn(),
    getWorkflowChatCanvasSnapshot: null,
    workflowChatClearNonce: 0,
    onExecutionLogUpdate: jest.fn(),
    onExecutionStatusUpdate: jest.fn(),
    onExecutionNodeUpdate: jest.fn(),
    onRemoveExecution: jest.fn(),
    onSaveWorkflow: jest.fn()
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render all layout components", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderLayout, {
      ...defaultProps
    }));
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    expect(screen.getByTestId("property-panel")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("execution-console")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-handler")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-instance-capture")).toBeInTheDocument();
  });
  it("should have correct layout structure", () => {
    const {
      container
    } = render(/* @__PURE__ */jsx(WorkflowBuilderLayout, {
      ...defaultProps
    }));
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("flex-1", "flex", "overflow-hidden");
  });
  it("should pass props to child components", () => {
    const props = {
      ...defaultProps,
      selectedNodeId: "node-1",
      activeWorkflowId: "workflow-1"
    };
    render(/* @__PURE__ */jsx(WorkflowBuilderLayout, {
      ...props
    }));
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    expect(screen.getByTestId("property-panel")).toBeInTheDocument();
  });
});
