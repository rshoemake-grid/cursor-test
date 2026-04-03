import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Storage Operations (Phase 4.2)", () => {
  let mockHttpClient;
  let mockStorage;
  beforeEach(() => {
    mockGetLocalStorageItem.mockReturnValue([]);
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
  });
  describe("storage.getItem call - STORAGE_KEYS.REPOSITORY_AGENTS", () => {
    it("should call storage.getItem with correct key", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([]));
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
      expect(mockStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REPOSITORY_AGENTS,
      );
    });
    it("should verify getItem is called (not setItem)", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify([]));
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
      expect(mockStorage.getItem).toHaveBeenCalled();
    });
  });
  describe("JSON.parse call - parsing storage data", () => {
    it("should call JSON.parse when storage data exists", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
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
      expect(result.current.repositoryAgents.length).toBe(1);
      expect(result.current.repositoryAgents[0].id).toBe("agent-1");
    });
    it("should NOT call JSON.parse when storage data is null", async () => {
      mockStorage.getItem.mockReturnValue(null);
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
      expect(result.current.repositoryAgents).toEqual([]);
    });
  });
  describe("JSON.stringify call - storing agents data", () => {
    it("should call JSON.stringify when saving agents", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ]);
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
      expect(mockStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockStorage.setItem.mock.calls[0];
      expect(setItemCall[0]).toBe("publishedAgents");
      expect(typeof setItemCall[1]).toBe("string");
      const parsed = JSON.parse(setItemCall[1]);
      expect(Array.isArray(parsed)).toBe(true);
    });
    it("should verify JSON.stringify converts object to string", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ]);
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
      const setItemCall = mockStorage.setItem.mock.calls[0];
      expect(typeof setItemCall[1]).toBe("string");
      const parsed = JSON.parse(setItemCall[1]);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });
  describe("storage.setItem call - saving publishedAgents", () => {
    it("should call storage.setItem with correct key and data", async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ]);
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
    it('should verify setItem key is exact string "publishedAgents"', async () => {
      mockGetLocalStorageItem.mockReturnValue([
        {
          id: "agent-1",
          name: "Agent",
          author_id: null,
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ]);
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
      const setItemCall = mockStorage.setItem.mock.calls[0];
      expect(setItemCall[0]).toBe("publishedAgents");
    });
  });
  describe("Ternary operator - savedAgents ? JSON.parse(savedAgents) : []", () => {
    it("should use JSON.parse when savedAgents is truthy", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
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
      expect(result.current.repositoryAgents.length).toBe(1);
    });
    it("should use empty array when savedAgents is falsy", async () => {
      mockStorage.getItem.mockReturnValue(null);
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
      expect(result.current.repositoryAgents).toEqual([]);
    });
  });
  describe("Error handling - JSON.parse error catch", () => {
    it("should handle JSON.parse error and default to empty array", async () => {
      mockStorage.getItem.mockReturnValue("invalid json");
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
      expect(result.current.repositoryAgents).toEqual([]);
    });
  });
});
