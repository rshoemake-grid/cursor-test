import { renderHook, waitFor, act } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - No Coverage Mutants (Phase 4)", () => {
  let mockHttpClient;
  let mockStorage;
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient = {
      get: jest.fn().mockImplementation((url) => {
        if (typeof url === "string" && url.includes("marketplace/agents")) {
          return Promise.reject(new Error("API unavailable"));
        }
        return Promise.resolve({ json: async () => [] });
      }),
      post: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) })
    };
    mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    mockGetLocalStorageItem.mockReturnValue([]);
  });
  describe("Array initialization - workflowsOfWorkflows: Template[] = []", () => {
    it("should initialize empty workflowsOfWorkflows array", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => []
      });
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3e3 });
      expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true);
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should verify empty array initialization is executed", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "Description",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] })
      });
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3e3 });
      expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true);
    });
  });
  describe("Array push operation - workflowsOfWorkflows.push(workflow)", () => {
    it("should execute push operation when workflow matches criteria", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "workflow of workflows",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] })
      });
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3e3 });
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
    it("should verify push operation adds workflow to array", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "composite workflow",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] })
      });
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3e3 });
      expect(result.current.workflowsOfWorkflows.length).toBe(1);
      expect(result.current.workflowsOfWorkflows[0].id).toBe("template-1");
    });
  });
  describe("Early return - fetchRepositoryAgents when !storage", () => {
    it("should execute early return when storage is null", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: null,
          // No storage
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(mockStorage.getItem).not.toHaveBeenCalled();
    });
    it("should verify early return sets repositoryAgents to empty array", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: null,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(Array.isArray(result.current.repositoryAgents)).toBe(true);
      expect(result.current.repositoryAgents.length).toBe(0);
    });
    it("should verify early return sets loading to false", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: null,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.loading).toBe(false);
    });
  });
  describe("Map operation - agentsData mapping", () => {
    it("should execute map operation on agentsData", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: "user-1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents).toHaveLength(1);
      expect(result.current.agents[0]).toHaveProperty("id");
      expect(result.current.agents[0]).toHaveProperty("name");
      expect(result.current.agents[0]).toHaveProperty("author_id");
    });
    it("should map agent with null author_id", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].author_id).toBeNull();
    });
  });
  describe("Array operations - filter and sort chains", () => {
    it("should execute filter operation after map in fetchAgents", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: "Other Agent",
          category: "other",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "automation",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].category).toBe("automation");
    });
    it("should execute sort operation after filter in fetchAgents", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Zebra Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: "Alpha Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "alphabetical",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
      expect(result.current.agents[1].name).toBe("Zebra Agent");
    });
  });
  describe("Wrapper functions - fetch methods", () => {
    it("should call fetchTemplates wrapper (line 187)", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "templates",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      await act(async () => {
        await result.current.fetchTemplates();
      });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
    it("should call fetchWorkflowsOfWorkflows wrapper (line 191)", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows();
      });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
    it("should call fetchAgents wrapper (line 195)", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      await act(async () => {
        await result.current.fetchAgents();
      });
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
    });
    it("should call fetchRepositoryAgents wrapper (line 199)", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      await act(async () => {
        await result.current.fetchRepositoryAgents();
      });
      expect(mockStorage.getItem).toHaveBeenCalled();
    });
  });
  describe("useEffect auto-fetch - templatesFetching.refetch (line 174)", () => {
    it("should call templatesFetching.refetch when activeTab is templates", async () => {
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows"
          // This triggers shouldLoadTemplates = true
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3e3 });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
  });
});
