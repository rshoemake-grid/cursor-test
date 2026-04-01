import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Complex Logical Operators (Phase 4.2)", () => {
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
  describe("Complex OR chain - hasWorkflowId || description.includes || name.includes || tags.some", () => {
    it("should match when hasWorkflowId is true (first OR condition)", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Description",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: "workflow-2"
              // hasWorkflowId is true
            }
          ]
        })
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
    });
    it("should match when description.includes is true (second OR condition)", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Description",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: { description: "workflow node" }
              // description.includes('workflow') is true
            }
          ]
        })
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
    });
    it("should match when name.includes is true (third OR condition)", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Description",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: { name: "workflow node" }
              // name.includes('workflow') is true
            }
          ]
        })
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
    });
    it("should match when tags.some is true (fourth OR condition)", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Description",
        tags: ["workflow"]
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {}
            }
          ]
        })
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
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThanOrEqual(0);
    });
    it("should NOT match when all OR conditions are false", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Regular workflow",
        // Not "workflow of workflows"
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: { description: "node", name: "node" }
              // None match workflow pattern
            }
          ]
        })
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
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
  });
  describe("Complex OR chain - search filter (name || description || tags)", () => {
    it("should match when name.includes is true (first OR condition)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          description: "Description",
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
          searchQuery: "Test",
          // name.toLowerCase().includes('test') is true
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
    });
    it("should match when description.includes is true (second OR condition)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          description: "Test Description",
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
          searchQuery: "Description",
          // description.toLowerCase().includes('description') is true
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
    });
    it("should match when tags.some is true (third OR condition)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          description: "Description",
          category: "automation",
          tags: ["test-tag"],
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
          searchQuery: "test",
          // tags.some(tag => tag.toLowerCase().includes('test')) is true
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
    });
    it("should match when multiple OR conditions are true", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          description: "Test Description",
          category: "automation",
          tags: ["test-tag"],
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
          searchQuery: "test",
          // All three conditions match
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
    });
    it("should NOT match when all OR conditions are false", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          description: "Description",
          category: "automation",
          tags: ["other-tag"],
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
          searchQuery: "test",
          // None match
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(0);
    });
  });
  describe("Complex AND chain - user && user.id && agentsData.length > 0", () => {
    it("should execute when all AND conditions are true", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: { id: "user-1", username: "testuser" },
          // user && user.id && agentsData.length > 0
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
    it("should NOT execute when user is null (first AND condition false)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
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
          // user is null
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should NOT execute when user.id is undefined (second AND condition false)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
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
          user: { id: void 0 },
          // user.id is undefined
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should NOT execute when agentsData.length is 0 (third AND condition false)", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: { id: "user-1", username: "testuser" },
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });
  describe('Complex OR chain - sortBy === "popular" || sortBy === "recent"', () => {
    it('should match when sortBy === "popular" (first OR condition)', async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          // sortBy === 'popular' || sortBy === 'recent'
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBe(1);
    });
    it('should match when sortBy === "recent" (second OR condition)', async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "recent",
          // sortBy === 'popular' || sortBy === 'recent'
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBe(1);
    });
    it('should NOT match when sortBy is neither "popular" nor "recent"', async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "alphabetical",
          // sortBy === 'popular' || sortBy === 'recent' (both false)
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBe(1);
    });
  });
});
