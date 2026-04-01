import { jsx, jsxs } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkflowBuilderDialogs } from "./WorkflowBuilderDialogs";
jest.mock("../ExecutionInputDialog", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      onSubmit
    }) => isOpen ? /* @__PURE__ */jsxs("div", {
      "data-testid": "execution-input-dialog",
      children: [/* @__PURE__ */jsx("button", {
        onClick: onClose,
        children: "Close"
      }), /* @__PURE__ */jsx("button", {
        onClick: () => onSubmit({}),
        children: "Submit"
      })]
    }) : null
  };
});
jest.mock("../NodeContextMenu", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({
      onClose,
      onDelete,
      onCopy,
      onCut,
      onPaste
    }) => /* @__PURE__ */jsxs("div", {
      "data-testid": "context-menu",
      children: [/* @__PURE__ */jsx("button", {
        onClick: onClose,
        children: "Close"
      }), /* @__PURE__ */jsx("button", {
        onClick: onDelete,
        children: "Delete"
      }), /* @__PURE__ */jsx("button", {
        onClick: onCopy,
        children: "Copy"
      }), /* @__PURE__ */jsx("button", {
        onClick: onCut,
        children: "Cut"
      }), /* @__PURE__ */jsx("button", {
        onClick: onPaste,
        children: "Paste"
      })]
    })
  };
});
jest.mock("../MarketplaceDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({
      isOpen,
      onClose
    }) => isOpen ? /* @__PURE__ */jsx("div", {
      "data-testid": "marketplace-dialog",
      children: /* @__PURE__ */jsx("button", {
        onClick: onClose,
        children: "Close"
      })
    }) : null
  };
});
describe("WorkflowBuilderDialogs", () => {
  const mockNode = {
    id: "node-1",
    type: "agent",
    position: {
      x: 0,
      y: 0
    },
    data: {
      label: "Test Node"
    }
  };
  const defaultProps = {
    showInputs: false,
    onCloseInputs: jest.fn(),
    onConfirmExecute: jest.fn(),
    executionNodes: [],
    workflowName: "Test Workflow",
    contextMenu: null,
    onCloseContextMenu: jest.fn(),
    onDeleteNode: jest.fn(),
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
    onAddToAgentNodes: jest.fn(),
    onSendToMarketplace: jest.fn(),
    canPaste: false,
    showMarketplaceDialog: false,
    onCloseMarketplaceDialog: jest.fn(),
    marketplaceNode: null,
    workflowId: null
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should not render dialogs when all are closed", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps
    }));
    expect(screen.queryByTestId("execution-input-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-dialog")).not.toBeInTheDocument();
  });
  it("should render execution input dialog when showInputs is true", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      showInputs: true
    }));
    expect(screen.getByTestId("execution-input-dialog")).toBeInTheDocument();
  });
  it("should call onCloseInputs when execution dialog close is clicked", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      showInputs: true
    }));
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.onCloseInputs).toHaveBeenCalledTimes(1);
  });
  it("should call onConfirmExecute when execution dialog submit is clicked", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      showInputs: true
    }));
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);
    expect(defaultProps.onConfirmExecute).toHaveBeenCalled();
  });
  it("should render context menu when contextMenu is provided", () => {
    const contextMenu = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200
    };
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      contextMenu
    }));
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });
  it("should call onCloseContextMenu when backdrop is clicked", () => {
    const contextMenu = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200
    };
    const {
      container
    } = render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      contextMenu
    }));
    const backdrop = container.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onCloseContextMenu).toHaveBeenCalledTimes(1);
    }
  });
  it("should call onDeleteNode when context menu delete is clicked", () => {
    const contextMenu = {
      nodeId: "node-1",
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200
    };
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      contextMenu
    }));
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(defaultProps.onDeleteNode).toHaveBeenCalledTimes(1);
  });
  it("should render marketplace dialog when showMarketplaceDialog is true", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      showMarketplaceDialog: true
    }));
    expect(screen.getByTestId("marketplace-dialog")).toBeInTheDocument();
  });
  it("should call onCloseMarketplaceDialog when marketplace dialog close is clicked", () => {
    render(/* @__PURE__ */jsx(WorkflowBuilderDialogs, {
      ...defaultProps,
      showMarketplaceDialog: true
    }));
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.onCloseMarketplaceDialog).toHaveBeenCalledTimes(1);
  });
});
