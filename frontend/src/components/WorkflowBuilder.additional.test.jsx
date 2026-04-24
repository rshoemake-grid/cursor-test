import * as React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import WorkflowBuilder from "./WorkflowBuilder";
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
jest.mock("./NodePanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="node-panel">NodePanel</div>,
  };
});
jest.mock("./PropertyPanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="property-panel">PropertyPanel</div>,
  };
});
jest.mock("./ExecutionConsole", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="execution-console">ExecutionConsole</div>,
  };
});
jest.mock("./ExecutionInputDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => (
      <div data-testid="execution-input-dialog">ExecutionInputDialog</div>
    ),
  };
});
jest.mock("./NodeContextMenu", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="node-context-menu">NodeContextMenu</div>,
  };
});
jest.mock("./MarketplaceDialog", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => (
      <div data-testid="marketplace-dialog">MarketplaceDialog</div>
    ),
  };
});
jest.mock("./WorkflowCanvas", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>,
  };
});
jest.mock("./KeyboardHandler", () => ({
  __esModule: true,
  KeyboardHandler: () => null,
}));
jest.mock("./ReactFlowInstanceCapture", () => ({
  __esModule: true,
  ReactFlowInstanceCapture: () => null,
}));
jest.mock("./WorkflowBuilder/WorkflowBuilderLayout", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderLayout: () => (
      <div data-testid="workflow-builder-layout">
        <div data-testid="node-panel">NodePanel</div>
        <div data-testid="workflow-canvas">WorkflowCanvas</div>
        <div data-testid="execution-console">ExecutionConsole</div>
        <div data-testid="property-panel">PropertyPanel</div>
      </div>
    ),
  };
});
jest.mock("./WorkflowBuilder/WorkflowBuilderDialogs", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderDialogs: () => (
      <>
        <div data-testid="execution-input-dialog">ExecutionInputDialog</div>
        <div data-testid="node-context-menu">NodeContextMenu</div>
        <div data-testid="marketplace-dialog">MarketplaceDialog</div>
      </>
    ),
  };
});
jest.mock("./nodes", () => ({
  nodeTypes: {},
}));
jest.mock("@xyflow/react/dist/style.css", () => ({}));
jest.mock("@xyflow/react", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ...jest.requireActual("@xyflow/react"),
    ReactFlowProvider: ({ children }) => <div>{children}</div>,
    useNodesState: () => [[], jest.fn(), jest.fn()],
    useEdgesState: () => [[], jest.fn(), jest.fn()],
  };
});
jest.mock("../hooks/storage", () => {
  return {
    useDraftManagement: () => ({
      loadDraft: jest.fn(),
      saveDraft: jest.fn(),
      clearDraft: jest.fn(),
      saveDraftsToStorage: jest.fn(),
    }),
    loadDraftsFromStorage: () => ({}),
    shouldApplyDraftCanvas: jest.fn(() => false),
    useLocalStorage: jest.fn(),
    useAutoSave: jest.fn(),
    getLocalStorageItem: jest.fn(),
    setLocalStorageItem: jest.fn(),
  };
});
const mockUseWorkflowState = jest.fn(() => ({
  localWorkflowId: null,
  setLocalWorkflowId: jest.fn(),
  localWorkflowName: "",
  setLocalWorkflowName: jest.fn(),
  localWorkflowDescription: "",
  setLocalWorkflowDescription: jest.fn(),
  variables: {},
  setVariables: jest.fn(),
}));
const mockUseWorkflowPersistence = jest.fn(() => ({
  saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
  exportWorkflow: jest.fn(),
}));
const mockUseWorkflowUpdates = jest.fn(() => ({
  workflowNodeToNode: jest.fn(),
}));
jest.mock("../hooks/workflow", () => ({
  useWorkflowPersistence: (...args) => mockUseWorkflowPersistence(...args),
  useWorkflowLoader: () => {},
  useWorkflowUpdateHandler: () => ({
    handleWorkflowUpdate: jest.fn(),
  }),
  useWorkflowState: (...args) => mockUseWorkflowState(...args),
  useWorkflowUpdates: (...args) => mockUseWorkflowUpdates(...args),
  useWorkflowAPI: () => {},
  useWorkflowDeletion: () => {},
}));
const mockUseWorkflowExecution = jest.fn(() => ({
  executeWorkflow: jest.fn(),
  showInputs: false,
}));
const mockUseExecutionManagement = jest.fn();
const mockUseWebSocket = jest.fn();
jest.mock("../hooks/execution", () => ({
  useWorkflowExecution: (...args) => mockUseWorkflowExecution(...args),
  useExecutionManagement: (...args) => mockUseExecutionManagement(...args),
  useWebSocket: (...args) => mockUseWebSocket(...args),
}));
jest.mock("../hooks/ui", () => ({
  useCanvasEvents: () => ({
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onConnect: jest.fn(),
    onNodeClick: jest.fn(),
    onPaneClick: jest.fn(),
    handleAddToAgentNodes: jest.fn(),
    handleAddToToolNodes: jest.fn(),
  }),
  useContextMenu: () => ({
    contextMenu: null,
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    closeContextMenu: jest.fn(),
  }),
  useClipboard: () => ({
    clipboardHasContent: false,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
  }),
  usePanelState: jest.fn(),
  useKeyboardShortcuts: jest.fn(),
}));
const mockUseNodeSelection = jest.fn(() => ({
  selectedNodeId: null,
  setSelectedNodeId: jest.fn(),
  selectedNodeIds: [],
  handleNodesChange: jest.fn(),
}));
jest.mock("../hooks/nodes", () => ({
  useNodeSelection: (...args) => mockUseNodeSelection(...args),
  useNodeOperations: jest.fn(),
  useNodeForm: jest.fn(),
  useSelectedNode: jest.fn(),
  useSelectionManager: jest.fn(),
}));
jest.mock("../hooks/marketplace", () => ({
  useMarketplaceDialog: () => ({
    showMarketplaceDialog: false,
    marketplaceNode: null,
    openDialog: jest.fn(),
    closeDialog: jest.fn(),
  }),
  useMarketplaceIntegration: () => ({
    isAddingAgentsRef: {
      current: false,
    },
  }),
  useMarketplaceData: jest.fn(),
  useMarketplacePublishing: jest.fn(),
  useTemplateOperations: jest.fn(),
  useOfficialAgentSeeding: jest.fn(),
}));
const mockUseAuth = useAuth;
const mockApi = api;
describe("WorkflowBuilder - Additional Coverage", () => {
  const mockOnExecutionStart = jest.fn();
  const mockOnWorkflowSaved = jest.fn();
  const mockOnWorkflowModified = jest.fn();
  const mockOnWorkflowLoaded = jest.fn();
  const mockOnExecutionLogUpdate = jest.fn();
  const mockOnExecutionStatusUpdate = jest.fn();
  const mockOnExecutionNodeUpdate = jest.fn();
  const mockOnRemoveExecution = jest.fn();
  const defaultProps = {
    tab: {
      tabId: "tab-1",
      workflowId: null,
      tabName: "Untitled Workflow",
      tabIsUnsaved: false,
    },
    workflowTabs: [],
    callbacks: {
      onExecutionStart: mockOnExecutionStart,
      onWorkflowSaved: mockOnWorkflowSaved,
      onWorkflowModified: mockOnWorkflowModified,
      onWorkflowLoaded: mockOnWorkflowLoaded,
      onExecutionLogUpdate: mockOnExecutionLogUpdate,
      onExecutionStatusUpdate: mockOnExecutionStatusUpdate,
      onExecutionNodeUpdate: mockOnExecutionNodeUpdate,
      onRemoveExecution: mockOnRemoveExecution,
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
    mockUseWorkflowState.mockImplementation(() => ({
      localWorkflowId: null,
      setLocalWorkflowId: jest.fn(),
      localWorkflowName: "",
      setLocalWorkflowName: jest.fn(),
      localWorkflowDescription: "",
      setLocalWorkflowDescription: jest.fn(),
      variables: {},
      setVariables: jest.fn(),
    }));
    mockUseWorkflowPersistence.mockImplementation(() => ({
      saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
      exportWorkflow: jest.fn(),
    }));
    mockUseWorkflowUpdates.mockImplementation(() => ({
      workflowNodeToNode: jest.fn(),
    }));
    mockUseWorkflowExecution.mockImplementation(() => ({
      executeWorkflow: jest.fn(),
      showInputs: false,
    }));
    mockUseNodeSelection.mockImplementation(() => ({
      selectedNodeId: null,
      setSelectedNodeId: jest.fn(),
      selectedNodeIds: [],
      handleNodesChange: jest.fn(),
    }));
  });
  describe("Component Rendering", () => {
    it("should render WorkflowBuilder with all child components", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
      });
      expect(screen.getByTestId("node-panel")).toBeInTheDocument();
      expect(screen.getByTestId("property-panel")).toBeInTheDocument();
      expect(screen.getByTestId("execution-console")).toBeInTheDocument();
    });
    it("should render with workflowId prop", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder
              {...defaultProps}
              tab={{ ...defaultProps.tab, workflowId: "workflow-1" }}
            />
          </ReactFlowProvider>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
      });
    });
    it("should render with tabIsUnsaved prop", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder
              {...defaultProps}
              tab={{ ...defaultProps.tab, tabIsUnsaved: true }}
            />
          </ReactFlowProvider>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
      });
    });
  });
  describe("Imperative Handle", () => {
    it("should expose saveWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>,
      );
      await waitFor(
        () => {
          expect(ref.current).toBeDefined();
          expect(ref.current?.saveWorkflow).toBeDefined();
          expect(typeof ref.current?.saveWorkflow).toBe("function");
        },
        {
          timeout: 3e3,
        },
      );
    });
    it("should expose executeWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>,
      );
      await waitFor(
        () => {
          expect(ref.current?.executeWorkflow).toBeDefined();
          expect(typeof ref.current?.executeWorkflow).toBe("function");
        },
        {
          timeout: 3e3,
        },
      );
    });
    it("should expose exportWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>,
      );
      await waitFor(
        () => {
          expect(ref.current?.exportWorkflow).toBeDefined();
          expect(typeof ref.current?.exportWorkflow).toBe("function");
        },
        {
          timeout: 3e3,
        },
      );
    });
    it("should call saveWorkflow when ref method is called", async () => {
      const ref = React.createRef();
      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>,
      );
      await waitFor(
        () => {
          expect(ref.current?.saveWorkflow).toBeDefined();
        },
        {
          timeout: 3e3,
        },
      );
      if (ref.current?.saveWorkflow) {
        await act(async () => {
          await ref.current.saveWorkflow();
        });
      }
    });
  });
  describe("Props Handling", () => {
    it("should handle null workflowId", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder
              {...defaultProps}
              tab={{ ...defaultProps.tab, workflowId: null }}
            />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should handle empty tabName", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder
              {...defaultProps}
              tab={{ ...defaultProps.tab, tabName: "" }}
            />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should handle all callback props", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
  });
  describe("Dependency Injection", () => {
    it("should accept custom storage adapter", async () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} storage={mockStorage} />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should use default storage adapter when not provided", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
  });
  describe("Hook Integration", () => {
    it("should call useWorkflowState hook", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(mockUseWorkflowState).toHaveBeenCalled();
    });
    it("should call useNodeSelection hook", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(mockUseNodeSelection).toHaveBeenCalled();
    });
    it("should call useWorkflowPersistence hook", async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(mockUseWorkflowPersistence).toHaveBeenCalled();
    });
    it("should call useWorkflowExecution hook", async () => {
      require("../hooks/execution");
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>,
        );
      });
      expect(mockUseWorkflowExecution).toHaveBeenCalled();
    });
  });
  describe("Error Handling", () => {
    it("should handle missing callbacks gracefully", async () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        callbacks: {
          ...defaultProps.callbacks,
          onExecutionStart: void 0,
          onWorkflowSaved: void 0,
          onWorkflowModified: void 0,
        },
      };
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...propsWithoutCallbacks} />
          </ReactFlowProvider>,
        );
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
  });
});
