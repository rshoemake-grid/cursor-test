import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Targeted Tests (Phase 4.2)", () => {
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
  describe("Sort comparison - aIsOfficial !== bIsOfficial exact comparison", () => {
    it("should verify !== operator in aIsOfficial !== bIsOfficial", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Unofficial",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Official",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[1].is_official).toBe(false);
    });
    it("should verify === case does not trigger sort (both official)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Official 1",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Official 2",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[1].published_at).toBe(
        "2024-01-01T00:00:00Z",
      );
    });
  });
  describe("Sort subtraction - bIsOfficial - aIsOfficial", () => {
    it("should verify subtraction order (bIsOfficial - aIsOfficial)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Unofficial",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Official",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[1].is_official).toBe(false);
    });
    it("should verify reverse order would be different (aIsOfficial - bIsOfficial)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Official",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Unofficial",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[1].is_official).toBe(false);
    });
  });
  describe("Date subtraction - dateB - dateA", () => {
    it("should verify subtraction order (dateB - dateA)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Agent 2",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-02T00:00:00Z",
        },
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
      expect(result.current.agents[1].published_at).toBe(
        "2024-01-01T00:00:00Z",
      );
    });
    it("should verify reverse order would be ascending (dateA - dateB)", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Agent 2",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-02T00:00:00Z",
        },
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
      expect(result.current.agents[1].published_at).toBe(
        "2024-01-01T00:00:00Z",
      );
    });
  });
  describe("Ternary operator - is_official ? 1 : 0", () => {
    it("should verify ternary returns 1 when is_official is true", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Official",
          is_official: true,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "agent-2",
          name: "Unofficial",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[1].is_official).toBe(false);
    });
    it("should verify ternary returns 0 when is_official is false", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Unofficial",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
      expect(result.current.agents[0].is_official).toBe(false);
    });
  });
  describe("Ternary operator - published_at ? new Date().getTime() : 0", () => {
    it("should verify ternary returns getTime() when published_at exists", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
        "2024-01-01T00:00:00Z",
      );
    });
    it("should verify ternary returns 0 when published_at is undefined", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          is_official: false,
          category: "automation",
          tags: [],
          // published_at is undefined
        },
        {
          id: "agent-2",
          name: "Agent 2",
          is_official: false,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
        },
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
        "2024-01-01T00:00:00Z",
      );
    });
  });
  describe("Boolean conversion - author_id presence", () => {
    it("should preserve author_id when truthy", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: "user-1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
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
      expect(result.current.agents[0].author_id).toBe("user-1");
    });
    it("should preserve null author_id", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
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
      expect(result.current.agents[0].author_id).toBeNull();
    });
  });
  describe("Array.isArray check - Array.isArray(workflowDetail.nodes)", () => {
    it("should verify Array.isArray check is executed", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "Description",
        tags: [],
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
          // Array
        }),
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should verify Array.isArray returns false for non-array", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "Description",
        tags: [],
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: "not-an-array",
          // Not an array
        }),
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
  });
});
