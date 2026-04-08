import { render, screen, fireEvent } from "@testing-library/react";
import { WorkflowBuilderDialogs } from "./WorkflowBuilderDialogs";
jest.mock("../ExecutionInputDialog", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({ dialog, handlers }) =>
      dialog?.isOpen ? (
        <div data-testid="execution-input-dialog">
          <button onClick={handlers.onClose}>Close</button>
          <button onClick={() => handlers.onSubmit({})}>Submit</button>
        </div>
      ) : null,
  };
});
jest.mock("../NodeContextMenu", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({ onClose, onDelete, onCopy, onCut, onPaste }) => (
      <div data-testid="context-menu">
        <button onClick={onClose}>Close</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onCopy}>Copy</button>
        <button onClick={onCut}>Cut</button>
        <button onClick={onPaste}>Paste</button>
      </div>
    ),
  };
});
jest.mock("../MarketplaceDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({ isOpen, onClose }) =>
      isOpen ? (
        <div data-testid="marketplace-dialog">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  };
});
describe("WorkflowBuilderDialogs", () => {
  const mockNode = {
    id: "node-1",
    type: "agent",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      label: "Test Node",
    },
  };
  const defaultProps = {
    executionInput: {
      isOpen: false,
      onClose: jest.fn(),
      onSubmit: jest.fn(),
      nodes: [],
    },
    workflow: {
      name: "Test Workflow",
    },
    nodeContextMenu: {
      state: null,
      onClose: jest.fn(),
      onDeleteNode: jest.fn(),
      onCopy: jest.fn(),
      onCut: jest.fn(),
      onPaste: jest.fn(),
      onAddToAgentNodes: jest.fn(),
      onAddToToolNodes: jest.fn(),
      onSendToMarketplace: jest.fn(),
      canPaste: false,
    },
    marketplace: {
      isOpen: false,
      onClose: jest.fn(),
      node: null,
      workflowId: null,
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should not render dialogs when all are closed", () => {
    render(<WorkflowBuilderDialogs {...defaultProps} />);
    expect(
      screen.queryByTestId("execution-input-dialog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-dialog")).not.toBeInTheDocument();
  });
  it("should render execution input dialog when executionInput.isOpen is true", () => {
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        executionInput={{
          ...defaultProps.executionInput,
          isOpen: true,
        }}
      />,
    );
    expect(screen.getByTestId("execution-input-dialog")).toBeInTheDocument();
  });
  it("should call executionInput.onClose when execution dialog close is clicked", () => {
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        executionInput={{
          ...defaultProps.executionInput,
          isOpen: true,
        }}
      />,
    );
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.executionInput.onClose).toHaveBeenCalledTimes(1);
  });
  it("should call executionInput.onSubmit when execution dialog submit is clicked", () => {
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        executionInput={{
          ...defaultProps.executionInput,
          isOpen: true,
        }}
      />,
    );
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);
    expect(defaultProps.executionInput.onSubmit).toHaveBeenCalled();
  });
  it("should render context menu when nodeContextMenu.state is provided", () => {
    const contextMenuState = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    };
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        nodeContextMenu={{
          ...defaultProps.nodeContextMenu,
          state: contextMenuState,
        }}
      />,
    );
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });
  it("should call nodeContextMenu.onClose when backdrop is clicked", () => {
    const contextMenuState = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    };
    const { container } = render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        nodeContextMenu={{
          ...defaultProps.nodeContextMenu,
          state: contextMenuState,
        }}
      />,
    );
    const backdrop = container.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.nodeContextMenu.onClose).toHaveBeenCalledTimes(1);
    }
  });
  it("should call onDeleteNode when context menu delete is clicked", () => {
    const contextMenuState = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    };
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        nodeContextMenu={{
          ...defaultProps.nodeContextMenu,
          state: contextMenuState,
        }}
      />,
    );
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(defaultProps.nodeContextMenu.onDeleteNode).toHaveBeenCalledTimes(1);
  });
  it("should render marketplace dialog when marketplace.isOpen is true", () => {
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        marketplace={{
          ...defaultProps.marketplace,
          isOpen: true,
        }}
      />,
    );
    expect(screen.getByTestId("marketplace-dialog")).toBeInTheDocument();
  });
  it("should call marketplace.onClose when marketplace dialog close is clicked", () => {
    render(
      <WorkflowBuilderDialogs
        {...defaultProps}
        marketplace={{
          ...defaultProps.marketplace,
          isOpen: true,
        }}
      />,
    );
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.marketplace.onClose).toHaveBeenCalledTimes(1);
  });
});
