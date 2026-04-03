import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Length Operations (Phase 4.2)", () => {
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
  describe("Length check - agentsData.length > 0", () => {
    it("should check agentsData.length > 0 when array has items", async () => {
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
    });
    it("should NOT execute map when agentsData.length is 0", async () => {
      mockGetLocalStorageItem.mockReturnValue([]);
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
    it("should verify exact comparison agentsData.length > 0 (not >= 1)", async () => {
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
    });
  });
  describe("Array length - workflowsOfWorkflows.length", () => {
    it("should access workflowsOfWorkflows.length after push operations", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "workflow of workflows",
        tags: [],
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [template],
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
  });
  describe("Array length - agentsData.length in filter operations", () => {
    it("should verify length changes after filter operation", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
        {
          id: "agent-2",
          name: "Other Agent",
          category: "other",
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
    });
  });
  describe("Array length - repositoryAgents.length", () => {
    it("should verify repositoryAgents.length after processing", async () => {
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
  });
  describe("Array length - templates.length", () => {
    it("should verify templates.length after fetch", async () => {
      const templates = [
        {
          id: "template-1",
          name: "Template 1",
          category: "automation",
          tags: [],
        },
        {
          id: "template-2",
          name: "Template 2",
          category: "automation",
          tags: [],
        },
      ];
      mockHttpClient.get.mockResolvedValue({
        json: async () => templates,
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
      expect(result.current.templates.length).toBe(2);
    });
  });
  describe("Array length - agents.length", () => {
    it("should verify agents.length after processing", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent 1",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
        {
          id: "agent-2",
          name: "Agent 2",
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
      expect(result.current.agents.length).toBe(2);
    });
  });
});
