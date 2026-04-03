import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Boolean Literals", () => {
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
  describe("Initial loading state - true", () => {
    it("should initialize loading as exactly true (not just truthy)", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      let resolvePromise;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockHttpClient.get.mockImplementation(() => delayedPromise);
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
      expect(result.current.loading).toBe(true);
      expect(result.current.loading).not.toBe(1);
      expect(result.current.loading).not.toBe("true");
      expect(typeof result.current.loading).toBe("boolean");
      resolvePromise({ json: async () => [] });
    });
  });
  describe("is_official boolean checks", () => {
    it("should return 1 when is_official is exactly true", async () => {
      const agents = [
        { ...mockAgent, is_official: true, name: "Official Agent" },
        {
          ...mockAgent,
          id: "agent-2",
          is_official: false,
          name: "Unofficial Agent",
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
    it("should return 0 when is_official is exactly false", async () => {
      const agents = [
        { ...mockAgent, is_official: false, name: "Unofficial Agent" },
        {
          ...mockAgent,
          id: "agent-2",
          is_official: true,
          name: "Official Agent",
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
    it("should handle is_official as undefined (falsy)", async () => {
      const agents = [
        { ...mockAgent, is_official: void 0, name: "Agent One" },
        {
          ...mockAgent,
          id: "agent-2",
          is_official: true,
          name: "Official Agent",
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
    });
  });
  describe("Boolean conditionals - !agent.author_id", () => {
    it("should update when author_id is exactly null", async () => {
      const agents = [{ ...mockAgent, author_id: null }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
    it("should update when author_id is exactly undefined", async () => {
      const agents = [{ ...mockAgent, author_id: void 0 }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
    it("should NOT update when author_id is truthy string", async () => {
      const agents = [{ ...mockAgent, author_id: "existing-author" }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
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
        expect(result.current.loading).toBe(false);
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });
  describe("Boolean mutations would break functionality", () => {
    it("should fail if true mutated to false (loading initial state)", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      let resolvePromise;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockHttpClient.get.mockImplementation(() => delayedPromise);
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
      expect(result.current.loading).toBe(true);
      expect(result.current.loading).not.toBe(false);
      resolvePromise({ json: async () => [] });
    });
    it("should fail if true mutated to 1 (is_official ternary)", async () => {
      const agents = [
        { ...mockAgent, is_official: true, name: "Official Agent" },
        {
          ...mockAgent,
          id: "agent-2",
          is_official: false,
          name: "Unofficial Agent",
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
      expect(typeof result.current.agents[0].is_official).toBe("boolean");
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[0].is_official).not.toBe(1);
    });
  });
});
