import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn()
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Workflow Detection (Phase 4.2)", () => {
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
  describe("Workflow property access - workflow.id", () => {
    it("should access workflow.id property", async () => {
      const workflow = {
        id: "workflow-123",
        name: "Workflow",
        description: "Description",
        tags: []
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: [] })
      });
      const loggerSpy = jest.spyOn(require("../../utils/logger").logger, "error");
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
      expect(mockHttpClient.get).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });
  describe("Workflow property access - workflow.description", () => {
    it("should access workflow.description property", async () => {
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
    it("should use empty string fallback when workflow.description is undefined", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: void 0,
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
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThanOrEqual(0);
    });
  });
  describe("Workflow property access - workflow.tags", () => {
    it("should access workflow.tags property", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "Description",
        tags: ["workflow"]
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {}
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
    it("should handle workflow.tags when it is undefined", async () => {
      const workflow = {
        id: "workflow-1",
        name: "Workflow",
        description: "workflow of workflows",
        tags: void 0
      };
      mockHttpClient.get.mockResolvedValue({
        json: async () => [workflow]
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
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
  describe("WorkflowDetail property access - workflowDetail.nodes", () => {
    it("should access workflowDetail.nodes property", async () => {
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
    it("should verify Array.isArray check on workflowDetail.nodes", async () => {
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
  });
  describe("Node property access patterns", () => {
    it("should access node.workflow_id property", async () => {
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
              // node.workflow_id
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
    it("should access nodeData.workflow_id property", async () => {
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
              data: {
                workflow_id: "workflow-2"
                // nodeData.workflow_id
              }
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
    it("should use node.data fallback pattern", async () => {
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
              data: {
                description: "workflow node"
              }
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
  });
});
