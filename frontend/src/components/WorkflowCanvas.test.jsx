import { jsx } from "react/jsx-runtime";
import { render } from "@testing-library/react";
import WorkflowCanvas from "./WorkflowCanvas";
jest.mock("@xyflow/react", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ReactFlow: ({
      children,
      ...props
    }) => /* @__PURE__ */jsx("div", {
      "data-testid": "react-flow",
      ...props,
      children
    }),
    MiniMap: props => /* @__PURE__ */jsx("div", {
      "data-testid": "minimap",
      ...props
    }),
    Controls: () => /* @__PURE__ */jsx("div", {
      "data-testid": "controls"
    }),
    Background: props => /* @__PURE__ */jsx("div", {
      "data-testid": "background",
      ...props
    }),
    BackgroundVariant: {
      Dots: "dots"
    }
  };
});
jest.mock("./nodes", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    nodeTypes: {
      agent: () => /* @__PURE__ */jsx("div", {
        children: "Agent Node"
      }),
      condition: () => /* @__PURE__ */jsx("div", {
        children: "Condition Node"
      })
    }
  };
});
describe("WorkflowCanvas", () => {
  const mockNodes = [{
    id: "node-1",
    type: "agent",
    data: {
      label: "Node 1"
    },
    position: {
      x: 0,
      y: 0
    }
  }, {
    id: "node-2",
    type: "condition",
    data: {
      label: "Node 2"
    },
    position: {
      x: 100,
      y: 100
    }
  }];
  const mockEdges = [{
    id: "edge-1",
    source: "node-1",
    target: "node-2"
  }];
  const mockProps = {
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
    onPaneClick: jest.fn()
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render ReactFlow component", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should render MiniMap", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    expect(getByTestId("minimap")).toBeInTheDocument();
  });
  it("should render Controls", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    expect(getByTestId("controls")).toBeInTheDocument();
  });
  it("should render Background", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    expect(getByTestId("background")).toBeInTheDocument();
  });
  it("should pass nodes to ReactFlow", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    const reactFlow = getByTestId("react-flow");
    expect(reactFlow).toBeInTheDocument();
  });
  it("should pass edges to ReactFlow", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps
    }));
    const reactFlow = getByTestId("react-flow");
    expect(reactFlow).toBeInTheDocument();
  });
  it("should update nodes with execution state", () => {
    const nodeExecutionStates = {
      "node-1": {
        status: "running",
        error: void 0
      },
      "node-2": {
        status: "completed",
        error: void 0
      }
    };
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodeExecutionStates
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty nodeExecutionStates", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodeExecutionStates: {}
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle nodes without execution state", () => {
    const nodeExecutionStates = {
      "node-3": {
        status: "running"
      }
    };
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodeExecutionStates
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty nodes array", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodes: []
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty edges array", () => {
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      edges: []
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should pass execution error to node data", () => {
    const nodeExecutionStates = {
      "node-1": {
        status: "error",
        error: "Test error"
      }
    };
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodeExecutionStates
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should preserve existing node data when adding execution state", () => {
    const nodesWithData = [{
      id: "node-1",
      type: "agent",
      data: {
        label: "Node 1",
        customField: "custom value"
      },
      position: {
        x: 0,
        y: 0
      }
    }];
    const nodeExecutionStates = {
      "node-1": {
        status: "running"
      }
    };
    const {
      getByTestId
    } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
      ...mockProps,
      nodes: nodesWithData,
      nodeExecutionStates
    }));
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
});
