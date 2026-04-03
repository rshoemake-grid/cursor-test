import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Fallback Patterns", () => {
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
  describe("Fallback pattern - node.data || {}", () => {
    it("should use empty object when node.data is undefined", async () => {
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
          nodes: [
            {
              // node.data is undefined, should use {}
              workflow_id: "workflow-123",
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should use node.data when it exists", async () => {
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
          nodes: [
            {
              data: { workflow_id: "workflow-123" },
              // node.data exists
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
  });
  describe('Fallback pattern - node.description || nodeData.description || ""', () => {
    it("should use empty string when both node.description and nodeData.description are undefined", async () => {
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
          nodes: [
            {
              // Both undefined, should use ''
              workflow_id: "workflow-123",
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should use node.description when it exists", async () => {
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
          nodes: [
            {
              description: "workflow reference",
              // node.description exists
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
    it("should use nodeData.description when node.description is undefined", async () => {
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
          nodes: [
            {
              data: { description: "workflow reference" },
              // nodeData.description exists
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
  });
  describe('Fallback pattern - node.name || nodeData.name || ""', () => {
    it("should use empty string when both node.name and nodeData.name are undefined", async () => {
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
          nodes: [
            {
              workflow_id: "workflow-123",
              // Both name fields undefined
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should use node.name when it exists", async () => {
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
          nodes: [
            {
              name: "workflow node",
              // node.name exists
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
    it("should use nodeData.name when node.name is undefined", async () => {
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
          nodes: [
            {
              data: { name: "workflow node" },
              // nodeData.name exists
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
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3e3 },
      );
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
  });
  describe('Fallback pattern - workflow.description || ""', () => {
    it("should use empty string when workflow.description is undefined", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        // description is undefined
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
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
    it("should use workflow.description when it exists", async () => {
      const template = {
        id: "template-1",
        name: "Template",
        description: "workflow of workflows",
        // description exists
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
  describe("Fallback pattern - user.username || user.email || null", () => {
    it("should use null when both username and email are undefined", async () => {
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
          user: { id: "user-1" },
          // No username or email
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].author_name).toBeNull();
    });
    it("should use username when it exists", async () => {
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
          // username exists
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].author_name).toBe("testuser");
    });
    it("should use email when username is undefined", async () => {
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
          user: { id: "user-1", email: "test@example.com" },
          // email exists, username doesn't
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].author_name).toBe("test@example.com");
    });
  });
  describe('Fallback pattern - a.name || ""', () => {
    it("should use empty string when a.name is undefined in localeCompare", async () => {
      const agents = [
        {
          id: "agent-1",
          // name is undefined
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
        {
          id: "agent-2",
          name: "Agent",
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
          sortBy: "alphabetical",
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
    it("should use a.name when it exists in localeCompare", async () => {
      const agents = [
        {
          id: "agent-1",
          name: "Zebra Agent",
          category: "automation",
          tags: [],
          published_at: "2024-01-01T00:00:00Z",
          is_official: false,
        },
        {
          id: "agent-2",
          name: "Alpha Agent",
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
          sortBy: "alphabetical",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
      expect(result.current.agents[1].name).toBe("Zebra Agent");
    });
  });
  describe('Fallback pattern - b.name || ""', () => {
    it("should use empty string when b.name is undefined in localeCompare", async () => {
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
          // name is undefined
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
          sortBy: "alphabetical",
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
