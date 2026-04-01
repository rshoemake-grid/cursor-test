import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Response.ok Property (Phase 4.2)", () => {
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
  describe("Response.ok check - workflowResponse.ok", () => {
    it("should check workflowResponse.ok property", async () => {
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
        // workflowResponse.ok is true
        json: async () => ({ nodes: [] })
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
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should NOT process when workflowResponse.ok is false", async () => {
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
        ok: false,
        // workflowResponse.ok is false
        json: async () => ({ nodes: [] })
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
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should verify exact property access workflowResponse.ok", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "workflow of workflows",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        // Should access workflowResponse.ok (not workflowResponse.status)
        json: async () => ({ nodes: [] })
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
  });
  describe("Response.ok check - conditional execution", () => {
    it("should execute workflow processing when ok is true", async () => {
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
    it("should skip workflow processing when ok is false", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "workflow of workflows",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        // Should skip processing
        json: async () => ({ nodes: [] })
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
  describe("Response.ok check - boolean evaluation", () => {
    it("should evaluate ok as boolean true", async () => {
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
        // Boolean true
        json: async () => ({
          nodes: [
            {
              workflow_id: "workflow-2"
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
    it("should evaluate ok as boolean false", async () => {
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
        ok: false,
        // Boolean false
        json: async () => ({ nodes: [] })
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
});
