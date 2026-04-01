import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Logger Map Operations (Phase 4.2)", () => {
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
  describe("Agent data mapping - agentsData", () => {
    it("should load and map multiple agents from localStorage", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
          author_id: "user-1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: "Agent 2",
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
      expect(result.current.agents).toHaveLength(2);
    });
    it("should map agent properties correctly", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
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
      expect(result.current.agents[0]).toHaveProperty("id");
      expect(result.current.agents[0]).toHaveProperty("name");
      expect(result.current.agents[0]).toHaveProperty("author_id");
    });
    it("should access a.id property in mapped agents", async () => {
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
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].id).toBe("agent-1");
    });
    it("should access a.name property in mapped agents", async () => {
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
      expect(result.current.agents[0].name).toBe("Test Agent");
    });
    it("should access a.author_id property in mapped agents", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: "user-123",
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
      expect(result.current.agents[0].author_id).toBe("user-123");
    });
    it("should preserve author_id for agents with and without author", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: "user-1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: "Agent 2",
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
      expect(result.current.agents[0].author_id).toBe("user-1");
      expect(result.current.agents[1].author_id).toBeNull();
    });
    it("should load agent with correct structure", async () => {
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
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0]).toMatchObject({
        id: "agent-1",
        name: "Agent",
        author_id: null
      });
    });
    it("should map all agents in agentsData array", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
          author_id: "user-1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: "Agent 2",
          author_id: "user-2",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-3",
          name: "Agent 3",
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
      expect(result.current.agents).toHaveLength(3);
    });
  });
});
