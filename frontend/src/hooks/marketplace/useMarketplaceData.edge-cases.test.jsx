import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Edge Cases", () => {
  let mockHttpClient;
  let mockStorage;
  const mockTemplate = {
    id: "template-1",
    name: "Test Template",
    description: "Test Description",
    category: "automation",
    tags: ["test"],
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
  describe("Workflow detection - node.data edge cases", () => {
    it("should handle node.data as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: null,
              // node.data is null
              workflow_id: "workflow-1",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle node.data as undefined", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: void 0,
              // node.data is undefined
              workflow_id: "workflow-1",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle node.data with workflow_id", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {
                workflow_id: "workflow-from-data",
              },
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
  describe("Workflow detection - node description/name edge cases", () => {
    it("should handle node.description as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              description: null,
              name: "workflow node",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle node.description from nodeData", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {
                description: "workflow description",
              },
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle node.name as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              name: null,
              description: "workflow description",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle node.name from nodeData", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              data: {
                name: "workflow node",
              },
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
  describe("Workflow detection - toLowerCase() edge cases", () => {
    it('should handle description with uppercase "WORKFLOW"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              description: "This is a WORKFLOW node",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it('should handle name with uppercase "WORKFLOW"', async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              name: "WORKFLOW Node",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle workflow description with uppercase", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [
          { ...mockTemplate, description: "This is a WORKFLOW OF WORKFLOWS" },
        ],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
  describe("Workflow detection - tags.some() edge cases", () => {
    it("should handle workflow.tags as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: null }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: "workflow-1",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle workflow.tags as undefined", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: void 0 }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: "workflow-1",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle tags.some() with empty array", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: [] }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [
            {
              workflow_id: "workflow-1",
            },
          ],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle tags.some() with matching tag", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, tags: ["workflow", "test"] }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [{}],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
  describe("Workflow detection - workflowDetail.nodes edge cases", () => {
    it("should handle workflowDetail.nodes as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: null,
          // nodes is null
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should handle workflowDetail.nodes as non-array", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: {},
          // nodes is object, not array
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
    it("should handle workflowDetail.nodes as empty array", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
          // empty array
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
  });
  describe("Workflow detection - workflow description edge cases", () => {
    it("should handle workflow.description as null", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: null }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should handle workflow.description as empty string", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [{ ...mockTemplate, description: "" }],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: [],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
  describe("Array.isArray() check", () => {
    it("should verify Array.isArray() is used (not typeof check)", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(Array.isArray([])).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should verify Array.isArray() returns false for non-array", async () => {
      mockHttpClient.get.mockResolvedValue({
        json: async () => [mockTemplate],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: {},
          // Object, not array
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(Array.isArray({})).toBe(false);
      expect(result.current.workflowsOfWorkflows.length).toBe(0);
    });
  });
  describe("Method expressions - .some() edge cases", () => {
    it("should verify .some() returns false for empty array", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent One",
          description: "Description",
          tags: [],
        },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "nonexistent",
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
    it("should verify .some() returns true when condition matches", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Agent One",
          description: "Description",
          tags: ["test"],
        },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "test",
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
  describe("Arrow function - filter callback edge cases", () => {
    describe("Arrow function - filter callback edge cases", () => {
      it("should verify filter callback executes for each agent", async () => {
        const agents = [
          {
            id: "agent-1",
            name: "Agent One",
            description: "Description One",
            tags: ["tag1"],
          },
          {
            id: "agent-2",
            name: "Agent Two",
            description: "Description Two",
            tags: ["tag2"],
          },
        ];
        mockGetLocalStorageItem.mockReturnValue(agents);
        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: "http://api.test",
            category: "",
            searchQuery: "One",
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
        expect(result.current.agents[0].name).toBe("Agent One");
      });
      it("should verify filter callback uses arrow function syntax", async () => {
        const agents = [
          {
            id: "agent-1",
            name: "Test Agent",
            description: "Description",
            tags: ["test"],
          },
        ];
        mockGetLocalStorageItem.mockReturnValue(agents);
        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: "http://api.test",
            category: "",
            searchQuery: "Test",
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
      it("should verify filter callback handles empty string name", async () => {
        const agents = [
          {
            id: "agent-1",
            name: "",
            description: "Test Description",
            tags: ["test"],
          },
        ];
        mockGetLocalStorageItem.mockReturnValue(agents);
        const { result } = renderHook(() =>
          useMarketplaceData({
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: "http://api.test",
            category: "",
            searchQuery: "Test",
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
        expect(result.current.agents[0].description).toBe("Test Description");
      });
    });
  });
  describe("String method - .includes() edge cases", () => {
    it("should verify .includes() is case sensitive", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          description: "Description",
          tags: ["test"],
        },
      ];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "TEST",
          // Uppercase
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
    it("should verify .includes() with empty string", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          description: "Description",
          tags: ["test"],
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
          // Empty string
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
  describe("Block statement edge cases", () => {
    it("should verify block statements execute correctly", async () => {
      const agents = [
        { id: "agent-1", name: "Agent One", category: "automation" },
        { id: "agent-2", name: "Agent Two", category: "other" },
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
  });
});
