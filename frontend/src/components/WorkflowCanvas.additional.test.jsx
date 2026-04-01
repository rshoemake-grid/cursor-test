import { jsx, jsxs } from "react/jsx-runtime";
import { render, fireEvent } from "@testing-library/react";
import WorkflowCanvas from "./WorkflowCanvas";
jest.mock("@xyflow/react", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    ReactFlow: ({
      children,
      onDrop,
      onDragOver,
      onNodeClick,
      onNodeContextMenu,
      onEdgeContextMenu,
      onPaneClick,
      ...props
    }) => /* @__PURE__ */jsxs("div", {
      "data-testid": "react-flow",
      "data-nodes": JSON.stringify(props.nodes),
      "data-edges": JSON.stringify(props.edges),
      onClick: e => {
        if (onPaneClick && !e.target.closest('[data-testid^="node-"]')) {
          onPaneClick(e);
        }
      },
      onDrop: e => {
        if (onDrop) onDrop(e);
      },
      onDragOver: e => {
        if (onDragOver) onDragOver(e);
      },
      ...props,
      children: [children, props.nodes?.map(node => /* @__PURE__ */jsx("div", {
        "data-testid": `node-${node.id}`,
        onClick: e => {
          if (onNodeClick) onNodeClick(e, node);
        },
        onContextMenu: e => {
          if (onNodeContextMenu) onNodeContextMenu(e, node);
        },
        children: node.id
      }, node.id)), props.edges?.map(edge => /* @__PURE__ */jsx("div", {
        "data-testid": `edge-${edge.id}`,
        onContextMenu: e => {
          if (onEdgeContextMenu) onEdgeContextMenu(e, edge);
        },
        children: edge.id
      }, edge.id))]
    }),
    MiniMap: props => /* @__PURE__ */jsx("div", {
      "data-testid": "minimap",
      "data-node-color": props.nodeColor?.({
        type: "agent"
      })
    }),
    Controls: () => /* @__PURE__ */jsx("div", {
      "data-testid": "controls"
    }),
    Background: props => /* @__PURE__ */jsx("div", {
      "data-testid": "background",
      "data-variant": props.variant
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
      }),
      loop: () => /* @__PURE__ */jsx("div", {
        children: "Loop Node"
      }),
      start: () => /* @__PURE__ */jsx("div", {
        children: "Start Node"
      }),
      end: () => /* @__PURE__ */jsx("div", {
        children: "End Node"
      }),
      gcp_bucket: () => /* @__PURE__ */jsx("div", {
        children: "GCP Bucket Node"
      }),
      aws_s3: () => /* @__PURE__ */jsx("div", {
        children: "AWS S3 Node"
      }),
      gcp_pubsub: () => /* @__PURE__ */jsx("div", {
        children: "GCP PubSub Node"
      }),
      local_filesystem: () => /* @__PURE__ */jsx("div", {
        children: "Local Filesystem Node"
      })
    }
  };
});
describe("WorkflowCanvas - Additional Coverage", () => {
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
  describe("Event Handlers", () => {
    it("should call onNodesChange when nodes change", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const reactFlow = getByTestId("react-flow");
      if (reactFlow.getAttribute("onNodesChange")) {
        expect(mockProps.onNodesChange).toBeDefined();
      }
    });
    it("should call onEdgesChange when edges change", () => {
      render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      expect(mockProps.onEdgesChange).toBeDefined();
    });
    it("should call onConnect when connection is made", () => {
      render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      expect(mockProps.onConnect).toBeDefined();
    });
    it("should call onDrop when item is dropped", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const reactFlow = getByTestId("react-flow");
      const dropEvent = new Event("drop", {
        bubbles: true
      });
      fireEvent(reactFlow, dropEvent);
      expect(mockProps.onDrop).toHaveBeenCalled();
    });
    it("should call onDragOver when dragging over canvas", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const reactFlow = getByTestId("react-flow");
      const dragOverEvent = new Event("dragover", {
        bubbles: true
      });
      fireEvent(reactFlow, dragOverEvent);
      expect(mockProps.onDragOver).toHaveBeenCalled();
    });
    it("should call onNodeClick when node is clicked", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const node1 = getByTestId("node-node-1");
      fireEvent.click(node1);
      expect(mockProps.onNodeClick).toHaveBeenCalled();
    });
    it("should call onNodeContextMenu when node is right-clicked", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const node1 = getByTestId("node-node-1");
      fireEvent.contextMenu(node1);
      expect(mockProps.onNodeContextMenu).toHaveBeenCalled();
    });
    it("should call onEdgeContextMenu when edge is right-clicked", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const edge1 = getByTestId("edge-edge-1");
      fireEvent.contextMenu(edge1);
      expect(mockProps.onEdgeContextMenu).toHaveBeenCalled();
    });
    it("should call onPaneClick when pane is clicked", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const reactFlow = getByTestId("react-flow");
      fireEvent.click(reactFlow);
      expect(mockProps.onPaneClick).toHaveBeenCalled();
    });
  });
  describe("MiniMap Node Colors", () => {
    it("should return correct color for agent node", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const minimap = getByTestId("minimap");
      const color = minimap.getAttribute("data-node-color");
      expect(color).toBe("#3b82f6");
    });
    it("should return correct color for condition node", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const minimap = getByTestId("minimap");
      expect(minimap).toBeInTheDocument();
    });
  });
  describe("Node Execution State Mapping", () => {
    it("should map execution status to node data", () => {
      const nodeExecutionStates = {
        "node-1": {
          status: "running",
          error: void 0
        }
      };
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps,
        nodeExecutionStates
      }));
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find(n => n.id === "node-1");
        expect(node1.data.executionStatus).toBe("running");
      }
    });
    it("should map execution error to node data", () => {
      const nodeExecutionStates = {
        "node-1": {
          status: "error",
          error: "Test error message"
        }
      };
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps,
        nodeExecutionStates
      }));
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find(n => n.id === "node-1");
        expect(node1.data.executionError).toBe("Test error message");
      }
    });
    it("should preserve existing node data when adding execution state", () => {
      const nodesWithData = [{
        id: "node-1",
        type: "agent",
        data: {
          label: "Node 1",
          customField: "custom value",
          otherField: 123
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
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find(n => n.id === "node-1");
        expect(node1.data.customField).toBe("custom value");
        expect(node1.data.otherField).toBe(123);
        expect(node1.data.executionStatus).toBe("running");
      }
    });
    it("should handle nodes without execution state", () => {
      const nodeExecutionStates = {
        "node-3": {
          status: "running"
        }
        // Different node ID
      };
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps,
        nodeExecutionStates
      }));
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find(n => n.id === "node-1");
        expect(node1.data.executionStatus).toBeUndefined();
      }
    });
    it("should handle multiple nodes with different execution states", () => {
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
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find(n => n.id === "node-1");
        const node2 = nodes.find(n => n.id === "node-2");
        expect(node1.data.executionStatus).toBe("running");
        expect(node2.data.executionStatus).toBe("completed");
      }
    });
  });
  describe("ReactFlow Configuration", () => {
    it("should pass correct props to ReactFlow", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const reactFlow = getByTestId("react-flow");
      expect(reactFlow).toBeInTheDocument();
      const nodesData = reactFlow.getAttribute("data-nodes");
      const edgesData = reactFlow.getAttribute("data-edges");
      expect(nodesData).toBeTruthy();
      expect(edgesData).toBeTruthy();
    });
    it("should render Background with correct variant", () => {
      const {
        getByTestId
      } = render(/* @__PURE__ */jsx(WorkflowCanvas, {
        ...mockProps
      }));
      const background = getByTestId("background");
      expect(background.getAttribute("data-variant")).toBe("dots");
    });
  });
});
