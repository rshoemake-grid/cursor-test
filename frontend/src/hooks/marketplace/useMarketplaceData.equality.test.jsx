import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Equality Operators", () => {
  let mockHttpClient;
  let mockStorage;
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
  describe("Category equality - a.category === category", () => {
    it("should filter when category matches exactly", async () => {
      const agents = [
        { ...mockAgent, category: "automation" },
        { ...mockAgent, id: "agent-2", category: "other" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "automation",
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
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].category).toBe("automation");
    });
    it("should NOT filter when category does not match", async () => {
      const agents = [
        { ...mockAgent, category: "automation" },
        { ...mockAgent, id: "agent-2", category: "other" },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "different",
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
      expect(result.current.agents.length).toBe(0);
    });
    it("should use strict equality (=== not ==)", async () => {
      const agents = [
        { ...mockAgent, category: "5" },
        // String '5'
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: 5,
          // Number 5
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
      expect(result.current.agents.length).toBe(0);
    });
  });
  describe('SortBy equality - sortBy === "popular"', () => {
    it('should match exactly "popular"', async () => {
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
  describe('SortBy equality - sortBy === "recent"', () => {
    it('should match exactly "recent"', async () => {
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
  });
  describe('ActiveTab equality - activeTab === "repository"', () => {
    it('should match exactly "repository"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
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
    it('should NOT match "Repository" (case sensitive)', async () => {
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
          activeTab: "Repository",
          // Case mismatch - should not match 'repository'
          repositorySubTab: "workflows",
        }),
      );
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.agents.length).toBe(0);
    });
  });
  describe('RepositorySubTab equality - repositorySubTab === "workflows"', () => {
    it('should match exactly "workflows"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [],
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
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents.length).toBeGreaterThan(0);
    });
  });
  describe("Equality mutations would break functionality", () => {
    it("should fail if === mutated to == (type coercion)", async () => {
      const agents = [
        { ...mockAgent, category: "5" },
        // String
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: 5,
          // Number
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
      expect(result.current.agents.length).toBe(0);
    });
    it("should fail if === mutated to !==", async () => {
      const agents = [{ ...mockAgent, category: "automation" }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "automation",
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
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].category).toBe("automation");
    });
  });
});
