import { renderHook, act } from "@testing-library/react";
import { waitForWithTimeoutFakeTimers } from "../../test/utils/waitForWithTimeout";
import { isRunningUnderStryker } from "../../test/utils/detectStryker";
import { useMarketplaceData } from "./useMarketplaceData";
import { getLocalStorageItem } from "../storage";
const waitForWithTimeout = waitForWithTimeoutFakeTimers;
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useMarketplaceData - Method Expressions", () => {
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
    is_official: false,
  };
  beforeEach(() => {
    jest.setTimeout(18e4);
    jest.clearAllMocks();
    if (isRunningUnderStryker()) {
      jest.useRealTimers();
    } else {
      jest.useFakeTimers();
    }
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
  afterEach(async () => {
    if (!isRunningUnderStryker() && jest.isMockFunction(setTimeout)) {
      try {
        jest.advanceTimersByTime(0);
        jest.runOnlyPendingTimers();
        jest.runAllTimers();
        jest.clearAllTimers();
      } catch (e) {
        jest.clearAllTimers();
      }
    }
    jest.useRealTimers();
  });
  describe("Sort callback - arrow function", () => {
    it("should execute sort callback with arrow function syntax", async () => {
      const agents = [
        {
          ...mockAgent,
          id: "agent-1",
          name: "Zebra Agent",
          is_official: false,
        },
        {
          ...mockAgent,
          id: "agent-2",
          name: "Alpha Agent",
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
      expect(result.current.agents[1].name).toBe("Zebra Agent");
    });
    it("should verify sort callback compares aIsOfficial and bIsOfficial", async () => {
      const agents = [
        {
          ...mockAgent,
          id: "agent-1",
          name: "Unofficial Agent",
          is_official: false,
        },
        {
          ...mockAgent,
          id: "agent-2",
          name: "Official Agent",
          is_official: true,
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].is_official).toBe(true);
      expect(result.current.agents[1].is_official).toBe(false);
    });
    it("should verify sort callback uses subtraction operator (bIsOfficial - aIsOfficial)", async () => {
      const agents = [
        { ...mockAgent, id: "agent-1", is_official: false },
        { ...mockAgent, id: "agent-2", is_official: true },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].is_official).toBe(true);
    });
    it("should verify sort callback uses subtraction operator (dateB - dateA)", async () => {
      const agents = [
        { ...mockAgent, id: "agent-1", published_at: "2024-01-01T00:00:00Z" },
        { ...mockAgent, id: "agent-2", published_at: "2024-01-02T00:00:00Z" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].published_at).toBe(
        "2024-01-02T00:00:00Z",
      );
      expect(result.current.agents[1].published_at).toBe(
        "2024-01-01T00:00:00Z",
      );
    });
    it("should verify sort callback uses localeCompare method", async () => {
      const agents = [
        { ...mockAgent, id: "agent-1", name: "Zebra Agent" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
      expect(result.current.agents[1].name).toBe("Zebra Agent");
    });
  });
  describe("Filter callback - arrow function", () => {
    it("should execute filter callback with arrow function syntax", async () => {
      const agents = [
        { ...mockAgent, category: "automation" },
        { ...mockAgent, id: "agent-2", category: "other" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].category).toBe("automation");
    });
    it("should verify filter callback uses toLowerCase() method", async () => {
      const agents = [
        {
          ...mockAgent,
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
    });
    it("should verify filter callback uses includes() method", async () => {
      const agents = [
        {
          ...mockAgent,
          name: "Test Agent",
          description: "Other",
          tags: ["other"],
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].name).toBe("Test Agent");
    });
    it("should verify filter callback uses some() method on tags", async () => {
      const agents = [
        {
          ...mockAgent,
          name: "Agent One",
          description: "Description",
          tags: ["test", "automation"],
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
    });
  });
  describe("Map callback - arrow function", () => {
    it("should execute map callback with arrow function syntax", async () => {
      const agents = [
        { ...mockAgent, author_id: null },
        { ...mockAgent, id: "agent-2", author_id: null },
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
      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData.length).toBe(2);
      expect(savedData[0].author_id).toBe("user-1");
      expect(savedData[1].author_id).toBe("user-1");
    });
    it("should verify map callback returns updated agent object", async () => {
      const agents = [{ ...mockAgent, author_id: null }];
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
      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData[0]).toHaveProperty("author_id", "user-1");
      expect(savedData[0]).toHaveProperty("author_name", "testuser");
      expect(savedData[0]).toHaveProperty("id", "agent-1");
    });
  });
  describe("Method chaining - toLowerCase().includes()", () => {
    it("should verify method chaining works correctly", async () => {
      const agents = [
        {
          ...mockAgent,
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
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
    });
    it("should verify method chaining with tags", async () => {
      const agents = [
        {
          ...mockAgent,
          name: "Agent",
          description: "Description",
          tags: ["TEST"],
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
    });
  });
  describe("Date method - new Date().getTime()", () => {
    it("should verify new Date().getTime() is used for date comparison", async () => {
      const agents = [
        { ...mockAgent, published_at: "2024-01-01T00:00:00Z" },
        { ...mockAgent, id: "agent-2", published_at: "2024-01-02T00:00:00Z" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].published_at).toBe(
        "2024-01-02T00:00:00Z",
      );
      expect(result.current.agents[1].published_at).toBe(
        "2024-01-01T00:00:00Z",
      );
    });
    it("should verify new Date() constructor is called", async () => {
      const agents = [{ ...mockAgent, published_at: "2024-01-01T00:00:00Z" }];
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
    });
  });
  describe("String method - localeCompare()", () => {
    it("should verify localeCompare() is used for alphabetical sort", async () => {
      const agents = [
        { ...mockAgent, name: "Zebra Agent" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents[0].name).toBe("Alpha Agent");
      expect(result.current.agents[1].name).toBe("Zebra Agent");
    });
    it("should verify localeCompare() handles empty string names", async () => {
      const agents = [
        { ...mockAgent, name: "" },
        { ...mockAgent, id: "agent-2", name: "Alpha Agent" },
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
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(2);
    });
  });
  describe("Array method - some() callback", () => {
    it("should verify some() callback is arrow function in workflow detection", async () => {
      const template = {
        id: "template-1",
        name: "Test Template",
        description: "Test Description",
        // No "workflow of workflows" to force tag path
        category: "automation",
        tags: ["workflow", "test"],
        // Tags include 'workflow' to trigger the some() check
      };
      const getJsonMock = jest.fn().mockResolvedValue([template]);
      mockHttpClient.get.mockResolvedValue({
        json: getJsonMock,
      });
      const postJsonMock = jest.fn().mockResolvedValue({
        nodes: [
          {
            // Node exists so nodes.some() runs
            // Inside nodes.some() callback (line 58), checks multiple conditions including:
            // workflow.tags.some(tag => tag.toLowerCase().includes('workflow')) on line 67
            // This exercises the arrow function callback mutation target
            // Since workflow.tags is ['workflow', 'test'], the tag check should return true
            // We also set description to 'workflow' to ensure hasWorkflowReference is true via description.includes('workflow')
            id: "node-1",
            data: {},
            workflow_id: void 0,
            description: "workflow",
            // This ensures hasWorkflowReference is true via description.includes('workflow')
            name: void 0,
          },
        ],
      });
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: postJsonMock,
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
      const timeout = isRunningUnderStryker() ? 12e4 : 9e4;
      await act(async () => {
        await result.current.fetchWorkflowsOfWorkflows();
      });
      await waitForWithTimeout(() => {
        expect(mockHttpClient.get).toHaveBeenCalled();
        expect(getJsonMock).toHaveBeenCalled();
      }, timeout);
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
        expect(postJsonMock).toHaveBeenCalled();
      }, timeout);
      if (!isRunningUnderStryker()) {
        for (let i = 0; i < 20; i++) {
          await act(async () => {
            jest.advanceTimersByTime(1e3);
            jest.runOnlyPendingTimers();
          });
          await Promise.resolve();
        }
      } else {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
        });
      }
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      }, timeout);
      if (!isRunningUnderStryker()) {
        for (let i = 0; i < 15; i++) {
          await act(async () => {
            jest.advanceTimersByTime(1e3);
            jest.runOnlyPendingTimers();
          });
          await Promise.resolve();
        }
      } else {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
        });
      }
      await waitForWithTimeout(() => {
        expect(result.current.workflowsOfWorkflows).toBeDefined();
        expect(Array.isArray(result.current.workflowsOfWorkflows)).toBe(true);
        expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
        expect(result.current.workflowsOfWorkflows[0].id).toBe("template-1");
      }, timeout);
      expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0);
    });
    it("should verify some() callback uses toLowerCase().includes() in tags check", async () => {
      const agents = [{ ...mockAgent, tags: ["TEST", "automation"] }];
      mockGetLocalStorageItem.mockReturnValue(agents);
      const { result } = renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "test",
          // lowercase
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "agents",
        }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.agents.length).toBe(1);
      expect(result.current.agents[0].tags).toContain("TEST");
    });
  });
});
