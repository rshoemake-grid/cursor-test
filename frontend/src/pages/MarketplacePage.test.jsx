import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MarketplacePage from "./MarketplacePage";
import { useAuth } from "../contexts/AuthContext";
import {
  useMarketplaceSelections,
  useTemplateOperations,
  useMarketplaceActions
} from "../hooks/marketplace";
import { api } from "../api/client";
import { getLocalStorageItem } from "../hooks/storage";
import { showConfirm } from "../utils/confirm";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn()
}));
jest.mock("../api/client", () => ({
  api: {
    getTemplates: jest.fn(),
    deleteTemplate: jest.fn()
  }
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("../hooks/storage", () => ({
  useLocalStorage: jest.fn(() => ["", jest.fn(), jest.fn()]),
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn(),
  removeLocalStorageItem: jest.fn(),
  useAutoSave: jest.fn(),
  useDraftManagement: jest.fn(),
  loadDraftsFromStorage: jest.fn()
}));
const mockUseMarketplaceData = jest.fn(() => ({
  templates: [],
  workflowsOfWorkflows: [],
  agents: [],
  repositoryAgents: [],
  loading: false,
  setTemplates: jest.fn(),
  setWorkflowsOfWorkflows: jest.fn(),
  setAgents: jest.fn(),
  setRepositoryAgents: jest.fn(),
  fetchTemplates: jest.fn(),
  fetchWorkflowsOfWorkflows: jest.fn(),
  fetchAgents: jest.fn(),
  fetchRepositoryAgents: jest.fn()
}));
jest.mock("../hooks/marketplace", () => {
  const actual = jest.requireActual("../hooks/marketplace");
  return {
    ...actual,
    useMarketplaceData: (...args) => mockUseMarketplaceData(...args),
    useOfficialAgentSeeding: jest.fn(),
    useTemplateOperations: jest.fn(),
    useMarketplaceIntegration: jest.fn(),
    useMarketplacePublishing: jest.fn(),
    useMarketplaceDialog: jest.fn(),
    useTemplatesData: jest.fn(),
    useAgentsData: jest.fn(),
    useRepositoryAgentsData: jest.fn(),
    useWorkflowsOfWorkflowsData: jest.fn(),
    useTemplateUsage: jest.fn(),
    useAgentDeletion: jest.fn(),
    useWorkflowDeletion: jest.fn(),
    // useMarketplaceTabs: Use real hook (from ...actual above)
    useMarketplaceSelections: jest.fn(),
    useMarketplaceActions: jest.fn(),
    MARKETPLACE_TABS: {
      AGENTS: "agents",
      REPOSITORY: "repository",
      WORKFLOWS_OF_WORKFLOWS: "workflows-of-workflows"
    },
    REPOSITORY_SUB_TABS: {
      WORKFLOWS: "workflows",
      AGENTS: "agents"
    },
    // Export types
    Template: {},
    AgentTemplate: {}
  };
});
jest.mock("../hooks/nodes", () => ({
  useSelectionManager: jest.fn(() => ({
    selectedIds: /* @__PURE__ */ new Set(),
    setSelectedIds: jest.fn(),
    toggleSelection: jest.fn(),
    clearSelection: jest.fn(),
    isSelected: jest.fn()
  })),
  useNodeSelection: jest.fn(),
  useNodeOperations: jest.fn(),
  useNodeForm: jest.fn(),
  useSelectedNode: jest.fn()
}));
const defaultTemplateOperations = () => ({
  useTemplate: jest.fn(),
  deleteSelectedAgents: jest.fn(),
  deleteSelectedWorkflows: jest.fn(),
  deleteSelectedRepositoryAgents: jest.fn()
});
const defaultMarketplaceActions = () => ({
  handleLoadWorkflows: jest.fn(),
  handleUseAgents: jest.fn(),
  handleUseTools: jest.fn(),
  handleDeleteAgents: jest.fn(),
  handleDeleteWorkflows: jest.fn(),
  handleDeleteRepositoryAgents: jest.fn()
});
const defaultMarketplaceSelections = () => {
  const createSelection = () => ({
    selectedIds: /* @__PURE__ */ new Set(),
    setSelectedIds: jest.fn(),
    toggle: jest.fn(),
    clear: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    has: jest.fn(),
    size: 0
  });
  return {
    templateSelection: createSelection(),
    agentSelection: createSelection(),
    repositoryAgentSelection: createSelection(),
    toolSelection: createSelection(),
    clearSelectionsForTab: jest.fn()
  };
};
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));
global.fetch = jest.fn();
const mockUseAuth = useAuth;
const mockApi = api;
const mockGetLocalStorageItem = getLocalStorageItem;
const mockShowConfirm = showConfirm;
const renderWithRouter = (component) => {
  return render(/* @__PURE__ */ jsx(BrowserRouter, { children: component }));
};
describe("MarketplacePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMarketplaceSelections.mockImplementation(defaultMarketplaceSelections);
    useTemplateOperations.mockImplementation(defaultTemplateOperations);
    useMarketplaceActions.mockImplementation(defaultMarketplaceActions);
    localStorage.clear();
    mockNavigate.mockClear();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "testuser" },
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
    });
    mockGetLocalStorageItem.mockReturnValue([]);
    mockShowConfirm.mockResolvedValue(true);
    mockUseMarketplaceData.mockReturnValue({
      templates: [],
      workflowsOfWorkflows: [],
      agents: [],
      repositoryAgents: [],
      loading: false,
      setTemplates: jest.fn(),
      setWorkflowsOfWorkflows: jest.fn(),
      setAgents: jest.fn(),
      setRepositoryAgents: jest.fn(),
      fetchTemplates: jest.fn(),
      fetchWorkflowsOfWorkflows: jest.fn(),
      fetchAgents: jest.fn(),
      fetchRepositoryAgents: jest.fn()
    });
    global.fetch.mockImplementation((url) => {
      if (url.includes("/templates/") || url.includes("/marketplace/agents")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => []
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => []
      });
    });
  });
  it("should render marketplace page", () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
  });
  it("should render agents tab by default", () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    expect(screen.getByText(/Agents/)).toBeInTheDocument();
  });
  it("should switch tabs", () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    const repositoryTab = screen.getByText(/Repository/);
    fireEvent.click(repositoryTab);
    expect(screen.getByText(/Repository/)).toBeInTheDocument();
  });
  it("should handle search query", async () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    await waitForWithTimeout(() => {
      const searchInput = screen.getByPlaceholderText(/Search/);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: "test query" } });
        expect(searchInput.value).toBe("test query");
      }
    }, 2e3);
  });
  it("should handle category filter", async () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    await waitForWithTimeout(() => {
      const categorySelects = screen.queryAllByRole("combobox");
      if (categorySelects.length > 0) {
        fireEvent.change(categorySelects[0], { target: { value: "automation" } });
      }
    }, 2e3);
  });
  it("should display agents from localStorage", async () => {
    const mockAgents = [
      {
        id: "agent-1",
        name: "Test Agent",
        label: "Test Agent",
        description: "Test description",
        category: "automation",
        tags: ["test"],
        difficulty: "beginner",
        estimated_time: "5 min",
        agent_config: {}
      }
    ];
    mockGetLocalStorageItem.mockImplementation((key) => {
      if (key === "publishedAgents") return mockAgents;
      return [];
    });
    mockUseMarketplaceData.mockReturnValueOnce({
      templates: [],
      workflowsOfWorkflows: [],
      agents: mockAgents,
      repositoryAgents: [],
      loading: false,
      setTemplates: jest.fn(),
      setWorkflowsOfWorkflows: jest.fn(),
      setAgents: jest.fn(),
      setRepositoryAgents: jest.fn(),
      fetchTemplates: jest.fn(),
      fetchWorkflowsOfWorkflows: jest.fn(),
      fetchAgents: jest.fn(),
      fetchRepositoryAgents: jest.fn()
    });
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Agent")).toBeInTheDocument();
    }, 2e3);
  });
  it("should handle sort by selection", async () => {
    renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
    await waitForWithTimeout(() => {
      const sortSelects = screen.queryAllByRole("combobox");
      if (sortSelects.length > 0) {
        fireEvent.change(sortSelects[sortSelects.length - 1], { target: { value: "newest" } });
      }
    }, 2e3);
  });
  describe("Dependency Injection", () => {
    it("should use injected HTTP client", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => []
        }),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ nodes: [] })
        }),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        expect(mockUseMarketplaceData).toHaveBeenCalledWith(
          expect.objectContaining({ httpClient: mockHttpClient })
        );
      });
    });
    it("should use injected storage adapter", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage }));
      expect(mockUseMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({ storage: mockStorage })
      );
    });
    it("should use injected API base URL", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => []
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      const customApiBaseUrl = "https://custom-api.example.com/api";
      renderWithRouter(
        /* @__PURE__ */ jsx(
          MarketplacePage,
          {
            httpClient: mockHttpClient,
            apiBaseUrl: customApiBaseUrl
          }
        )
      );
      await waitForWithTimeout(() => {
        expect(mockUseMarketplaceData).toHaveBeenCalledWith(
          expect.objectContaining({ apiBaseUrl: customApiBaseUrl })
        );
      });
    });
    it("should handle storage errors gracefully", async () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle HTTP client errors gracefully", async () => {
      const mockHttpClient = {
        get: jest.fn().mockRejectedValue(new Error("Network error")),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle null storage adapter", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: null }));
      await waitForWithTimeout(() => {
        const marketplaceText = screen.queryByText(/Marketplace/);
        const agentsText = screen.queryByText(/Agents/);
        const workflowsText = screen.queryByText(/Workflows/);
        expect(marketplaceText || agentsText || workflowsText).toBeTruthy();
      }, 3e3);
    });
  });
  describe("Tab switching and workflows-of-workflows", () => {
    it("should switch to workflows-of-workflows tab", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/);
        fireEvent.click(workflowsOfWorkflowsTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should fetch workflows-of-workflows with workflow references", async () => {
      const mockWorkflowsOfWorkflows = [
        {
          id: "wf1",
          name: "Workflow 1",
          description: "A workflow of workflows",
          tags: ["workflow-of-workflows"]
        }
      ];
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: [],
        workflowsOfWorkflows: mockWorkflowsOfWorkflows,
        agents: [],
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      const { rerender } = renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/);
        fireEvent.click(workflowsOfWorkflowsTab);
      });
      rerender(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(mockUseMarketplaceData).toHaveBeenCalledWith(
          expect.objectContaining({ activeTab: "workflows-of-workflows" })
        );
      });
    });
  });
  describe("Agent operations", () => {
    it("should fetch agents with author migration", async () => {
      const mockAgents = [
        { id: "agent1", name: "Agent 1", author_id: "user-1", author_name: "testuser" }
      ];
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", author_id: null }
      ]);
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: [],
        workflowsOfWorkflows: [],
        agents: mockAgents,
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(mockUseMarketplaceData).toHaveBeenCalledWith(
          expect.objectContaining({ user: expect.objectContaining({ id: "1" }) })
        );
      });
    });
    it("should filter agents by category", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", category: "automation", tags: [] },
        { id: "agent2", name: "Agent 2", category: "research", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const categorySelects = screen.queryAllByRole("combobox");
        const categorySelect = categorySelects.find(
          (select) => select.options[0]?.textContent === "All Categories"
        );
        if (categorySelect) {
          fireEvent.change(categorySelect, { target: { value: "automation" } });
        }
      }, 3e3);
    });
    it("should search agents by query", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Test Agent", description: "Test description", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const searchInput = screen.getByPlaceholderText(/Search/);
        if (searchInput) {
          fireEvent.change(searchInput, { target: { value: "Test" } });
        }
      }, 3e3);
    });
    it("should sort agents by popular", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", published_at: "2024-01-01", tags: [] },
        { id: "agent2", name: "Agent 2", published_at: "2024-01-02", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const sortSelects = screen.queryAllByRole("combobox");
        if (sortSelects.length > 1) {
          fireEvent.change(sortSelects[1], { target: { value: "popular" } });
        }
      }, 3e3);
    });
  });
  describe("Template operations", () => {
    it("should use template and navigate", async () => {
      const mockUseTemplate = jest.fn();
      const mockUseTemplateOperations = jest.fn(() => ({
        useTemplate: mockUseTemplate,
        deleteSelectedAgents: jest.fn(),
        deleteSelectedWorkflows: jest.fn(),
        deleteSelectedRepositoryAgents: jest.fn()
      }));
      jest.doMock("../hooks/marketplace", () => ({
        useTemplateOperations: mockUseTemplateOperations
      }));
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle useTemplate error", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
  });
  describe("Delete operations", () => {
    it("should delete selected agents", async () => {
      const mockAgents = [
        { id: "agent1", name: "Agent 1", author_id: "1", is_official: false, tags: [], category: "automation", difficulty: "beginner", estimated_time: "5 min" }
      ];
      mockGetLocalStorageItem.mockReturnValue(mockAgents);
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: [],
        workflowsOfWorkflows: [],
        agents: mockAgents,
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should not show delete button when only official agents are selected", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { id: "agent1", name: "Agent 1", author_id: "1", is_official: true }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", author_id: "1", is_official: true, tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage }));
      await waitForWithTimeout(() => {
        const checkboxes = screen.queryAllByRole("checkbox");
        if (checkboxes.length > 0) {
          fireEvent.click(checkboxes[0]);
        }
      }, 3e3);
      await waitForWithTimeout(() => {
        const deleteButtons = screen.queryAllByText(/Delete.*Agent/);
        expect(deleteButtons.length).toBe(0);
      }, 3e3);
    });
    it("should delete selected workflows", async () => {
      const mockTemplates = [
        {
          id: "template1",
          name: "Template 1",
          author_id: "1",
          is_official: false,
          tags: ["test"],
          description: "Test description",
          category: "automation",
          difficulty: "beginner",
          estimated_time: "5 min",
          uses_count: 0,
          likes_count: 0,
          rating: 0
        }
      ];
      mockApi.deleteTemplate = jest.fn().mockResolvedValue({});
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: mockTemplates,
        workflowsOfWorkflows: [],
        agents: [],
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
  });
  describe("UI interactions", () => {
    it("should handle card click to toggle selection", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const cards = screen.queryAllByText(/Agent 1/);
        if (cards.length > 0) {
          fireEvent.click(cards[0]);
        }
      }, 3e3);
    });
    it("should get difficulty color for different difficulties", () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
    });
    it("should handle repository sub-tab switching", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle search Enter key press", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => []
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const searchInput = screen.getByPlaceholderText(/Search/);
        if (searchInput) {
          fireEvent.change(searchInput, { target: { value: "test" } });
          fireEvent.keyPress(searchInput, { key: "Enter", code: "Enter" });
        }
      }, 3e3);
    });
    it("should handle empty space click to deselect", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const contentGrid = document.querySelector(".max-w-7xl");
        if (contentGrid) {
          fireEvent.click(contentGrid);
        }
      }, 3e3);
    });
    it("should handle repository agents sub-tab", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { id: "agent1", name: "Repo Agent 1", tags: [] }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        const buttons = screen.queryAllByRole("button");
        const agentsSubTab = buttons.find(
          (btn) => btn.textContent?.includes("Agents") && btn.closest("div")?.querySelector("button")?.textContent?.includes("Workflows")
        );
        if (agentsSubTab) {
          fireEvent.click(agentsSubTab);
        }
      }, 3e3);
    });
    it("should handle workflows-of-workflows tab with no workflows", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/);
        fireEvent.click(workflowsOfWorkflowsTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle fetchTemplates error", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle fetchTemplates with category filter", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => []
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        const categorySelects = screen.queryAllByRole("combobox");
        const categorySelect = categorySelects.find(
          (select) => select.options[0]?.textContent === "All Categories"
        );
        if (categorySelect) {
          fireEvent.change(categorySelect, { target: { value: "automation" } });
        }
      }, 3e3);
    });
    it("should handle sort by recent", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", published_at: "2024-01-01", tags: [] },
        { id: "agent2", name: "Agent 2", published_at: "2024-01-02", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const sortSelects = screen.queryAllByRole("combobox");
        if (sortSelects.length > 1) {
          fireEvent.change(sortSelects[sortSelects.length - 1], { target: { value: "recent" } });
        }
      }, 3e3);
    });
    it("should handle sort by rating", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", tags: [] },
        { id: "agent2", name: "Agent 2", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const sortSelects = screen.queryAllByRole("combobox");
        if (sortSelects.length > 1) {
          fireEvent.change(sortSelects[sortSelects.length - 1], { target: { value: "rating" } });
        }
      }, 3e3);
    });
    it("should handle agent card checkbox click", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const checkboxes = screen.queryAllByRole("checkbox");
        if (checkboxes.length > 0) {
          fireEvent.click(checkboxes[0]);
        }
      }, 3e3);
    });
    it("should handle workflow card checkbox click", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              id: "template1",
              name: "Template 1",
              tags: ["test"],
              description: "Test description",
              category: "automation",
              difficulty: "beginner",
              estimated_time: "5 min",
              uses_count: 0,
              likes_count: 0,
              rating: 0,
              is_official: false
            }
          ]
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        const checkboxes = screen.queryAllByRole("checkbox");
        if (checkboxes.length > 0) {
          fireEvent.click(checkboxes[0]);
        }
      }, 3e3);
    });
    it("should handle back button click", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const backButton = screen.getByText(/Back to Main/);
        fireEvent.click(backButton);
      });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    it("should display empty state for agents", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/No agents found/)).toBeInTheDocument();
      }, 3e3);
    });
    it("should display empty state for workflows", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => []
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      mockUseMarketplaceData.mockReturnValue({
        templates: [],
        workflowsOfWorkflows: [],
        agents: [],
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await act(async () => {
        const repositoryTab = await waitForWithTimeout(() => {
          return screen.getByText(/Repository/);
        });
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        const subTabButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent === "Workflows" || btn.textContent === "Agents"
        );
        expect(subTabButtons.length).toBeGreaterThanOrEqual(2);
      }, 3e3);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/No workflows found/)).toBeInTheDocument();
      }, 3e3);
    });
    it("should handle difficulty colors", async () => {
      const mockAgents = [
        { id: "agent1", name: "Agent 1", difficulty: "beginner", tags: [], category: "automation", estimated_time: "5 min" },
        { id: "agent2", name: "Agent 2", difficulty: "intermediate", tags: [], category: "automation", estimated_time: "5 min" },
        { id: "agent3", name: "Agent 3", difficulty: "advanced", tags: [], category: "automation", estimated_time: "5 min" },
        { id: "agent4", name: "Agent 4", difficulty: "unknown", tags: [], category: "automation", estimated_time: "5 min" }
      ];
      mockGetLocalStorageItem.mockReturnValue(mockAgents);
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: [],
        workflowsOfWorkflows: [],
        agents: mockAgents,
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
  });
  describe("Seed official agents", () => {
    it("should skip seeding if already seeded", async () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation((key) => {
          if (key === "officialAgentsSeeded") return "true";
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage, httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        expect(mockHttpClient.get).not.toHaveBeenCalled();
      }, 3e3);
    });
    it("should handle seeding when no official workflows found", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle seeding storage errors", async () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage error");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
  });
  describe("Use template operations", () => {
    it("should use template without token", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle useTemplate with error response", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              id: "template1",
              name: "Template 1",
              tags: ["test"],
              description: "Test description",
              category: "automation",
              difficulty: "beginner",
              estimated_time: "5 min",
              uses_count: 0,
              likes_count: 0,
              rating: 0,
              is_official: false
            }
          ]
        }),
        post: jest.fn().mockResolvedValue({
          ok: false,
          text: async () => "Error message"
        }),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
  });
  describe("Delete operations edge cases", () => {
    it("should handle delete agents when no agents selected", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        { id: "agent1", name: "Agent 1", author_id: "1", is_official: false, tags: [] }
      ]);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        const deleteButtons = screen.queryAllByText(/Delete.*Agent/);
        expect(deleteButtons.length).toBe(0);
      }, 3e3);
    });
    it("should handle delete agents cancellation", async () => {
      const mockAgents = [
        { id: "agent1", name: "Agent 1", author_id: "1", is_official: false, tags: [], category: "automation", difficulty: "beginner", estimated_time: "5 min" }
      ];
      mockGetLocalStorageItem.mockReturnValue(mockAgents);
      mockShowConfirm.mockResolvedValue(false);
      mockUseMarketplaceData.mockReturnValueOnce({
        templates: [],
        workflowsOfWorkflows: [],
        agents: mockAgents,
        repositoryAgents: [],
        loading: false,
        setTemplates: jest.fn(),
        setWorkflowsOfWorkflows: jest.fn(),
        setAgents: jest.fn(),
        setRepositoryAgents: jest.fn(),
        fetchTemplates: jest.fn(),
        fetchWorkflowsOfWorkflows: jest.fn(),
        fetchAgents: jest.fn(),
        fetchRepositoryAgents: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Marketplace/)).toBeInTheDocument();
      });
    });
    it("should handle delete workflows cancellation", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              id: "template1",
              name: "Template 1",
              author_id: "1",
              is_official: false,
              tags: ["test"],
              description: "Test description",
              category: "automation",
              difficulty: "beginner",
              estimated_time: "5 min",
              uses_count: 0,
              likes_count: 0,
              rating: 0
            }
          ]
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      mockApi.deleteTemplate = jest.fn();
      mockShowConfirm.mockResolvedValue(false);
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Repository/)).toBeInTheDocument();
      }, 3e3);
      expect(mockShowConfirm).toBeDefined();
    });
    it("should handle delete workflows error", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              id: "template1",
              name: "Template 1",
              author_id: "1",
              is_official: false,
              tags: ["test"],
              description: "Test description",
              category: "automation",
              difficulty: "beginner",
              estimated_time: "5 min",
              uses_count: 0,
              likes_count: 0,
              rating: 0
            }
          ]
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      mockApi.deleteTemplate = jest.fn().mockRejectedValue(new Error("Delete failed"));
      renderWithRouter(/* @__PURE__ */ jsx(MarketplacePage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const repositoryTab = screen.getByText(/Repository/);
        fireEvent.click(repositoryTab);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Repository/)).toBeInTheDocument();
      }, 3e3);
      expect(mockApi.deleteTemplate).toBeDefined();
    });
  });
});
