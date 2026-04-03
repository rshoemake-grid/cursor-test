import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - String Literals", () => {
  let mockHttpClient;
  let mockStorage;
  const mockTemplate = {
    id: "template-1",
    name: "Test Template",
    description: "Test Description",
    category: "automation",
    tags: ["test"],
  };
  const mockAgent = {
    id: "agent-1",
    name: "Test Agent",
    label: "Test Agent",
    description: "Test Description",
    category: "automation",
    tags: ["test"],
    published_at: "2024-01-01T00:00:00Z",
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient = {
      get: jest.fn().mockImplementation((url) => {
        if (typeof url === "string" && url.includes("marketplace/agents")) {
          return Promise.reject(new Error("API unavailable"));
        }
        return Promise.resolve({ json: async () => [] });
      }),
      post: jest
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ nodes: [] }) }),
    };
    mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockGetLocalStorageItem.mockReturnValue([]);
  });
  describe("sortBy string literals - exact matches", () => {
    it('should use exact string "popular" for sortBy', async () => {
      const agents = [
        { ...mockAgent, published_at: "2024-01-01T00:00:00Z" },
        { ...mockAgent, id: "agent-2", published_at: "2024-01-02T00:00:00Z" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].published_at).toBe(
        "2024-01-02T00:00:00Z",
      );
    });
    it('should use exact string "recent" for sortBy', async () => {
      const agents = [
        { ...mockAgent, published_at: "2024-01-01T00:00:00Z" },
        { ...mockAgent, id: "agent-2", published_at: "2024-01-02T00:00:00Z" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "recent",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].published_at).toBe(
        "2024-01-02T00:00:00Z",
      );
    });
    it('should NOT match "Popular" (case sensitive)', async () => {
      const agents = [
        { ...mockAgent, name: "Zebra Agent" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "Popular",
          // Wrong case
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
    it('should NOT match "popular " (with trailing space)', async () => {
      const agents = [
        { ...mockAgent, name: "Zebra Agent" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular ",
          // With trailing space
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
  });
  describe("activeTab string literals - exact matches", () => {
    it('should use exact string "repository" for activeTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
    it('should use exact string "workflows-of-workflows" for activeTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] }),
      });
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
    it('should use exact string "agents" for activeTab', async () => {
      mockGetLocalStorageItem.mockReturnValue([mockAgent]);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBeGreaterThan(0);
    });
  });
  describe("repositorySubTab string literals - exact matches", () => {
    it('should use exact string "workflows" for repositorySubTab', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.get).toHaveBeenCalled();
    });
    it('should use exact string "agents" for repositorySubTab', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]));
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0);
    });
    it('should NOT match "workflow" (singular)', async () => {
      mockStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.REPOSITORY_AGENTS) {
          return JSON.stringify([mockAgent]);
        }
        return null;
      });
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflow",
          // Singular, not plural
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0);
    });
  });
  describe("URL string construction", () => {
    it('should construct exact URL path "/templates/"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled();
      });
      const callUrl = mockHttpClient.get.mock.calls[0][0];
      expect(callUrl).toContain("/templates");
    });
    it('should construct exact URL path "/templates/{id}/use"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, id: "template-1" }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] }),
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
      });
      const callUrl = mockHttpClient.post.mock.calls[0][0];
      expect(callUrl).toContain("/templates/");
      expect(callUrl).toContain("/use");
    });
    it('should use exact query parameter name "sort_by"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled();
      });
      const callUrl = mockHttpClient.get.mock.calls[0][0];
      expect(callUrl).toContain("sort_by=popular");
    });
  });
  describe("Storage key string literals", () => {
    it('should use exact storage key "publishedAgents"', async () => {
      const agents = [{ ...mockAgent, author_id: null }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: { id: "user-1", username: "testuser" },
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "publishedAgents",
        expect.any(String),
      );
    });
    it("should use STORAGE_KEYS.REPOSITORY_AGENTS for repository agents", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]));
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalled();
      });
      expect(mockStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REPOSITORY_AGENTS,
      );
    });
  });
  describe("String mutations would break functionality", () => {
    it('should fail if "popular" mutated to "Popular" (case sensitivity)', async () => {
      const agents = [
        { ...mockAgent, name: "Zebra Agent" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "Popular",
          // Wrong case
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
    it('should fail if "workflows" mutated to "workflow" (singular)', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([mockAgent]));
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflow",
          // Singular
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
    it("should fail if URL path mutated", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "repository",
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalled();
      });
      const callUrl = mockHttpClient.get.mock.calls[0][0];
      expect(callUrl).toContain("/templates");
      expect(callUrl).not.toContain("/template/");
    });
  });
});
