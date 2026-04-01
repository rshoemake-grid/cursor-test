import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
    info: jest.fn()
  }
}));
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn()
}));
jest.mock("../api/client", () => ({
  api: {
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    getWorkflow: jest.fn(),
    executeWorkflow: jest.fn()
  }
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("./NodePanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "node-panel",
      children: "NodePanel"
    })
  };
});
jest.mock("./PropertyPanel", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "property-panel",
      children: "PropertyPanel"
    })
  };
});
jest.mock("./ExecutionConsole", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "execution-console",
      children: "ExecutionConsole"
    })
  };
});
jest.mock("./ExecutionInputDialog", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "execution-input-dialog",
      children: "ExecutionInputDialog"
    })
  };
});
jest.mock("./NodeContextMenu", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "node-context-menu",
      children: "NodeContextMenu"
    })
  };
});
jest.mock("./MarketplaceDialog", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "marketplace-dialog",
      children: "MarketplaceDialog"
    })
  };
});
jest.mock("./WorkflowCanvas", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      "data-testid": "workflow-canvas",
      children: "WorkflowCanvas"
    })
  };
});
jest.mock("./KeyboardHandler", () => ({
  __esModule: true,
  KeyboardHandler: () => null
}));
jest.mock("./ReactFlowInstanceCapture", () => ({
  __esModule: true,
  ReactFlowInstanceCapture: () => null
}));
jest.mock("./WorkflowBuilder/WorkflowBuilderLayout", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderLayout: () => /* @__PURE__ */jsxs("div", {
      "data-testid": "workflow-builder-layout",
      children: [/* @__PURE__ */jsx("div", {
        "data-testid": "node-panel",
        children: "NodePanel"
      }), /* @__PURE__ */jsx("div", {
        "data-testid": "workflow-canvas",
        children: "WorkflowCanvas"
      }), /* @__PURE__ */jsx("div", {
        "data-testid": "execution-console",
        children: "ExecutionConsole"
      }), /* @__PURE__ */jsx("div", {
        "data-testid": "property-panel",
        children: "PropertyPanel"
      })]
    })
  };
});
jest.mock("./WorkflowBuilder/WorkflowBuilderDialogs", () => {
  const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderDialogs: () => /* @__PURE__ */jsxs(Fragment, {
      children: [/* @__PURE__ */jsx("div", {
        "data-testid": "execution-input-dialog",
        children: "ExecutionInputDialog"
      }), /* @__PURE__ */jsx("div", {
        "data-testid": "node-context-menu",
        children: "NodeContextMenu"
      }), /* @__PURE__ */jsx("div", {
        "data-testid": "marketplace-dialog",
        children: "MarketplaceDialog"
      })]
    })
  };
});
jest.mock("./nodes", () => ({
  nodeTypes: {}
}));
jest.mock("@xyflow/react/dist/style.css", () => ({}));
jest.mock("@xyflow/react", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ...jest.requireActual("@xyflow/react"),
    ReactFlowProvider: ({
      children
    }) => /* @__PURE__ */jsx("div", {
      children
    }),
    useNodesState: () => [[], jest.fn(), jest.fn()],
    useEdgesState: () => [[], jest.fn(), jest.fn()]
  };
});
jest.mock("../hooks/storage", () => {
  return {
    useDraftManagement: () => ({
      loadDraft: jest.fn(),
      saveDraft: jest.fn(),
      clearDraft: jest.fn()
    }),
    loadDraftsFromStorage: () => ({}),
    useLocalStorage: jest.fn(),
    useAutoSave: jest.fn(),
    getLocalStorageItem: jest.fn(),
    setLocalStorageItem: jest.fn()
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
  setVariables: jest.fn()
}));
const mockUseWorkflowPersistence = jest.fn(() => ({
  saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
  exportWorkflow: jest.fn()
}));
const mockUseWorkflowUpdates = jest.fn(() => ({
  workflowNodeToNode: jest.fn()
}));
jest.mock("../hooks/workflow", () => ({
  useWorkflowPersistence: (...args) => mockUseWorkflowPersistence(...args),
  useWorkflowLoader: () => {
  },
  useWorkflowUpdateHandler: () => ({
    handleWorkflowUpdate: jest.fn()
  }),
  useWorkflowState: (...args) => mockUseWorkflowState(...args),
  useWorkflowUpdates: (...args) => mockUseWorkflowUpdates(...args),
  useWorkflowAPI: () => {
  },
  useWorkflowDeletion: () => {
  }
}));
const mockUseWorkflowExecution = jest.fn(() => ({
  executeWorkflow: jest.fn(),
  showInputs: false
}));
const mockUseExecutionManagement = jest.fn();
const mockUseWebSocket = jest.fn();
jest.mock("../hooks/execution", () => ({
  useWorkflowExecution: (...args) => mockUseWorkflowExecution(...args),
  useExecutionManagement: (...args) => mockUseExecutionManagement(...args),
  useWebSocket: (...args) => mockUseWebSocket(...args)
}));
jest.mock("../hooks/ui", () => ({
  useCanvasEvents: () => ({
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onConnect: jest.fn(),
    onNodeClick: jest.fn(),
    onPaneClick: jest.fn(),
    handleAddToAgentNodes: jest.fn(),
    handleAddToToolNodes: jest.fn()
  }),
  useContextMenu: () => ({
    contextMenu: null,
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    closeContextMenu: jest.fn()
  }),
  useClipboard: () => ({
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn()
  }),
  usePanelState: jest.fn(),
  useKeyboardShortcuts: jest.fn()
}));
const mockUseNodeSelection = jest.fn(() => ({
  selectedNodeId: null,
  setSelectedNodeId: jest.fn(),
  selectedNodeIds: [],
  handleNodesChange: jest.fn()
}));
jest.mock("../hooks/nodes", () => ({
  useNodeSelection: (...args) => mockUseNodeSelection(...args),
  useNodeOperations: jest.fn(),
  useNodeForm: jest.fn(),
  useSelectedNode: jest.fn(),
  useSelectionManager: jest.fn()
}));
jest.mock("../hooks/marketplace", () => ({
  useMarketplaceDialog: () => ({
    showMarketplaceDialog: false,
    marketplaceNode: null,
    openDialog: jest.fn(),
    closeDialog: jest.fn()
  }),
  useMarketplaceIntegration: () => ({
    isAddingAgentsRef: {
      current: false
    }
  }),
  useMarketplaceData: jest.fn(),
  useMarketplacePublishing: jest.fn(),
  useTemplateOperations: jest.fn(),
  useOfficialAgentSeeding: jest.fn()
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
    tabId: "tab-1",
    workflowId: null,
    tabName: "Untitled Workflow",
    tabIsUnsaved: false,
    workflowTabs: [],
    onExecutionStart: mockOnExecutionStart,
    onWorkflowSaved: mockOnWorkflowSaved,
    onWorkflowModified: mockOnWorkflowModified,
    onWorkflowLoaded: mockOnWorkflowLoaded,
    onExecutionLogUpdate: mockOnExecutionLogUpdate,
    onExecutionStatusUpdate: mockOnExecutionStatusUpdate,
    onExecutionNodeUpdate: mockOnExecutionNodeUpdate,
    onRemoveExecution: mockOnRemoveExecution
  };
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "testuser"
      },
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
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
      setVariables: jest.fn()
    }));
    mockUseWorkflowPersistence.mockImplementation(() => ({
      saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
      exportWorkflow: jest.fn()
    }));
    mockUseWorkflowUpdates.mockImplementation(() => ({
      workflowNodeToNode: jest.fn()
    }));
    mockUseWorkflowExecution.mockImplementation(() => ({
      executeWorkflow: jest.fn(),
      showInputs: false
    }));
    mockUseNodeSelection.mockImplementation(() => ({
      selectedNodeId: null,
      setSelectedNodeId: jest.fn(),
      selectedNodeIds: [],
      handleNodesChange: jest.fn()
    }));
  });
  describe("Component Rendering", () => {
    it("should render WorkflowBuilder with all child components", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
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
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps,
            workflowId: "workflow-1"
          })
        }));
      });
      await waitFor(() => {
        expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
      });
    });
    it("should render with tabIsUnsaved prop", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps,
            tabIsUnsaved: true
          })
        }));
      });
      await waitFor(() => {
        expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
      });
    });
  });
  describe("Imperative Handle", () => {
    it("should expose saveWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(/* @__PURE__ */jsx(ReactFlowProvider, {
        children: /* @__PURE__ */jsx(WorkflowBuilder, {
          ...defaultProps,
          ref
        })
      }));
      await waitFor(() => {
        expect(ref.current).toBeDefined();
        expect(ref.current?.saveWorkflow).toBeDefined();
        expect(typeof ref.current?.saveWorkflow).toBe("function");
      }, {
        timeout: 3e3
      });
    });
    it("should expose executeWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(/* @__PURE__ */jsx(ReactFlowProvider, {
        children: /* @__PURE__ */jsx(WorkflowBuilder, {
          ...defaultProps,
          ref
        })
      }));
      await waitFor(() => {
        expect(ref.current?.executeWorkflow).toBeDefined();
        expect(typeof ref.current?.executeWorkflow).toBe("function");
      }, {
        timeout: 3e3
      });
    });
    it("should expose exportWorkflow method via ref", async () => {
      const ref = React.createRef();
      render(/* @__PURE__ */jsx(ReactFlowProvider, {
        children: /* @__PURE__ */jsx(WorkflowBuilder, {
          ...defaultProps,
          ref
        })
      }));
      await waitFor(() => {
        expect(ref.current?.exportWorkflow).toBeDefined();
        expect(typeof ref.current?.exportWorkflow).toBe("function");
      }, {
        timeout: 3e3
      });
    });
    it("should call saveWorkflow when ref method is called", async () => {
      const ref = React.createRef();
      render(/* @__PURE__ */jsx(ReactFlowProvider, {
        children: /* @__PURE__ */jsx(WorkflowBuilder, {
          ...defaultProps,
          ref
        })
      }));
      await waitFor(() => {
        expect(ref.current?.saveWorkflow).toBeDefined();
      }, {
        timeout: 3e3
      });
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
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps,
            workflowId: null
          })
        }));
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should handle empty tabName", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps,
            tabName: ""
          })
        }));
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should handle all callback props", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
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
        clear: jest.fn()
      };
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps,
            storage: mockStorage
          })
        }));
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
    it("should use default storage adapter when not provided", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
  });
  describe("Hook Integration", () => {
    it("should call useWorkflowState hook", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
      });
      expect(mockUseWorkflowState).toHaveBeenCalled();
    });
    it("should call useNodeSelection hook", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
      });
      expect(mockUseNodeSelection).toHaveBeenCalled();
    });
    it("should call useWorkflowPersistence hook", async () => {
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
      });
      expect(mockUseWorkflowPersistence).toHaveBeenCalled();
    });
    it("should call useWorkflowExecution hook", async () => {
      require("../hooks/execution");
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...defaultProps
          })
        }));
      });
      expect(mockUseWorkflowExecution).toHaveBeenCalled();
    });
  });
  describe("Error Handling", () => {
    it("should handle missing callbacks gracefully", async () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onExecutionStart: void 0,
        onWorkflowSaved: void 0,
        onWorkflowModified: void 0
      };
      await act(async () => {
        render(/* @__PURE__ */jsx(ReactFlowProvider, {
          children: /* @__PURE__ */jsx(WorkflowBuilder, {
            ...propsWithoutCallbacks
          })
        }));
      });
      expect(screen.getByTestId("workflow-canvas")).toBeInTheDocument();
    });
  });
});
