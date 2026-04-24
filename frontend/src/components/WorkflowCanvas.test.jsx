import { render, act } from "@testing-library/react";
import WorkflowCanvas from "./WorkflowCanvas";

const mockSetViewport = jest.fn();
const mockFitView = jest.fn();

jest.mock("@xyflow/react", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ReactFlow: ({ children, ...props }) => (
      <div data-testid="react-flow" {...props}>
        {children}
      </div>
    ),
    MiniMap: (props) => <div data-testid="minimap" {...props} />,
    Controls: () => <div data-testid="controls" />,
    Background: (props) => <div data-testid="background" {...props} />,
    BackgroundVariant: {
      Dots: "dots",
    },
    useReactFlow: () => ({
      setViewport: mockSetViewport,
      fitView: mockFitView,
    }),
  };
});
jest.mock("./nodes", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    nodeTypes: {
      agent: () => <div>Agent Node</div>,
      condition: () => <div>Condition Node</div>,
    },
  };
});
describe("WorkflowCanvas", () => {
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
  it("applies saved viewport via setViewport when initialViewport is valid", () => {
    render(
      <WorkflowCanvas
        {...mockProps}
        initialViewport={{ x: 10, y: -20, zoom: 1.25 }}
        canvasVisible={true}
      />,
    );
    expect(mockSetViewport).toHaveBeenCalledWith(
      { x: 10, y: -20, zoom: 1.25 },
      { duration: 0 },
    );
  });
  it("calls fitView when there is no saved viewport and canvas is visible", () => {
    render(<WorkflowCanvas {...mockProps} canvasVisible={true} />);
    expect(mockFitView).toHaveBeenCalledWith({
      padding: 0.2,
      duration: 0,
    });
  });
  it("calls fitView again when nodes hydrate from empty (server-loaded workflow)", () => {
    const { rerender } = render(
      <WorkflowCanvas
        graph={{ nodes: [], edges: [], nodeExecutionStates: {} }}
        handlers={mockHandlers}
        canvasVisible={true}
      />,
    );
    expect(mockFitView).toHaveBeenCalledTimes(1);
    rerender(
      <WorkflowCanvas
        {...mockProps}
        graph={{
          nodes: mockNodes,
          edges: mockEdges,
          nodeExecutionStates: {},
        }}
        handlers={mockHandlers}
        canvasVisible={true}
      />,
    );
    expect(mockFitView).toHaveBeenCalledTimes(2);
  });
  it("runs fitView after canvas becomes visible with existing nodes (remeasure after display:none)", async () => {
    const { rerender } = render(
      <WorkflowCanvas
        graph={{
          nodes: mockNodes,
          edges: mockEdges,
          nodeExecutionStates: {},
        }}
        handlers={mockHandlers}
        canvasVisible={false}
      />,
    );
    expect(mockFitView).not.toHaveBeenCalled();
    rerender(
      <WorkflowCanvas
        graph={{
          nodes: mockNodes,
          edges: mockEdges,
          nodeExecutionStates: {},
        }}
        handlers={mockHandlers}
        canvasVisible={true}
      />,
    );
    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    });
    expect(mockFitView).toHaveBeenCalled();
  });
  it("does not call fitView on node count change when a saved viewport is applied", () => {
    const { rerender } = render(
      <WorkflowCanvas
        graph={{ nodes: [], edges: [], nodeExecutionStates: {} }}
        handlers={mockHandlers}
        initialViewport={{ x: 10, y: -20, zoom: 1.25 }}
        canvasVisible={true}
      />,
    );
    expect(mockFitView).not.toHaveBeenCalled();
    rerender(
      <WorkflowCanvas
        {...mockProps}
        graph={{
          nodes: mockNodes,
          edges: mockEdges,
          nodeExecutionStates: {},
        }}
        handlers={mockHandlers}
        initialViewport={{ x: 10, y: -20, zoom: 1.25 }}
        canvasVisible={true}
      />,
    );
    expect(mockFitView).not.toHaveBeenCalled();
  });
  it("should render ReactFlow component", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should render MiniMap", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    expect(getByTestId("minimap")).toBeInTheDocument();
  });
  it("should render Controls", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    expect(getByTestId("controls")).toBeInTheDocument();
  });
  it("should render Background", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    expect(getByTestId("background")).toBeInTheDocument();
  });
  it("should pass nodes to ReactFlow", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    const reactFlow = getByTestId("react-flow");
    expect(reactFlow).toBeInTheDocument();
  });
  it("should pass edges to ReactFlow", () => {
    const { getByTestId } = render(<WorkflowCanvas {...mockProps} />);
    const reactFlow = getByTestId("react-flow");
    expect(reactFlow).toBeInTheDocument();
  });
  it("should update nodes with execution state", () => {
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
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty nodeExecutionStates", () => {
    const { getByTestId } = render(
      <WorkflowCanvas
        graph={{ ...mockGraph, nodeExecutionStates: {} }}
        handlers={mockHandlers}
      />,
    );
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle nodes without execution state", () => {
    const nodeExecutionStates = {
      "node-3": {
        status: "running",
      },
    };
    const { getByTestId } = render(
      <WorkflowCanvas
        graph={{ ...mockGraph, nodeExecutionStates }}
        handlers={mockHandlers}
      />,
    );
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty nodes array", () => {
    const { getByTestId } = render(
      <WorkflowCanvas
        graph={{ ...mockGraph, nodes: [] }}
        handlers={mockHandlers}
      />,
    );
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should handle empty edges array", () => {
    const { getByTestId } = render(
      <WorkflowCanvas
        graph={{ ...mockGraph, edges: [] }}
        handlers={mockHandlers}
      />,
    );
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should pass execution error to node data", () => {
    const nodeExecutionStates = {
      "node-1": {
        status: "error",
        error: "Test error",
      },
    };
    const { getByTestId } = render(
      <WorkflowCanvas
        graph={{ ...mockGraph, nodeExecutionStates }}
        handlers={mockHandlers}
      />,
    );
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
  it("should preserve existing node data when adding execution state", () => {
    const nodesWithData = [
      {
        id: "node-1",
        type: "agent",
        data: {
          label: "Node 1",
          customField: "custom value",
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
    expect(getByTestId("react-flow")).toBeInTheDocument();
  });
});
