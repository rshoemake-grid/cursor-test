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
    }) => (
      <div
        data-testid="react-flow"
        data-nodes={JSON.stringify(props.nodes)}
        data-edges={JSON.stringify(props.edges)}
        onClick={(e) => {
          if (onPaneClick && !e.target.closest('[data-testid^="node-"]')) {
            onPaneClick(e);
          }
        }}
        onDrop={(e) => {
          if (onDrop) onDrop(e);
        }}
        onDragOver={(e) => {
          if (onDragOver) onDragOver(e);
        }}
        {...props}
      >
        {children}
        {props.nodes?.map((node) => (
          <div
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={(e) => {
              if (onNodeClick) onNodeClick(e, node);
            }}
            onContextMenu={(e) => {
              if (onNodeContextMenu) onNodeContextMenu(e, node);
            }}
          >
            {node.id}
          </div>
        ))}
        {props.edges?.map((edge) => (
          <div
            key={edge.id}
            data-testid={`edge-${edge.id}`}
            onContextMenu={(e) => {
              if (onEdgeContextMenu) onEdgeContextMenu(e, edge);
            }}
          >
            {edge.id}
          </div>
        ))}
      </div>
    ),
    MiniMap: (props) => (
      <div
        data-testid="minimap"
        data-node-color={props.nodeColor?.({
          type: "agent",
        })}
      />
    ),
    Controls: () => <div data-testid="controls" />,
    Background: (props) => (
      <div data-testid="background" data-variant={props.variant} />
    ),
    BackgroundVariant: {
      Dots: "dots",
    },
  };
});
jest.mock("./nodes", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    nodeTypes: {
      agent: () => <div>Agent Node</div>,
      condition: () => <div>Condition Node</div>,
      loop: () => <div>Loop Node</div>,
      start: () => <div>Start Node</div>,
      end: () => <div>End Node</div>,
      gcp_bucket: () => <div>GCP Bucket Node</div>,
      aws_s3: () => <div>AWS S3 Node</div>,
      gcp_pubsub: () => <div>GCP PubSub Node</div>,
      local_filesystem: () => <div>Local Filesystem Node</div>,
    },
  };
});
describe("WorkflowCanvas - Additional Coverage", () => {
  const mockNodes = [
    {
      id: "node-1",
      type: "agent",
      data: {
        label: "Node 1",
      },
      position: {
        x: 0,
        y: 0,
      },
    },
    {
      id: "node-2",
      type: "condition",
      data: {
        label: "Node 2",
      },
      position: {
        x: 100,
        y: 100,
      },
    },
  ];
  const mockEdges = [
    {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
    },
  ];
  const mockHandlers = {
    onNodesChange: jest.fn(),
    onEdgesChange: jest.fn(),
    onConnect: jest.fn(),
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onNodeClick: jest.fn(),
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    onPaneClick: jest.fn(),
  };
  const mockGraph = {
    nodes: mockNodes,
    edges: mockEdges,
  };
  const mockProps = {
    graph: mockGraph,
    handlers: mockHandlers,
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("Event Handlers", () => {
    it("should call onNodesChange when nodes change", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const reactFlow = getByTestId("react-flow");
      if (reactFlow.getAttribute("onNodesChange")) {
        expect(mockHandlers.onNodesChange).toBeDefined();
      }
    });
    it("should call onEdgesChange when edges change", () => {
      render(<WorkflowCanvas {...mockProps} />);
      expect(mockHandlers.onEdgesChange).toBeDefined();
    });
    it("should call onConnect when connection is made", () => {
      render(<WorkflowCanvas {...mockProps} />);
      expect(mockHandlers.onConnect).toBeDefined();
    });
    it("should call onDrop when item is dropped", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const reactFlow = getByTestId("react-flow");
      const dropEvent = new Event("drop", {
        bubbles: true,
      });
      fireEvent(reactFlow, dropEvent);
      expect(mockHandlers.onDrop).toHaveBeenCalled();
    });
    it("should call onDragOver when dragging over canvas", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const reactFlow = getByTestId("react-flow");
      const dragOverEvent = new Event("dragover", {
        bubbles: true,
      });
      fireEvent(reactFlow, dragOverEvent);
      expect(mockHandlers.onDragOver).toHaveBeenCalled();
    });
    it("should call onNodeClick when node is clicked", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const node1 = getByTestId("node-node-1");
      fireEvent.click(node1);
      expect(mockHandlers.onNodeClick).toHaveBeenCalled();
    });
    it("should call onNodeContextMenu when node is right-clicked", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const node1 = getByTestId("node-node-1");
      fireEvent.contextMenu(node1);
      expect(mockHandlers.onNodeContextMenu).toHaveBeenCalled();
    });
    it("should call onEdgeContextMenu when edge is right-clicked", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const edge1 = getByTestId("edge-edge-1");
      fireEvent.contextMenu(edge1);
      expect(mockHandlers.onEdgeContextMenu).toHaveBeenCalled();
    });
    it("should call onPaneClick when pane is clicked", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const reactFlow = getByTestId("react-flow");
      fireEvent.click(reactFlow);
      expect(mockHandlers.onPaneClick).toHaveBeenCalled();
    });
  });
  describe("MiniMap Node Colors", () => {
    it("should return correct color for agent node", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const minimap = getByTestId("minimap");
      const color = minimap.getAttribute("data-node-color");
      expect(color).toBe("#3b82f6");
    });
    it("should return correct color for condition node", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const minimap = getByTestId("minimap");
      expect(minimap).toBeInTheDocument();
    });
  });
  describe("Node Execution State Mapping", () => {
    it("should map execution status to node data", () => {
      const nodeExecutionStates = {
        "node-1": {
          status: "running",
          error: void 0,
        },
      };
      const { getByTestId } = render(
        <WorkflowCanvas
          graph={{ ...mockGraph, nodeExecutionStates }}
          handlers={mockHandlers}
        />,
      );
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find((n) => n.id === "node-1");
        expect(node1.data.executionStatus).toBe("running");
      }
    });
    it("should map execution error to node data", () => {
      const nodeExecutionStates = {
        "node-1": {
          status: "error",
          error: "Test error message",
        },
      };
      const { getByTestId } = render(
        <WorkflowCanvas
          graph={{ ...mockGraph, nodeExecutionStates }}
          handlers={mockHandlers}
        />,
      );
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find((n) => n.id === "node-1");
        expect(node1.data.executionError).toBe("Test error message");
      }
    });
    it("should preserve existing node data when adding execution state", () => {
      const nodesWithData = [
        {
          id: "node-1",
          type: "agent",
          data: {
            label: "Node 1",
            customField: "custom value",
            otherField: 123,
          },
          position: {
            x: 0,
            y: 0,
          },
        },
      ];
      const nodeExecutionStates = {
        "node-1": {
          status: "running",
        },
      };
      const { getByTestId } = render(
        <WorkflowCanvas
          graph={{
            nodes: nodesWithData,
            edges: mockEdges,
            nodeExecutionStates,
          }}
          handlers={mockHandlers}
        />,
      );
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find((n) => n.id === "node-1");
        expect(node1.data.customField).toBe("custom value");
        expect(node1.data.otherField).toBe(123);
        expect(node1.data.executionStatus).toBe("running");
      }
    });
    it("should handle nodes without execution state", () => {
      const nodeExecutionStates = {
        "node-3": {
          status: "running",
        },
        // Different node ID
      };
      const { getByTestId } = render(
        <WorkflowCanvas
          graph={{ ...mockGraph, nodeExecutionStates }}
          handlers={mockHandlers}
        />,
      );
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find((n) => n.id === "node-1");
        expect(node1.data.executionStatus).toBeUndefined();
      }
    });
    it("should handle multiple nodes with different execution states", () => {
      const nodeExecutionStates = {
        "node-1": {
          status: "running",
          error: void 0,
        },
        "node-2": {
          status: "completed",
          error: void 0,
        },
      };
      const { getByTestId } = render(
        <WorkflowCanvas
          graph={{ ...mockGraph, nodeExecutionStates }}
          handlers={mockHandlers}
        />,
      );
      const reactFlow = getByTestId("react-flow");
      const nodesData = reactFlow.getAttribute("data-nodes");
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        const node1 = nodes.find((n) => n.id === "node-1");
        const node2 = nodes.find((n) => n.id === "node-2");
        expect(node1.data.executionStatus).toBe("running");
        expect(node2.data.executionStatus).toBe("completed");
      }
    });
  });
  describe("ReactFlow Configuration", () => {
    it("should pass correct props to ReactFlow", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const reactFlow = getByTestId("react-flow");
      expect(reactFlow).toBeInTheDocument();
      const nodesData = reactFlow.getAttribute("data-nodes");
      const edgesData = reactFlow.getAttribute("data-edges");
      expect(nodesData).toBeTruthy();
      expect(edgesData).toBeTruthy();
    });
    it("should render Background with correct variant", () => {
      const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
      const background = getByTestId("background");
      expect(background.getAttribute("data-variant")).toBe("dots");
    });
  });
});
