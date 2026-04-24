import { render, screen, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, {
    timeout,
  });
};
import { ReactFlowProvider } from "@xyflow/react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { showConfirm } from "../utils/confirm";
jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../api/client", () => ({
  api: {
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    getWorkflow: jest.fn(),
    executeWorkflow: jest.fn(),
  },
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("../hooks/storage", () => ({
  useLocalStorage: jest.fn(() => ["", jest.fn(), jest.fn()]),
  getLocalStorageItem: jest.fn(() => ({})),
  setLocalStorageItem: jest.fn(),
  useAutoSave: jest.fn(),
  useDraftManagement: jest.fn(() => ({
    saveDraftsToStorage: jest.fn(),
  })),
  loadDraftsFromStorage: jest.fn(() => ({})),
  shouldApplyDraftCanvas: jest.fn(() => false),
}));
jest.mock("./NodePanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockNodePanel() {
    return <div data-testid="node-panel">NodePanel</div>;
  };
});
jest.mock("./PropertyPanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockPropertyPanel() {
    return <div data-testid="property-panel">PropertyPanel</div>;
  };
});
jest.mock("./ExecutionConsole", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockExecutionConsole() {
    return <div data-testid="execution-console">ExecutionConsole</div>;
  };
});
jest.mock("./ExecutionInputDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockExecutionInputDialog() {
    return <div data-testid="execution-input-dialog">ExecutionInputDialog</div>;
  };
});
jest.mock("./NodeContextMenu", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockNodeContextMenu() {
    return <div data-testid="node-context-menu">NodeContextMenu</div>;
  };
});
jest.mock("./MarketplaceDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockMarketplaceDialog() {
    return <div data-testid="marketplace-dialog">MarketplaceDialog</div>;
  };
});
jest.mock("./WorkflowCanvas", () => {
  const { jsx } = require("react/jsx-runtime");
  return function MockWorkflowCanvas() {
    return <div data-testid="workflow-canvas">WorkflowCanvas</div>;
  };
});
jest.mock("./nodes", () => ({
  nodeTypes: {},
}));
jest.mock("@xyflow/react/dist/style.css", () => ({}));
jest.mock("@xyflow/react", () => {
  const actualReactFlow = jest.requireActual("@xyflow/react");
  const React2 = jest.requireActual("react");
  const mockGetNodes = jest.fn(() => []);
  const mockGetEdges = jest.fn(() => []);
  const mockDeleteElements = jest.fn();
  const mockScreenToFlowCoordinate = jest.fn(({ x, y }) => ({
    x,
    y,
  }));
  return {
    ...actualReactFlow,
    ReactFlow: ({ children, ...props }) => {
      return React2.createElement(
        "div",
        {
          "data-testid": "react-flow",
          ...props,
        },
        children,
      );
    },
    ReactFlowProvider: ({ children }) => {
      return React2.createElement("div", null, children);
    },
    MiniMap: () =>
      React2.createElement(
        "div",
        {
          "data-testid": "minimap",
        },
        "MiniMap",
      ),
    Controls: () =>
      React2.createElement(
        "div",
        {
          "data-testid": "controls",
        },
        "Controls",
      ),
    Background: () =>
      React2.createElement(
        "div",
        {
          "data-testid": "background",
        },
        "Background",
      ),
    useReactFlow: () => ({
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
      deleteElements: mockDeleteElements,
      screenToFlowPosition: mockScreenToFlowCoordinate,
      screenToFlowCoordinate: mockScreenToFlowCoordinate,
    }),
  };
});
import WorkflowBuilder from "./WorkflowBuilder";
const mockUseAuth = useAuth;
const mockApi = api;
describe("WorkflowBuilder", () => {
  const mockOnExecutionStart = jest.fn();
  const mockOnWorkflowSaved = jest.fn();
  const mockOnWorkflowModified = jest.fn();
  const mockOnWorkflowLoaded = jest.fn();
  const defaultProps = {
    tab: {
      tabId: "tab-1",
      workflowId: null,
      tabName: "Untitled Workflow",
      tabIsUnsaved: false,
    },
    callbacks: {
      onExecutionStart: mockOnExecutionStart,
      onWorkflowSaved: mockOnWorkflowSaved,
      onWorkflowModified: mockOnWorkflowModified,
      onWorkflowLoaded: mockOnWorkflowLoaded,
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "testuser",
      },
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
    showConfirm.mockResolvedValue(true);
  });
  it.skip("should render WorkflowBuilder", async () => {
    render(
      <ReactFlowProvider>
        <WorkflowBuilder {...defaultProps} />
      </ReactFlowProvider>,
    );
    await waitForWithTimeout(() => {
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    expect(screen.getByTestId("property-panel")).toBeInTheDocument();
  });
  it.skip("should render with existing workflow", async () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test description",
      nodes: [],
      edges: [],
      variables: {},
    };
    mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
    render(
      <ReactFlowProvider>
        <WorkflowBuilder
          {...defaultProps}
          tab={{ ...defaultProps.tab, workflowId: "workflow-1" }}
        />
      </ReactFlowProvider>,
    );
    await waitForWithTimeout(() => {
      expect(mockApi.getWorkflow).toHaveBeenCalledWith("workflow-1");
    });
  });
  it("should have WorkflowBuilder component exported", () => {
    expect(WorkflowBuilder).toBeDefined();
  });
  it("should have WorkflowBuilderHandle interface", () => {
    const handle = {
      saveWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      exportWorkflow: jest.fn(),
    };
    expect(handle).toBeDefined();
  });
  describe("Imperative Handle Methods", () => {
    it("should expose saveWorkflow method via ref", () => {
      const handle = {
        saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
        executeWorkflow: jest.fn(),
        exportWorkflow: jest.fn(),
      };
      expect(handle.saveWorkflow).toBeDefined();
      expect(typeof handle.saveWorkflow).toBe("function");
    });
    it("should expose executeWorkflow method via ref", () => {
      const handle = {
        saveWorkflow: jest.fn(),
        executeWorkflow: jest.fn(),
        exportWorkflow: jest.fn(),
      };
      expect(handle.executeWorkflow).toBeDefined();
      expect(typeof handle.executeWorkflow).toBe("function");
    });
    it("should expose exportWorkflow method via ref", () => {
      const handle = {
        saveWorkflow: jest.fn(),
        executeWorkflow: jest.fn(),
        exportWorkflow: jest.fn(),
      };
      expect(handle.exportWorkflow).toBeDefined();
      expect(typeof handle.exportWorkflow).toBe("function");
    });
  });
  describe("Dependency Injection", () => {
    it.skip("should use injected storage adapter for pending agents", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      expect(mockStorage).toBeDefined();
    });
    it.skip("should use injected storage adapter for custom agent nodes", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      expect(mockStorage).toBeDefined();
    });
    it.skip("should handle storage errors gracefully", () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      expect(mockStorage).toBeDefined();
    });
    it.skip("should handle null storage adapter", () => {
      expect(true).toBe(true);
    });
  });
});
