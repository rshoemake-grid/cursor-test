import { renderHook } from "@testing-library/react";
import { waitForWithTimeoutFakeTimers } from "../../test/utils/waitForWithTimeout";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
const waitForWithTimeout = waitForWithTimeoutFakeTimers;
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Initialization", () => {
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
  });
  describe("Initial state values", () => {
    it("should initialize templates as empty array", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
      expect(result.current.templates).toEqual([]);
      expect(result.current.templates).toBeInstanceOf(Array);
      expect(result.current.templates.length).toBe(0);
    });
    it("should initialize workflowsOfWorkflows as empty array", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
      expect(result.current.workflowsOfWorkflows).toEqual([]);
      expect(result.current.workflowsOfWorkflows).toBeInstanceOf(Array);
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should initialize agents as empty array", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
      expect(result.current.agents).toEqual([]);
      expect(result.current.agents).toBeInstanceOf(Array);
      expect(result.current.agents.length).toBe(0);
    });
    it("should initialize repositoryAgents as empty array", () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
      expect(result.current.repositoryAgents).toEqual([]);
      expect(result.current.repositoryAgents).toBeInstanceOf(Array);
      expect(result.current.repositoryAgents.length).toBe(0);
    });
    it("should initialize loading as true", async () => {
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
      expect(typeof result.current.loading).toBe("boolean");
      resolvePromise({ json: async () => [] });
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
  describe("Default empty array handling", () => {
    it("should use empty array when getLocalStorageItem returns undefined", async () => {
      mockGetLocalStorageItem.mockReturnValue(void 0);
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents).toEqual([]);
      expect(result.current.agents.length).toBe(0);
    });
    it("should use empty array when getLocalStorageItem returns null", async () => {
      mockGetLocalStorageItem.mockReturnValue(null);
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents).toEqual([]);
      expect(result.current.agents.length).toBe(0);
    });
    it("should use empty array when storage.getItem returns null", async () => {
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents).toEqual([]);
      expect(result.current.repositoryAgents.length).toBe(0);
    });
    it("should use empty array when storage.getItem returns empty string", async () => {
      mockStorage.getItem.mockReturnValue("");
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.repositoryAgents).toEqual([]);
      expect(result.current.repositoryAgents.length).toBe(0);
    });
    it("should initialize workflowsOfWorkflows array in fetchWorkflowsOfWorkflows", async () => {
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
          activeTab: "workflows-of-workflows",
          repositorySubTab: "agents",
        }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.workflowsOfWorkflows).toEqual([]);
      expect(result.current.workflowsOfWorkflows).toBeInstanceOf(Array);
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should handle empty array operations correctly", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "automation",
          searchQuery: "test",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents).toEqual([]);
      expect(result.current.agents.length).toBe(0);
    });
  });
  describe("Array identity and operations", () => {
    it("should verify empty arrays are truly empty (not [undefined])", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents).toEqual([]);
      expect(result.current.agents[0]).toBeUndefined();
      expect(result.current.agents.length).toBe(0);
    });
    it("should verify array operations work on empty arrays", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "automation",
          searchQuery: "test",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      const filtered = result.current.agents.filter(() => true);
      expect(filtered).toEqual([]);
      expect(filtered.length).toBe(0);
      const mapped = result.current.agents.map(() => ({}));
      expect(mapped).toEqual([]);
      expect(mapped.length).toBe(0);
      const sorted = [...result.current.agents].sort();
      expect(sorted).toEqual([]);
      expect(sorted.length).toBe(0);
    });
  });
});
