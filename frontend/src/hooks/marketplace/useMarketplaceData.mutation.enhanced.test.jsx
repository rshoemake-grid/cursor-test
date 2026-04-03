import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceData } from "./useMarketplaceData";
import { useTemplatesData } from "./useTemplatesData";
import { useAgentsData } from "./useAgentsData";
import { useRepositoryAgentsData } from "./useRepositoryAgentsData";
import { useWorkflowsOfWorkflowsData } from "./useWorkflowsOfWorkflowsData";
import { useDataFetching } from "../utils/useDataFetching";
jest.mock("./useTemplatesData");
jest.mock("./useAgentsData");
jest.mock("./useRepositoryAgentsData");
jest.mock("./useWorkflowsOfWorkflowsData");
jest.mock("../utils/useDataFetching");
const mockUseTemplatesData = useTemplatesData;
const mockUseAgentsData = useAgentsData;
const mockUseRepositoryAgentsData = useRepositoryAgentsData;
const mockUseWorkflowsOfWorkflowsData = useWorkflowsOfWorkflowsData;
const mockUseDataFetching = useDataFetching;
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
describe("useMarketplaceData - Enhanced Mutation Killers", () => {
  let mockStorage;
  let mockHttpClient;
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    mockUseTemplatesData.mockReturnValue({
      fetchTemplates: jest.fn(),
    });
    mockUseAgentsData.mockReturnValue({
      fetchAgents: jest.fn(),
    });
    mockUseRepositoryAgentsData.mockReturnValue({
      fetchRepositoryAgents: jest.fn(),
    });
    mockUseWorkflowsOfWorkflowsData.mockReturnValue({
      fetchWorkflowsOfWorkflows: jest.fn(),
    });
    mockUseDataFetching.mockImplementation(({ initialData }) => ({
      data: initialData,
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(initialData),
    }));
  });
  describe("Loading State Calculation - Independent Condition Testing", () => {
    describe("Repository/Workflows branch", () => {
      it("should return loading true when repository/workflows and templates loading", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 1) {
            return {
              data: initialData,
              loading: true,
              // Loading
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
        expect(result.current.loading).toBe(true);
      });
      it("should return loading false when repository/workflows but templates not loading", () => {
        mockUseDataFetching.mockImplementation(({ initialData }) => ({
          data: initialData,
          loading: false,
          // Not loading
          error: null,
          refetch: jest.fn(),
        }));
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
        expect(result.current.loading).toBe(false);
      });
      it("should return loading false when repository but agents sub-tab", () => {
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          return {
            data: initialData,
            loading: false,
            // All not loading
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "agents",
            // Wrong sub-tab
          }),
        );
        expect(result.current.loading).toBe(false);
      });
    });
    describe("Repository/Agents branch", () => {
      it("should return loading true when repository/agents and repository agents loading", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 4) {
            return {
              data: initialData,
              loading: true,
              // Loading
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "agents",
          }),
        );
        expect(result.current.loading).toBe(true);
      });
    });
    describe("Workflows-of-Workflows branch", () => {
      it("should return loading true when workflows-of-workflows tab and loading", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 2) {
            return {
              data: initialData,
              loading: true,
              // Loading
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.loading).toBe(true);
      });
    });
    describe("Agents branch", () => {
      it("should return loading true when agents tab and loading", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 3) {
            return {
              data: initialData,
              loading: true,
              // Loading
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            activeTab: "agents",
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.loading).toBe(true);
      });
    });
  });
  describe("Data Syncing Conditionals", () => {
    describe("workflowsOfWorkflowsFetching.data conditional", () => {
      it("should verify exact truthy check - data is truthy", () => {
        const mockData = [{ id: "1", name: "Template" }];
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 2) {
            return {
              data: mockData,
              // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.workflowsOfWorkflows).toEqual(mockData);
      });
      it("should verify exact truthy check - data is null", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 3) {
            return {
              data: null,
              // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.workflowsOfWorkflows).toEqual([]);
      });
      it("should verify exact truthy check - data is undefined", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 3) {
            return {
              data: void 0,
              // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.workflowsOfWorkflows).toEqual([]);
      });
    });
    describe("agentsFetching.data conditional", () => {
      it("should verify exact truthy check - data is truthy", () => {
        const mockData = [{ id: "1", name: "Agent" }];
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 3) {
            return {
              data: mockData,
              // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            activeTab: "agents",
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.agents).toEqual(mockData);
      });
      it("should verify exact truthy check - data is falsy", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 4) {
            return {
              data: null,
              // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            activeTab: "agents",
            repositorySubTab: "workflows",
          }),
        );
        expect(result.current.agents).toEqual([]);
      });
    });
    describe("repositoryAgentsFetching.data conditional", () => {
      it("should verify exact truthy check - data is truthy", () => {
        const mockData = [{ id: "1", name: "Agent" }];
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 4) {
            return {
              data: mockData,
              // Truthy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "agents",
          }),
        );
        expect(result.current.repositoryAgents).toEqual(mockData);
      });
      it("should verify exact truthy check - data is falsy", () => {
        let callIndex = 0;
        mockUseDataFetching.mockImplementation(({ initialData }) => {
          callIndex++;
          if (callIndex === 2) {
            return {
              data: null,
              // Falsy
              loading: false,
              error: null,
              refetch: jest.fn(),
            };
          }
          return {
            data: initialData,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
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
            repositorySubTab: "agents",
          }),
        );
        expect(result.current.repositoryAgents).toEqual([]);
      });
    });
  });
  describe("Tab Routing - Independent Condition Testing", () => {
    it("should route to templates when repository/workflows", async () => {
      let callIndex = 0;
      const refetchFunctions = [];
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++;
        const refetch = jest.fn().mockResolvedValue(initialData);
        refetchFunctions.push({ callIndex, refetch });
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        };
      });
      renderHook(() =>
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
      await waitForWithTimeout(() => {
        const templatesRefetch = refetchFunctions.find(
          (f) => f.callIndex === 1,
        )?.refetch;
        expect(templatesRefetch).toBeDefined();
        expect(templatesRefetch).toHaveBeenCalled();
      });
    });
    it("should route to repository agents when repository/agents", async () => {
      let callIndex = 0;
      const refetchFunctions = [];
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++;
        const refetch = jest.fn().mockResolvedValue(initialData);
        refetchFunctions.push({ callIndex, refetch });
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        };
      });
      renderHook(() =>
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
        const repositoryAgentsRefetch = refetchFunctions.find(
          (f) => f.callIndex === 4,
        )?.refetch;
        expect(repositoryAgentsRefetch).toBeDefined();
        expect(repositoryAgentsRefetch).toHaveBeenCalled();
      });
    });
    it("should route to workflows-of-workflows when workflows-of-workflows tab", async () => {
      let callIndex = 0;
      const refetchFunctions = [];
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++;
        const refetch = jest.fn().mockResolvedValue(initialData);
        refetchFunctions.push({ callIndex, refetch });
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        };
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "workflows-of-workflows",
          repositorySubTab: "workflows",
        }),
      );
      await waitForWithTimeout(() => {
        const workflowsOfWorkflowsRefetch = refetchFunctions.find(
          (f) => f.callIndex === 2,
        )?.refetch;
        expect(workflowsOfWorkflowsRefetch).toBeDefined();
        expect(workflowsOfWorkflowsRefetch).toHaveBeenCalled();
      });
    });
    it("should route to agents when agents tab", async () => {
      let callIndex = 0;
      const refetchFunctions = [];
      mockUseDataFetching.mockImplementation(({ initialData }) => {
        callIndex++;
        const refetch = jest.fn().mockResolvedValue(initialData);
        refetchFunctions.push({ callIndex, refetch });
        return {
          data: initialData,
          loading: false,
          error: null,
          refetch,
        };
      });
      renderHook(() =>
        useMarketplaceData({
          storage: mockStorage,
          httpClient: mockHttpClient,
          apiBaseUrl: "http://api.test",
          category: "",
          searchQuery: "",
          sortBy: "popular",
          user: null,
          activeTab: "agents",
          repositorySubTab: "workflows",
        }),
      );
      await waitForWithTimeout(() => {
        const agentsRefetch = refetchFunctions.find(
          (f) => f.callIndex === 3,
        )?.refetch;
        expect(agentsRefetch).toBeDefined();
        expect(agentsRefetch).toHaveBeenCalled();
      });
    });
  });
});
