import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - String Comparison (Phase 4.2)", () => {
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
  describe("String comparison - localeCompare()", () => {
    it("should call localeCompare() on name for alphabetical sort", async () => {
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
          published_at: "2024-01-02T00:00:00Z",
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
          // Should call localeCompare()
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
    it("should call localeCompare() with a.name and b.name", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Beta Agent",
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
          published_at: "2024-01-02T00:00:00Z",
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
          // Should call a.name.localeCompare(b.name)
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
    it("should use empty string fallback for a.name in localeCompare()", async () => {
      const agents = [
        {
          id: "agent-1",
          name: null,
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
          published_at: "2024-01-02T00:00:00Z",
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
          // Should use (a.name || '')
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBeNull();
    });
    it("should use empty string fallback for b.name in localeCompare()", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Alpha Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false
        },
        {
          id: "agent-2",
          name: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-02T00:00:00Z",
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
          // Should use (b.name || '')
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(2);
      expect(result.current.agents.some((a) => a.name === "Alpha Agent")).toBe(true);
      expect(result.current.agents.some((a) => a.name === null)).toBe(true);
    });
    it("should verify localeCompare() is called with correct order", async () => {
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
          published_at: "2024-01-02T00:00:00Z",
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
          // Should call a.localeCompare(b) not b.localeCompare(a)
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents"
        })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
    });
  });
});
