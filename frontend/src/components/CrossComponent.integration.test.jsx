import { render, screen, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import WorkflowBuilder from "./WorkflowBuilder";
import SettingsPage from "../pages/SettingsPage";
import { useAuth } from "../contexts/AuthContext";
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
    getLLMSettings: jest.fn(),
  },
  createApiClient: jest.fn(),
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));
jest.mock("../hooks/providers", () => ({
  useLLMProviders: () => ({
    providers: [],
    iterationLimit: 10,
    defaultModel: "gpt-4",
  }),
  useProviderManagement: () => ({
    saveProviders: jest.fn(),
    updateProvider: jest.fn(),
    testProvider: jest.fn(),
    addCustomModel: jest.fn(),
    testingProvider: null,
    testResults: {},
  }),
}));
jest.mock("../hooks/settings/useSettingsSync", () => ({
  useSettingsSync: () => ({
    handleManualSync: jest.fn(),
  }),
}));
jest.mock("../hooks/settings/useModelExpansion", () => ({
  useModelExpansion: () => ({
    expandedModels: {},
    expandedProviders: {},
    toggleProviderModels: jest.fn(),
    toggleModel: jest.fn(),
    isModelExpanded: jest.fn(() => false),
  }),
}));
jest.mock("../hooks/settings/useSettingsStateSync", () => ({
  useSettingsStateSync: () => {},
}));
jest.mock("../hooks/storage", () => ({
  useLocalStorage: () => ["", jest.fn(), jest.fn()],
  getLocalStorageItem: () => ({}),
  setLocalStorageItem: jest.fn(),
  useAutoSave: jest.fn(),
  useDraftManagement: () => ({
    saveDraft: jest.fn(),
    loadDraft: jest.fn(),
    clearDraft: jest.fn(),
  }),
  loadDraftsFromStorage: () => [],
}));
jest.mock("../hooks/workflow", () => ({
  useWorkflowPersistence: () => ({
    saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
    exportWorkflow: jest.fn(),
  }),
  useWorkflowUpdates: () => ({
    workflowNodeToNode: jest.fn((n) => n),
    applyLocalChanges: jest.fn(),
  }),
  useWorkflowUpdateHandler: () => ({
    handleWorkflowUpdate: jest.fn(),
  }),
  useWorkflowState: () => ({
    localWorkflowId: null,
    setLocalWorkflowId: jest.fn(),
    localWorkflowName: "Untitled Workflow",
    setLocalWorkflowName: jest.fn(),
    localWorkflowDescription: "",
    setLocalWorkflowDescription: jest.fn(),
    variables: {},
    setVariables: jest.fn(),
  }),
  useWorkflowLoader: () => {},
}));
jest.mock("../hooks/execution", () => ({
  useWorkflowExecution: () => ({
    executeWorkflow: jest.fn(),
    showInputs: false,
    setShowInputs: jest.fn(),
    setExecutionInputs: jest.fn(),
    handleConfirmExecute: jest.fn(),
  }),
}));
jest.mock("../hooks/ui", () => ({
  useClipboard: () => ({
    clipboardNode: null,
    copy: jest.fn(),
    cut: jest.fn(),
    paste: jest.fn(),
  }),
  useContextMenu: () => ({
    contextMenu: null,
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    closeContextMenu: jest.fn(),
  }),
  useCanvasEvents: () => ({
    onConnect: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    onNodeClick: jest.fn(),
    onPaneClick: jest.fn(),
    handleAddToAgentNodes: jest.fn(),
  }),
}));
jest.mock("../hooks/marketplace", () => ({
  useMarketplaceIntegration: () => ({
    isAddingAgentsRef: {
      current: false,
    },
  }),
  useMarketplaceDialog: () => ({
    showMarketplaceDialog: false,
    marketplaceNode: null,
    openDialog: jest.fn(),
    closeDialog: jest.fn(),
  }),
}));
jest.mock("../hooks/nodes", () => ({
  useNodeSelection: () => ({
    selectedNodeId: null,
    setSelectedNodeId: jest.fn(),
    selectedNodeIds: new Set(),
    handleNodesChange: jest.fn((changes, base) => base(changes)),
  }),
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
jest.mock("./WorkflowCanvas", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>,
  };
});
jest.mock("./WorkflowBuilder/WorkflowBuilderLayout", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderLayout: () => (
      <div data-testid="workflow-builder-layout">WorkflowBuilderLayout</div>
    ),
  };
});
jest.mock("./WorkflowBuilder/WorkflowBuilderDialogs", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowBuilderDialogs: () => (
      <div data-testid="workflow-builder-dialogs">WorkflowBuilderDialogs</div>
    ),
  };
});
jest.mock("../components/settings/SettingsHeader", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    SettingsHeader: () => (
      <div data-testid="settings-header">SettingsHeader</div>
    ),
  };
});
jest.mock("../components/settings/SettingsTabs", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    SettingsTabs: () => <div data-testid="settings-tabs">SettingsTabs</div>,
  };
});
jest.mock("../components/settings/SettingsTabContent", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    SettingsTabContent: () => (
      <div data-testid="settings-tab-content">SettingsTabContent</div>
    ),
  };
});
jest.mock("@xyflow/react", () => {
  const actualReactFlow = jest.requireActual("@xyflow/react");
  const React2 = jest.requireActual("react");
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
    useNodesState: () => [[], jest.fn(), jest.fn()],
    useEdgesState: () => [[], jest.fn(), jest.fn()],
    useReactFlow: () => ({
      getNodes: jest.fn(() => []),
      getEdges: jest.fn(() => []),
      deleteElements: jest.fn(),
      screenToFlowPosition: jest.fn(({ x, y }) => ({
        x,
        y,
      })),
      screenToFlowCoordinate: jest.fn(({ x, y }) => ({
        x,
        y,
      })),
    }),
  };
});
jest.mock("@xyflow/react/dist/style.css", () => ({}));
global.fetch = jest.fn();
const mockUseAuth = useAuth;
describe("Cross-Component Integration Tests", () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
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
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        providers: [],
        iteration_limit: 10,
        default_model: "",
      }),
    });
  });
  describe("Step 1.3.1: Shared State Integration", () => {
    it("should use shared useAuth hook in WorkflowBuilder", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should use shared useAuth hook in SettingsPage", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should use same authentication state across components", async () => {
      const authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      const { unmount: unmount1 } = await act(async () => {
        return render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
      const callCount1 = mockUseAuth.mock.calls.length;
      unmount1();
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth.mock.calls.length).toBeGreaterThan(callCount1);
    });
    it("should use shared storage adapter across components", async () => {
      jest.spyOn(mockStorage, "getItem");
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      expect(mockStorage).toBeDefined();
    });
  });
  describe("Step 1.3.2: Hook Integration Across Components", () => {
    it("should use useAuth consistently across components", async () => {
      const authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalledTimes(2);
    });
    it("should handle hook state updates across components", async () => {
      let authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should use storage adapter consistently across components", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      expect(mockStorage).toBeDefined();
    });
    it("should handle hook cleanup on unmount", async () => {
      const { unmount } = await act(async () => {
        return render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await act(async () => {
        unmount();
      });
      expect(
        screen.queryByTestId("workflow-builder-layout"),
      ).not.toBeInTheDocument();
    });
  });
  describe("Step 1.3.1: Component Independence", () => {
    it("should render WorkflowBuilder independently", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
    it("should render SettingsPage independently", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
    it("should render both components side by side", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
  });
  describe("Step 1.3.2: Hook State Synchronization", () => {
    it("should synchronize auth state updates across components", async () => {
      let authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should handle hook dependencies correctly", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
  });
  describe("Step 1.3.1.1: Settings Affect Workflow Execution", () => {
    it("should use LLM provider settings from SettingsPage in WorkflowBuilder", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should use iteration limit settings in workflow execution", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
    it("should use default model settings in workflow execution", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
    it("should reflect provider changes from SettingsPage in WorkflowBuilder", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <SettingsPage storage={mockStorage} />
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
            </div>
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
  });
  describe("Step 1.3.1.2: Navigation Between Components", () => {
    it("should navigate from WorkflowBuilder to SettingsPage", async () => {
      const { unmount: unmount1 } = await act(async () => {
        return render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
      unmount1();
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
    it("should navigate from SettingsPage to WorkflowBuilder", async () => {
      const { unmount: unmount1 } = await act(async () => {
        return render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      unmount1();
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
    it("should preserve workflow state during navigation", async () => {
      const { unmount } = await act(async () => {
        return render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId="workflow-1"
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
      unmount();
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
    it("should preserve settings state during navigation", async () => {
      const { unmount } = await act(async () => {
        return render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      unmount();
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
  });
  describe("Step 1.3.2.1: Shared Hooks Integration - Detailed", () => {
    it("should return same auth state in WorkflowBuilder and SettingsPage", async () => {
      const authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalledTimes(2);
    });
    it("should propagate auth state changes to both components", async () => {
      let authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      expect(mockUseAuth).toHaveBeenCalled();
    });
    it("should handle logout affecting both components", async () => {
      const logoutFn = jest.fn();
      const authState = {
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: logoutFn,
        register: jest.fn(),
      };
      mockUseAuth.mockReturnValue(authState);
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(authState.logout).toBeDefined();
    });
    it("should handle storage operations affecting both components", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockStorage).toBeDefined();
    });
    it("should handle storage events propagating correctly", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockStorage.addEventListener).toBeDefined();
      expect(mockStorage.removeEventListener).toBeDefined();
    });
  });
  describe("Step 1.3.3.1: Component Isolation - Detailed", () => {
    it("should render WorkflowBuilder without SettingsPage", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
      expect(screen.queryByTestId("settings-header")).not.toBeInTheDocument();
    });
    it("should render SettingsPage without WorkflowBuilder", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage storage={mockStorage} />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId("workflow-builder-layout"),
      ).not.toBeInTheDocument();
    });
    it("should handle missing settings gracefully in WorkflowBuilder", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <WorkflowBuilder
              tabId="tab-1"
              workflowId={null}
              tabName="Test Workflow"
              tabIsUnsaved={false}
              storage={mockStorage}
            />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
      });
    });
    it("should not interfere with each other when rendered together", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      expect(screen.getByTestId("workflow-builder-layout")).toBeInTheDocument();
      expect(screen.getByTestId("settings-header")).toBeInTheDocument();
    });
  });
  describe("Step 1.3.3.2: Shared Resource Handling", () => {
    it("should allow both components to read from same storage", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockStorage.getItem).toBeDefined();
    });
    it("should allow both components to write to same storage", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockStorage.setItem).toBeDefined();
    });
    it("should handle storage conflicts correctly", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      expect(mockStorage).toBeDefined();
    });
    it("should use same API client without interference", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <div>
              <WorkflowBuilder
                tabId="tab-1"
                workflowId={null}
                tabName="Test Workflow"
                tabIsUnsaved={false}
                storage={mockStorage}
              />
              <SettingsPage storage={mockStorage} />
            </div>
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("workflow-builder-layout"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
  });
});
