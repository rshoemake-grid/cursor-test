import { render, screen } from "@testing-library/react";
import { WorkflowBuilderLayout } from "./WorkflowBuilderLayout";
jest.mock("../NodePanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="node-panel">NodePanel</div>,
  };
});
jest.mock("../PropertyPanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="property-panel">PropertyPanel</div>,
  };
});
jest.mock("../WorkflowCanvas", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>,
  };
});
jest.mock("../ExecutionConsole", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="execution-console">ExecutionConsole</div>,
  };
});
jest.mock("../KeyboardHandler", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    KeyboardHandler: () => (
      <div data-testid="keyboard-handler">KeyboardHandler</div>
    ),
  };
});
jest.mock("../ReactFlowInstanceCapture", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ReactFlowInstanceCapture: () => (
      <div data-testid="react-flow-instance-capture">
        ReactFlowInstanceCapture
      </div>
    ),
  };
});
describe("WorkflowBuilderLayout", () => {
  const mockNodes = [];
  const mockEdges = [];
  const mockReactFlowInstanceRef = {
    current: null,
  };
  const defaultProps = {
    graph: {
      nodes: mockNodes,
      edges: mockEdges,
      nodeExecutionStates: {},
    },
    canvasHandlers: {
      onNodesChange: jest.fn(),
      onEdgesChange: jest.fn(),
      onConnect: jest.fn(),
      onDrop: jest.fn(),
      onDragOver: jest.fn(),
      onNodeClick: jest.fn(),
      onNodeContextMenu: jest.fn(),
      onEdgeContextMenu: jest.fn(),
      onPaneClick: jest.fn(),
    },
    selection: {
      selectedNodeId: null,
      setSelectedNodeId: jest.fn(),
      selectedNodeIds: new Set(),
      notifyModified: jest.fn(),
    },
    keyboard: {
      clipboardNode: null,
      onCopy: jest.fn(),
      onCut: jest.fn(),
      onPaste: jest.fn(),
    },
    reactFlow: {
      instanceRef: mockReactFlowInstanceRef,
    },
    executionConsole: {
      activeWorkflowId: null,
      workflowTabId: "tab-default",
      executions: [],
      activeExecutionId: null,
      onWorkflowUpdate: jest.fn(),
      getWorkflowChatCanvasSnapshot: null,
      workflowChatClearNonce: 0,
      onExecutionLogUpdate: jest.fn(),
      onExecutionStatusUpdate: jest.fn(),
      onExecutionNodeUpdate: jest.fn(),
      onRemoveExecution: jest.fn(),
    },
    propertyPanel: {
      onSaveWorkflow: jest.fn(),
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render all layout components", () => {
    render(<WorkflowBuilderLayout {...defaultProps} />);
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    expect(screen.getByTestId("property-panel")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("execution-console")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-handler")).toBeInTheDocument();
    expect(
      screen.getByTestId("react-flow-instance-capture"),
    ).toBeInTheDocument();
  });
  it("should have correct layout structure", () => {
    render(<WorkflowBuilderLayout {...defaultProps} />);
    expect(
      screen.getByTestId("workflow-builder-layout-row"),
    ).toBeInTheDocument();
  });
  it("should pass props to child components", () => {
    const props = {
      ...defaultProps,
      selection: {
        ...defaultProps.selection,
        selectedNodeId: "node-1",
      },
      executionConsole: {
        ...defaultProps.executionConsole,
        activeWorkflowId: "workflow-1",
      },
    };
    render(<WorkflowBuilderLayout {...props} />);
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    expect(screen.getByTestId("property-panel")).toBeInTheDocument();
  });
});
