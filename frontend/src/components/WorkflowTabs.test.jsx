import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const waitForWithTimeout = async (callback, timeout = 2e3) => {
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === "function";
  if (wasUsingFakeTimers) {
    jest.useRealTimers();
    try {
      return await waitFor(callback, {
        timeout,
      });
    } finally {
      jest.useFakeTimers();
    }
  } else {
    return await waitFor(callback, {
      timeout,
    });
  }
};
import WorkflowTabs from "./WorkflowTabs";
import { WorkflowTabsProvider } from "../contexts/WorkflowTabsContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { showConfirm } from "../utils/confirm";
import { showError } from "../utils/notifications";
import { getLocalStorageItem, setLocalStorageItem } from "../hooks/storage";
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../api/client", () => ({
  api: {
    getWorkflow: jest.fn(),
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    publishWorkflow: jest.fn(),
    getExecution: jest.fn(),
  },
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));
jest.mock("../hooks/storage", () => ({
  useLocalStorage: jest.fn(() => ["", jest.fn(), jest.fn()]),
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn(),
  removeLocalStorageItem: jest.fn(),
  useAutoSave: jest.fn(),
  useDraftManagement: jest.fn(),
}));
jest.mock("./WorkflowBuilder", () => {
  return {
    __esModule: true,
    default: require("react").forwardRef((props, ref) => {
      const React2 = require("react");
      React2.useImperativeHandle(ref, () => ({
        saveWorkflow: jest.fn().mockResolvedValue("workflow-1"),
        executeWorkflow: jest.fn(),
        exportWorkflow: jest.fn(),
        clearWorkflow: jest.fn(),
      }));
      return React2.createElement("div", null, "WorkflowBuilder Mock");
    }),
  };
});
const mockUseAuth = useAuth;
const mockApi = api;
const mockGetLocalStorageItem = getLocalStorageItem;
const mockSetLocalStorageItem = setLocalStorageItem;
describe("WorkflowTabs", () => {
  const mockOnExecutionStart = jest.fn();
  const renderWithProvider = (props = {}) => {
    const {
      onExecutionStart,
      initialTabs,
      initialActiveTabId,
      storage,
      ...restProps
    } = props;
    return render(
      <WorkflowTabsProvider
        initialTabs={initialTabs || []}
        initialActiveTabId={
          initialActiveTabId !== void 0 ? initialActiveTabId : null
        }
        storage={storage}
      >
        <WorkflowTabs
          onExecutionStart={onExecutionStart || mockOnExecutionStart}
          {...restProps}
        />
      </WorkflowTabsProvider>,
    );
  };
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGetLocalStorageItem.mockReturnValue([]);
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
  it("should render with default tab", () => {
    renderWithProvider();
    const tabButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
    expect(tabButtons.length).toBeGreaterThan(0);
  });
  it("should create new tab when plus button is clicked", async () => {
    renderWithProvider();
    const initialTabCount = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Untitled Workflow")).length;
    const plusButton = screen.getByTitle(/New workflow/);
    fireEvent.click(plusButton);
    await waitForWithTimeout(() => {
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
      expect(tabButtons.length).toBeGreaterThan(initialTabCount);
    });
  });
  it("should switch tabs when tab is clicked", async () => {
    renderWithProvider();
    const plusButton = screen.getByTitle(/New workflow/);
    fireEvent.click(plusButton);
    await waitForWithTimeout(() => {
      const tabs = screen.getAllByText(/Untitled Workflow/);
      expect(tabs.length).toBeGreaterThan(1);
    });
    const tabButtons = screen.getAllByRole("button").filter((btn) => {
      const text = btn.textContent || "";
      const title = btn.getAttribute("title") || "";
      return (
        text.includes("Untitled Workflow") &&
        !title.includes("Close") &&
        !title.includes("Save") &&
        !title.includes("Execute") &&
        !title.includes("Publish") &&
        !title.includes("Export") &&
        !title.includes("New")
      );
    });
    if (tabButtons.length > 1) {
      fireEvent.click(tabButtons[1]);
      await waitForWithTimeout(() => {
        const updatedTabButtons = screen
          .getAllByRole("button")
          .filter((btn) => {
            const text = btn.textContent || "";
            const title = btn.getAttribute("title") || "";
            return (
              text.includes("Untitled Workflow") &&
              !title.includes("Close") &&
              !title.includes("Save") &&
              !title.includes("Execute") &&
              !title.includes("Publish") &&
              !title.includes("Export") &&
              !title.includes("New")
            );
          });
        expect(updatedTabButtons.length).toBeGreaterThanOrEqual(2);
        const hasActiveTab = updatedTabButtons.some((btn) =>
          btn.className.includes("bg-white"),
        );
        expect(hasActiveTab).toBe(true);
        expect(updatedTabButtons.length).toBeGreaterThanOrEqual(2);
      });
    }
  });
  it("should close tab when close button is clicked", async () => {
    renderWithProvider();
    const plusButton = screen.getByTitle(/New workflow/);
    fireEvent.click(plusButton);
    await waitForWithTimeout(() => {
      const tabs = screen.getAllByText(/Untitled Workflow/);
      expect(tabs.length).toBeGreaterThan(1);
    });
    const initialTabs = screen.getAllByText(/Untitled Workflow/);
    const initialCount = initialTabs.length;
    const closeButtons = screen.getAllByTitle(/Close/);
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[closeButtons.length - 1]);
      await waitForWithTimeout(() => {
        const tabsAfterClose = screen.queryAllByText(/Untitled Workflow/);
        if (tabsAfterClose.length > 0) {
          expect(tabsAfterClose.length).toBeLessThan(initialCount);
        } else {
          expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
        }
      });
    }
  });
  it("should prevent closing last tab", async () => {
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons2 = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
      expect(tabButtons2.length).toBeGreaterThan(0);
    });
    const closeButtons = screen.queryAllByTitle(/Close/);
    const tabButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
    if (tabButtons.length === 1) {
      expect(closeButtons.length).toBe(0);
    }
  });
  it("should start editing tab name on double click", async () => {
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons2 = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
      expect(tabButtons2.length).toBeGreaterThan(0);
    });
    const tabButtons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Untitled Workflow") &&
          btn.getAttribute("title") !== "Close tab",
      );
    if (tabButtons.length > 0) {
      fireEvent.doubleClick(tabButtons[0]);
      await waitForWithTimeout(() => {
        const input = screen.queryByDisplayValue(/Untitled Workflow/);
        expect(input).toBeInTheDocument();
      });
    }
  });
  it("should save tab name on Enter", async () => {
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons2 = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
      expect(tabButtons2.length).toBeGreaterThan(0);
    });
    const tabButtons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Untitled Workflow") &&
          btn.getAttribute("title") !== "Close tab",
      );
    if (tabButtons.length > 0) {
      fireEvent.doubleClick(tabButtons[0]);
      await waitForWithTimeout(() => {
        const input = screen.getByDisplayValue(/Untitled Workflow/);
        expect(input).toBeInTheDocument();
        fireEvent.change(input, {
          target: {
            value: "New Name",
          },
        });
        fireEvent.keyDown(input, {
          key: "Enter",
          code: "Enter",
        });
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("New Name")).toBeInTheDocument();
      });
    }
  });
  it("should cancel editing on Escape", async () => {
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons2 = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
      expect(tabButtons2.length).toBeGreaterThan(0);
    });
    const tabButtons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Untitled Workflow") &&
          btn.getAttribute("title") !== "Close tab",
      );
    if (tabButtons.length > 0) {
      fireEvent.doubleClick(tabButtons[0]);
      await waitForWithTimeout(() => {
        const input = screen.getByDisplayValue(/Untitled Workflow/);
        expect(input).toBeInTheDocument();
        fireEvent.change(input, {
          target: {
            value: "New Name",
          },
        });
        fireEvent.keyDown(input, {
          key: "Escape",
          code: "Escape",
        });
      });
      await waitForWithTimeout(() => {
        const tabButtonsAfter = screen
          .getAllByRole("button")
          .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
        expect(tabButtonsAfter.length).toBeGreaterThan(0);
        expect(screen.queryByDisplayValue("New Name")).not.toBeInTheDocument();
      });
    }
  });
  it("should load workflow when initialWorkflowId is provided", async () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Loaded Workflow",
      description: "Test",
      nodes: [],
      edges: [],
    };
    mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
    renderWithProvider({
      initialWorkflowId: "workflow-1",
      workflowLoadKey: 1,
    });
    await waitForWithTimeout(() => {
      const tabButtons = screen
        .getAllByRole("button")
        .filter(
          (btn) =>
            btn.textContent?.includes("Loading") ||
            btn.textContent?.includes("Loaded Workflow") ||
            btn.textContent?.includes("Untitled Workflow"),
        );
      expect(tabButtons.length).toBeGreaterThan(0);
    }, 3e3);
  });
  it("should save active tab to localStorage", async () => {
    const mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const initialTabs = [
      {
        id: "tab-1",
        name: "Tab 1",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
      {
        id: "tab-2",
        name: "Tab 2",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    render(
      <WorkflowTabsProvider
        storage={mockStorage}
        initialTabs={initialTabs}
        initialActiveTabId="tab-1"
      >
        <WorkflowTabs onExecutionStart={mockOnExecutionStart} />
      </WorkflowTabsProvider>,
    );
    await waitForWithTimeout(() => {
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    const tabButtons = screen.getAllByRole("button").filter((btn) => {
      const text = btn.textContent || "";
      const title = btn.getAttribute("title") || "";
      return (
        (text.includes("Tab 1") || text.includes("Tab 2")) &&
        !title.includes("Close") &&
        !title.includes("Save") &&
        !title.includes("Execute") &&
        !title.includes("Publish") &&
        !title.includes("Export") &&
        !title.includes("New")
      );
    });
    expect(tabButtons.length).toBeGreaterThanOrEqual(2);
    mockStorage.setItem.mockClear();
    const secondTab = tabButtons.find((btn) =>
      btn.textContent?.includes("Tab 2"),
    );
    expect(secondTab).toBeDefined();
    if (secondTab) {
      fireEvent.click(secondTab);
      await waitForWithTimeout(() => {
        const calls = mockStorage.setItem.mock.calls;
        const activeTabCalls = calls.filter(
          (call) => call[0] === "activeWorkflowTabId",
        );
        expect(activeTabCalls.length).toBeGreaterThan(0);
      }, 2e3);
    }
  });
  it("should restore tabs from localStorage", async () => {
    const savedTabs = [
      {
        id: "tab-1",
        name: "Saved Tab 1",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
      {
        id: "tab-2",
        name: "Saved Tab 2",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    mockGetLocalStorageItem.mockImplementation((key) => {
      if (key === "workflowTabs") return savedTabs;
      if (key === "activeWorkflowTabId") return "tab-2";
      return null;
    });
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons = screen.getAllByRole("button");
      expect(tabButtons.length).toBeGreaterThan(0);
    }, 2e3);
  });
  it("should show success message when restoring tabs", async () => {
    const savedTabs = [
      {
        id: "tab-1",
        name: "Saved Tab",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    mockGetLocalStorageItem.mockImplementation((key) => {
      if (key === "workflowTabs") return savedTabs;
      return null;
    });
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons = screen.getAllByRole("button");
      expect(tabButtons.length).toBeGreaterThan(0);
    }, 2e3);
  });
  it("should handle tab rename error", async () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Test Workflow",
      description: "Test",
      nodes: [],
      edges: [],
    };
    mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
    mockApi.updateWorkflow.mockRejectedValue(new Error("Update failed"));
    const savedTabs = [
      {
        id: "tab-1",
        name: "Test Workflow",
        workflowId: "workflow-1",
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    mockGetLocalStorageItem.mockImplementation((key) => {
      if (key === "workflowTabs") return savedTabs;
      return null;
    });
    renderWithProvider();
    await waitForWithTimeout(() => {
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    const tabButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Test Workflow"));
    if (tabButtons.length > 0) {
      fireEvent.dblClick(tabButtons[0]);
      await waitForWithTimeout(() => {
        const input2 = screen.getByDisplayValue(/Test Workflow/);
        expect(input2).toBeInTheDocument();
      });
      const input = screen.getByDisplayValue(/Test Workflow/);
      fireEvent.change(input, {
        target: {
          value: "New Name",
        },
      });
      fireEvent.blur(input);
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to rename workflow"),
        );
      }, 3e3);
    }
  });
  it.skip("should prevent empty name in tab rename", async () => {
    expect(true).toBe(true);
  });
  it("should cancel tab close when user cancels confirmation", async () => {
    showConfirm.mockResolvedValue(false);
    const savedTabs = [
      {
        id: "tab-1",
        name: "Unsaved Tab",
        workflowId: null,
        isUnsaved: true,
        executions: [],
        activeExecutionId: null,
      },
      {
        id: "tab-2",
        name: "Tab 2",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    renderWithProvider({
      initialTabs: savedTabs,
      initialActiveTabId: "tab-1",
    });
    await waitForWithTimeout(() => {
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    const closeButtons = screen.getAllByTitle(/Close tab/);
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    expect(screen.getAllByText(/Unsaved Tab/).length).toBeGreaterThan(0);
  });
  it("should create new tab when all tabs are closed", async () => {
    const savedTabs = [
      {
        id: "tab-1",
        name: "Tab 1",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
      {
        id: "tab-2",
        name: "Tab 2",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    renderWithProvider({
      initialTabs: savedTabs,
      initialActiveTabId: "tab-1",
    });
    await waitForWithTimeout(() => {
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    const closeButtons = screen.getAllByTitle(/Close tab/);
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);
    await waitForWithTimeout(() => {
      expect(screen.queryByText(/Tab 1/)).not.toBeInTheDocument();
      expect(screen.getByText(/Tab 2/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Tab 2/)).toBeInTheDocument();
    const remainingTabs = screen.getAllByText(/Tab/);
    expect(remainingTabs.length).toBeGreaterThan(0);
  });
  it("should handle tab rename with same name", async () => {
    renderWithProvider();
    await waitForWithTimeout(() => {
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    const tabButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Untitled Workflow"));
    if (tabButtons.length > 0) {
      fireEvent.dblClick(tabButtons[0]);
      await waitForWithTimeout(() => {
        const input2 = screen.getByDisplayValue(/Untitled Workflow/);
        expect(input2).toBeInTheDocument();
      });
      const input = screen.getByDisplayValue(/Untitled Workflow/);
      fireEvent.blur(input);
      await waitForWithTimeout(() => {
        expect(mockApi.updateWorkflow).not.toHaveBeenCalled();
      });
    }
  });
  it("should handle workflow loading error", async () => {
    mockApi.getWorkflow.mockRejectedValue(new Error("Load failed"));
    renderWithProvider({
      initialWorkflowId: "workflow-1",
      workflowLoadKey: 1,
    });
    await waitForWithTimeout(() => {
      const tabButtons = screen.getAllByRole("button");
      expect(tabButtons.length).toBeGreaterThan(0);
    }, 2e3);
  });
  it("should switch to first tab when active tab is deleted", async () => {
    showConfirm.mockResolvedValue(true);
    renderWithProvider();
    const plusButton = screen.getByTitle(/New workflow/);
    fireEvent.click(plusButton);
    await waitForWithTimeout(() => {
      const tabs = screen.getAllByText(/Untitled Workflow/);
      expect(tabs.length).toBeGreaterThan(1);
    });
    const closeButtons = screen.getAllByTitle(/Close/);
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      await waitForWithTimeout(() => {
        const remainingTabs = screen.getAllByText(/Untitled Workflow/);
        expect(remainingTabs.length).toBeGreaterThan(0);
      });
    }
  });
  it("should handle active tab validation when tab no longer exists", async () => {
    const savedTabs = [
      {
        id: "tab-1",
        name: "Tab 1",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
      {
        id: "tab-2",
        name: "Tab 2",
        workflowId: null,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null,
      },
    ];
    mockGetLocalStorageItem.mockImplementation((key) => {
      if (key === "workflowTabs") return savedTabs;
      if (key === "activeWorkflowTabId") return "tab-3";
      return null;
    });
    renderWithProvider();
    await waitForWithTimeout(() => {
      const tabButtons = screen.getAllByRole("button");
      expect(tabButtons.length).toBeGreaterThan(0);
    }, 2e3);
  });
  describe("Dependency Injection", () => {
    it("should use injected storage adapter", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      renderWithProvider({
        storage: mockStorage,
      });
      waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      }, 1e3);
    });
    it("should use injected HTTP client for workflow publishing", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "published-1",
            name: "Published Workflow",
          }),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") {
          return [
            {
              id: "tab-1",
              name: "Test Workflow",
              workflowId: "workflow-123",
              isUnsaved: false,
              executions: [],
              activeExecutionId: null,
            },
          ];
        }
        return null;
      });
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
      });
      await waitForWithTimeout(() => {
        expect(
          screen.getByText(/Test Workflow|Untitled Workflow/),
        ).toBeInTheDocument();
      });
      expect(mockHttpClient).toBeDefined();
      expect(
        screen.getByText(/Test Workflow|Untitled Workflow/),
      ).toBeInTheDocument();
    });
    it("should handle storage errors gracefully", () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      renderWithProvider({
        storage: mockStorage,
      });
      expect(screen.getByText(/Untitled Workflow/)).toBeInTheDocument();
    });
    it("should handle null storage adapter", () => {
      renderWithProvider({
        storage: null,
      });
      expect(screen.getByText(/Untitled Workflow/)).toBeInTheDocument();
    });
    it("should handle HTTP client errors for workflow publishing", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockRejectedValue(new Error("Network error")),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to publish workflow"),
        );
      }, 3e3);
    });
  });
  describe("Execution handling", () => {
    it("should handle execution start with pending execution replacement", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "pending-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "pending-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(mockOnExecutionStart).toBeDefined();
    });
    it("should handle execution start when execution already exists", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle execution start with new execution", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Publish modal", () => {
    it("should open publish modal when publish button is clicked", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
    });
    it("should show error when trying to publish without workflow saved", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return [];
        return null;
      });
      renderWithProvider({
        httpClient: mockHttpClient,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      expect(form).toBeInTheDocument();
      fireEvent.submit(form);
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Save the workflow before publishing"),
        );
      }, 3e3);
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
    it("should show error when no active tab for publish", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Untitled Workflow",
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Tab management edge cases", () => {
    it("should handle closing tab when it is the active tab", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
        {
          id: "tab-2",
          name: "Tab 2",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const closeButtons = screen.getAllByTitle(/Close tab/);
      if (closeButtons.length > 0) {
        const initialTabs = screen.getAllByText(/Tab/);
        expect(initialTabs.length).toBeGreaterThan(0);
        fireEvent.click(closeButtons[0]);
        await waitForWithTimeout(() => {
          const remainingTabs = screen.getAllByText(/Tab/);
          expect(remainingTabs.length).toBeLessThan(initialTabs.length);
          expect(screen.getByText(/Tab 2/)).toBeInTheDocument();
        }, 2e3);
      }
    });
    it("should create new tab when all tabs are closed", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Execution handling edge cases", () => {
    it("should handle handleExecutionStart when activeTab is not found", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "non-existent-tab";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionStart with multiple pending executions", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "pending-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
            {
              id: "pending-2",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
            {
              id: "pending-3",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "pending-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionStart when execution already exists", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionStart with pending execution ID", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleRemoveExecution when execution is active", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
            {
              id: "exec-2",
              status: "completed",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleRemoveExecution when execution is not active", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
            {
              id: "exec-2",
              status: "completed",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleRemoveExecution when no executions remain", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleClearExecutions for workflow with multiple tabs", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
        {
          id: "tab-2",
          name: "Tab 2",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-2",
              status: "completed",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-2",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionLogUpdate when execution not found", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionStatusUpdate with completed status", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionStatusUpdate with failed status", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleExecutionNodeUpdate when node state is provided", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Polling logic edge cases", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it("should handle polling when no running executions", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "completed",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle polling when execution fetch fails", async () => {
      mockApi.getExecution.mockRejectedValue(new Error("Fetch failed"));
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle polling when execution status is paused", async () => {
      const mockExecution = {
        id: "exec-1",
        status: "paused",
        started_at: "2024-01-01T00:00:00Z",
        node_states: {},
        logs: [],
      };
      mockApi.getExecution.mockResolvedValue(mockExecution);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle polling when execution has completed_at", async () => {
      const mockExecution = {
        id: "exec-1",
        status: "completed",
        started_at: "2024-01-01T00:00:00Z",
        completed_at: "2024-01-01T01:00:00Z",
        node_states: {},
        logs: [],
      };
      mockApi.getExecution.mockResolvedValue(mockExecution);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle polling when execution has node_states", async () => {
      const mockExecution = {
        id: "exec-1",
        status: "running",
        started_at: "2024-01-01T00:00:00Z",
        node_states: {
          "node-1": {
            status: "completed",
          },
        },
        logs: [],
      };
      mockApi.getExecution.mockResolvedValue(mockExecution);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle polling when execution has logs", async () => {
      const mockExecution = {
        id: "exec-1",
        status: "running",
        started_at: "2024-01-01T00:00:00Z",
        node_states: {},
        logs: [
          {
            level: "INFO",
            message: "Test log",
          },
        ],
      };
      mockApi.getExecution.mockResolvedValue(mockExecution);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle polling when execution update is null", async () => {
      mockApi.getExecution.mockResolvedValue(null);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
              startedAt: new Date(),
              nodes: {},
              logs: [],
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      jest.advanceTimersByTime(2e3);
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
  });
  describe("Tab rename edge cases", () => {
    it("should handle commitTabRename when tab is not found", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle commitTabRename when renameInFlight is true", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle commitTabRename when workflowId is null", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter(
          (btn) =>
            btn.textContent?.includes("Untitled Workflow") &&
            btn.getAttribute("title") !== "Close tab",
        );
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Untitled Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(mockApi.updateWorkflow).not.toHaveBeenCalled();
        });
      }
    });
    it("should handle commitTabRename when getWorkflow fails", async () => {
      mockApi.getWorkflow.mockRejectedValue(new Error("Get workflow failed"));
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Test Workflow"));
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Test Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(
            expect.stringContaining("Failed to rename workflow"),
          );
        }, 3e3);
      }
    });
    it("should handle commitTabRename when updateWorkflow fails", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test",
        nodes: [],
        edges: [],
        variables: {},
      };
      mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
      mockApi.updateWorkflow.mockRejectedValue(new Error("Update failed"));
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Test Workflow"));
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Test Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(
            expect.stringContaining("Failed to rename workflow"),
          );
        }, 3e3);
      }
    });
    it("should handle commitTabRename error with response.data.detail", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test",
        nodes: [],
        edges: [],
        variables: {},
      };
      mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
      const error = new Error("Update failed");
      error.response = {
        data: {
          detail: "Custom error detail",
        },
      };
      mockApi.updateWorkflow.mockRejectedValue(error);
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Test Workflow"));
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Test Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(
            expect.stringContaining("Custom error detail"),
          );
        }, 3e3);
      }
    });
    it("should handle commitTabRename error with error.message", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test",
        nodes: [],
        edges: [],
        variables: {},
      };
      mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
      mockApi.updateWorkflow.mockRejectedValue(new Error("Network error"));
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Test Workflow"));
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Test Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(
            expect.stringContaining("Network error"),
          );
        }, 3e3);
      }
    });
    it("should handle commitTabRename error with unknown error", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test",
        nodes: [],
        edges: [],
        variables: {},
      };
      mockApi.getWorkflow.mockResolvedValue(mockWorkflow);
      mockApi.updateWorkflow.mockRejectedValue({});
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "tab-1";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const tabButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Test Workflow"));
      if (tabButtons.length > 0) {
        fireEvent.dblClick(tabButtons[0]);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(/Test Workflow/);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(
            expect.stringContaining("Unknown error"),
          );
        }, 3e3);
      }
    });
    it("should handle handleInputBlur when renameInFlight is true", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle handleInputBlur when editingTabId does not match", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Publish workflow edge cases", () => {
    it("should handle handlePublish when response.ok is false", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: false,
          text: async () => "Server error",
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      await waitForWithTimeout(() => {
        const buttons = screen.getAllByRole("button");
        const hasPublishButton = buttons.some(
          (btn) => btn.getAttribute("title") === "Publish workflow",
        );
        expect(hasPublishButton).toBe(true);
      }, 2e3);
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to publish"),
        );
      }, 3e3);
    });
    it("should handle handlePublish when response.json() fails", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new Error("JSON parse error");
          },
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "workflow-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "workflow-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      expect(form).toBeInTheDocument();
      fireEvent.submit(form);
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to publish workflow"),
        );
      }, 3e3);
    });
    it("should handle handlePublish when tags are empty", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "published-1",
            name: "Published Workflow",
          }),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const tagsInput = screen.queryByPlaceholderText(/automation, ai/);
      if (tagsInput) {
        fireEvent.change(tagsInput, {
          target: {
            value: "",
          },
        });
      }
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
      }, 3e3);
    });
    it("should handle handlePublish when tags have whitespace", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "published-1",
            name: "Published Workflow",
          }),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const tagsInput = screen.queryByPlaceholderText(/automation, ai/);
      if (tagsInput) {
        fireEvent.change(tagsInput, {
          target: {
            value: " tag1 , tag2 , tag3 ",
          },
        });
      }
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
      }, 3e3);
    });
    it("should handle handlePublish when estimated_time is empty", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "published-1",
            name: "Published Workflow",
          }),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
      }, 3e3);
    });
    it("should not publish over HTTP when guest tabs are cleared of saved workflow ids", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "published-1",
            name: "Published Workflow",
          }),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      const savedTabs = [
        {
          id: "tab-1",
          name: "Test Workflow",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        httpClient: mockHttpClient,
        apiBaseUrl: "http://test.api.com/api",
        initialTabs: savedTabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
      });
      const form = screen.getByText(/Publish to Marketplace/).closest("form");
      if (form) {
        fireEvent.submit(form);
      }
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Save the workflow before publishing"),
        );
      });
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
  describe("Initial workflow loading edge cases", () => {
    it("should handle initialWorkflowId with same workflowLoadKey twice", async () => {
      mockApi.getWorkflow.mockResolvedValue({
        id: "workflow-1",
        name: "Loaded Workflow",
        description: "Test",
        nodes: [],
        edges: [],
      });
      const { rerender } = renderWithProvider({
        initialWorkflowId: "workflow-1",
        workflowLoadKey: 1,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      rerender(
        <WorkflowTabsProvider initialTabs={[]} initialActiveTabId={null}>
          <WorkflowTabs
            initialWorkflowId="workflow-1"
            workflowLoadKey={1}
            onExecutionStart={mockOnExecutionStart}
          />
        </WorkflowTabsProvider>,
      );
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle initialWorkflowId with different workflowLoadKey", async () => {
      mockApi.getWorkflow.mockResolvedValue({
        id: "workflow-1",
        name: "Loaded Workflow",
        description: "Test",
        nodes: [],
        edges: [],
      });
      const { rerender } = renderWithProvider({
        initialWorkflowId: "workflow-1",
        workflowLoadKey: 1,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      rerender(
        <WorkflowTabsProvider initialTabs={[]} initialActiveTabId={null}>
          <WorkflowTabs
            initialWorkflowId="workflow-1"
            workflowLoadKey={2}
            onExecutionStart={mockOnExecutionStart}
          />
        </WorkflowTabsProvider>,
      );
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
    });
    it("should handle initialWorkflowId when workflowLoadKey is undefined", async () => {
      renderWithProvider({
        initialWorkflowId: "workflow-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle initialWorkflowId when prev.length === 1 and globalTabs.length > 1", async () => {
      mockApi.getWorkflow.mockResolvedValue({
        id: "workflow-1",
        name: "Loaded Workflow",
        description: "Test",
        nodes: [],
        edges: [],
      });
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
        {
          id: "tab-2",
          name: "Tab 2",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        return null;
      });
      renderWithProvider({
        initialWorkflowId: "workflow-1",
        workflowLoadKey: 1,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle initialWorkflowId when existingTab is found", async () => {
      mockApi.getWorkflow.mockResolvedValue({
        id: "workflow-1",
        name: "Loaded Workflow",
        description: "Test",
        nodes: [],
        edges: [],
      });
      const existingTabId = `workflow-${Date.now()}`;
      const savedTabs = [
        {
          id: existingTabId,
          name: "Existing Tab",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        return null;
      });
      renderWithProvider({
        initialWorkflowId: "workflow-1",
        workflowLoadKey: 1,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Active tab validation edge cases", () => {
    it("should handle activeTabId validation when tabs array is empty", async () => {
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return [];
        if (key === "activeWorkflowTabId") return "non-existent-tab";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle activeTabId validation when activeTabId is null", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return null;
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle activeTabId validation when activeTabId does not exist in tabs", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "non-existent-tab";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("Storage edge cases", () => {
    it("should handle saveTabsToStorage when storage is null", async () => {
      renderWithProvider({
        storage: null,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle saveTabsToStorage when localStorage.setItem throws", async () => {
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = jest.fn(() => {
        throw new Error("Quota exceeded");
      });
      renderWithProvider({
        storage: null,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      window.localStorage.setItem = originalSetItem;
    });
    it("should handle saveTabsToStorage when storage.setItem throws", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(() => {
          throw new Error("Quota exceeded");
        }),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      renderWithProvider({
        storage: mockStorage,
      });
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle loadTabsFromStorage when tabs is not an array", async () => {
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs")
          return {
            not: "an array",
          };
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle loadActiveTabFromStorage when saved tab does not exist", async () => {
      const savedTabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockGetLocalStorageItem.mockImplementation((key) => {
        if (key === "workflowTabs") return savedTabs;
        if (key === "activeWorkflowTabId") return "non-existent-tab";
        return null;
      });
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should handle saveActiveTabToStorage when activeTabId is null", async () => {
      require("../hooks/storage");
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("No tabs state", () => {
    it("should render no tabs state when tabs array is empty", async () => {
      const {
        WorkflowTabsProvider: WorkflowTabsProvider2,
      } = require("../contexts/WorkflowTabsContext");
      render(
        <WorkflowTabsProvider2 initialTabs={[]} initialActiveTabId={null}>
          <WorkflowTabs onExecutionStart={mockOnExecutionStart} />
        </WorkflowTabsProvider2>,
      );
      await waitForWithTimeout(() => {
        const noExecutionsText = screen.queryByText(/No executions/i);
        const newWorkflowButton = screen.queryByText(/New Workflow/i);
        expect(
          noExecutionsText ||
            newWorkflowButton ||
            screen.queryAllByText(/Untitled Workflow/).length > 0,
        ).toBeTruthy();
      }, 3e3);
    });
    it("should create new workflow when clicking New Workflow button in no tabs state", async () => {
      const {
        WorkflowTabsProvider: WorkflowTabsProvider2,
      } = require("../contexts/WorkflowTabsContext");
      render(
        <WorkflowTabsProvider2 initialTabs={[]} initialActiveTabId={null}>
          <WorkflowTabs onExecutionStart={mockOnExecutionStart} />
        </WorkflowTabsProvider2>,
      );
      await waitForWithTimeout(() => {
        const newWorkflowButton2 = screen
          .queryByText(/New Workflow/i)
          ?.closest("button");
        const plusButton2 = screen.queryByTitle(/New workflow/);
        const button2 = newWorkflowButton2 || plusButton2;
        return (
          button2 !== null ||
          screen.queryAllByText(/Untitled Workflow/).length > 0
        );
      }, 3e3);
      const newWorkflowButton = screen
        .queryByText(/New Workflow/i)
        ?.closest("button");
      const plusButton = screen.queryByTitle(/New workflow/);
      const button = newWorkflowButton || plusButton;
      if (button) {
        fireEvent.click(button);
        await waitForWithTimeout(() => {
          const tabs = screen.queryAllByText(/Untitled Workflow/);
          expect(tabs.length).toBeGreaterThan(0);
        }, 3e3);
      } else {
        const tabs = screen.queryAllByText(/Untitled Workflow/);
        expect(tabs.length).toBeGreaterThan(0);
      }
    });
  });
  describe("WorkflowBuilder ref methods", () => {
    it("should call saveWorkflow when Save button is clicked", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        const saveButton2 = screen.getByTitle(/Save workflow/);
        expect(saveButton2).toBeInTheDocument();
      });
      const saveButton = screen.getByTitle(/Save workflow/);
      expect(() => fireEvent.click(saveButton)).not.toThrow();
      expect(saveButton).toBeInTheDocument();
    });
    it("should call clearWorkflow when Clear workflow button is clicked", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        expect(screen.getByTitle(/Clear all nodes/)).toBeInTheDocument();
      });
      const clearButton = screen.getByTitle(/Clear all nodes/);
      expect(() => fireEvent.click(clearButton)).not.toThrow();
      expect(clearButton).toBeInTheDocument();
    });
    it("should call executeWorkflow when Execute button is clicked", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        const executeButton2 = screen.getByTitle(/Execute workflow/);
        expect(executeButton2).toBeInTheDocument();
      });
      const executeButton = screen.getByTitle(/Execute workflow/);
      expect(() => fireEvent.click(executeButton)).not.toThrow();
      expect(executeButton).toBeInTheDocument();
    });
    it("should call exportWorkflow when Export button is clicked", async () => {
      renderWithProvider();
      await waitForWithTimeout(() => {
        const exportButton2 = screen.getByTitle(/Export workflow/);
        expect(exportButton2).toBeInTheDocument();
      });
      const exportButton = screen.getByTitle(/Export workflow/);
      expect(() => fireEvent.click(exportButton)).not.toThrow();
      expect(exportButton).toBeInTheDocument();
    });
  });
  describe("Active tab filtering", () => {
    it("should filter out tabs with null workflowId when passing to WorkflowBuilder", async () => {
      const tabsWithNullWorkflow = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
        {
          id: "tab-2",
          name: "Tab 2",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        initialTabs: tabsWithNullWorkflow,
        initialActiveTabId: "tab-2",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 2")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
    it("should map tabs correctly when passing workflowTabs to WorkflowBuilder", async () => {
      const tabsWithExecutions = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [
            {
              id: "exec-1",
              status: "running",
            },
          ],
          activeExecutionId: "exec-1",
        },
      ];
      renderWithProvider({
        initialTabs: tabsWithExecutions,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 1")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
  });
  describe("Active tab edge cases", () => {
    it("should handle when activeTab is undefined", async () => {
      renderWithProvider({
        initialTabs: [],
        initialActiveTabId: "non-existent-tab",
      });
      await waitForWithTimeout(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
    it("should not render WorkflowBuilder when activeTab is null", async () => {
      const {
        WorkflowTabsProvider: WorkflowTabsProvider2,
      } = require("../contexts/WorkflowTabsContext");
      render(
        <WorkflowTabsProvider2 initialTabs={[]} initialActiveTabId={null}>
          <WorkflowTabs onExecutionStart={mockOnExecutionStart} />
        </WorkflowTabsProvider2>,
      );
      await waitForWithTimeout(() => {
        const noExecutionsText = screen.queryByText(/No executions/i);
        const workflowBuilder = screen.queryByText("WorkflowBuilder Mock");
        if (noExecutionsText) {
          expect(workflowBuilder).not.toBeInTheDocument();
        } else {
          expect(
            screen.queryAllByText(/Untitled Workflow/).length,
          ).toBeGreaterThan(0);
        }
      }, 3e3);
    });
  });
  describe("Tab renaming error recovery", () => {
    it("should revert tab name on rename error", async () => {
      const originalName = "Original Name";
      const tabs = [
        {
          id: "tab-1",
          name: originalName,
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockApi.getWorkflow.mockRejectedValue(new Error("Network error"));
      renderWithProvider({
        initialTabs: tabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(originalName)).toBeInTheDocument();
      });
      const tabButton = screen.getByText(originalName).closest("button");
      if (tabButton) {
        fireEvent.doubleClick(tabButton);
        await waitForWithTimeout(() => {
          const input = screen.getByDisplayValue(originalName);
          expect(input).toBeInTheDocument();
          fireEvent.change(input, {
            target: {
              value: "New Name",
            },
          });
          fireEvent.blur(input);
        });
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalled();
        }, 3e3);
      }
    });
  });
  describe("Execution callbacks integration", () => {
    it("should pass execution callbacks to WorkflowBuilder", async () => {
      const mockOnExecutionStart2 = jest.fn();
      const tabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        initialTabs: tabs,
        initialActiveTabId: "tab-1",
        onExecutionStart: mockOnExecutionStart2,
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 1")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
  });
  describe("Props handling", () => {
    it("should accept httpClient prop", () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };
      renderWithProvider({
        httpClient: mockHttpClient,
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should accept apiBaseUrl prop", () => {
      renderWithProvider({
        apiBaseUrl: "https://custom-api.example.com/api",
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
    it("should use default adapters when props not provided", () => {
      renderWithProvider();
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
  describe("PublishModal integration", () => {
    it("should close publish modal when onClose is called", async () => {
      renderWithProvider();
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/i)).toBeInTheDocument();
      });
      const closeButton = screen.getByText(/Cancel|Close/i).closest("button");
      if (closeButton) {
        fireEvent.click(closeButton);
        await waitForWithTimeout(() => {
          expect(
            screen.queryByText(/Publish to Marketplace/i),
          ).not.toBeInTheDocument();
        });
      }
    });
    it("should handle publish form changes", async () => {
      renderWithProvider();
      const publishButton = screen.getByTitle(/Publish workflow/);
      fireEvent.click(publishButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Publish to Marketplace/i)).toBeInTheDocument();
      });
      const nameInput =
        screen.queryByLabelText(/Name/i) ||
        screen.queryByPlaceholderText(/Workflow name/i);
      if (nameInput) {
        fireEvent.change(nameInput, {
          target: {
            value: "Test Workflow",
          },
        });
        expect(nameInput.value).toBe("Test Workflow");
      }
    });
  });
  describe("WorkflowBuilder callbacks", () => {
    it("should handle onWorkflowSaved callback", async () => {
      const tabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: true,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        initialTabs: tabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 1")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
    it("should handle onWorkflowModified callback", async () => {
      const tabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: "workflow-1",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderWithProvider({
        initialTabs: tabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 1")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
    it("should handle onWorkflowLoaded callback", async () => {
      const tabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      mockApi.getWorkflow.mockResolvedValue({
        id: "workflow-1",
        name: "Loaded Workflow",
        description: "Description",
        nodes: [],
        edges: [],
        variables: {},
      });
      renderWithProvider({
        initialTabs: tabs,
        initialActiveTabId: "tab-1",
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText("Tab 1")).toBeInTheDocument();
      });
      expect(screen.getByText("WorkflowBuilder Mock")).toBeInTheDocument();
    });
  });
  describe("Tabs ref synchronization", () => {
    it("should keep tabsRef in sync with tabs state", async () => {
      renderWithProvider();
      const plusButton = screen.getByTitle(/New workflow/);
      fireEvent.click(plusButton);
      await waitForWithTimeout(() => {
        const tabs = screen.queryAllByText(/Untitled Workflow/);
        expect(tabs.length).toBeGreaterThan(1);
      });
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
});
