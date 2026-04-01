import { renderHook, act } from "@testing-library/react";
import { useMarketplaceActions } from "./useMarketplaceActions";
import { showError, showSuccess } from "../../utils/notifications";
import { STORAGE_KEYS } from "../../config/constants";
import { PENDING_AGENTS_STORAGE_KEY, PENDING_TOOLS_STORAGE_KEY } from "../utils/marketplaceConstants";
import { MARKETPLACE_EVENTS } from "../utils/marketplaceEventConstants";
import { MARKETPLACE_TABS, REPOSITORY_SUB_TABS } from "./useMarketplaceTabs";
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn()
}));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));
const mockShowError = showError;
const mockShowSuccess = showSuccess;
describe("useMarketplaceActions", () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
  const mockUseTemplate = jest.fn();
  const mockDeleteSelectedAgents = jest.fn();
  const mockDeleteSelectedWorkflows = jest.fn();
  const mockDeleteSelectedRepositoryAgents = jest.fn();
  const mockFetchRepositoryAgents = jest.fn();
  const mockTemplateSelection = {
    selectedIds: /* @__PURE__ */ new Set(),
    clear: jest.fn()
  };
  const mockAgentSelection = {
    selectedIds: /* @__PURE__ */ new Set(),
    get size() {
      return this.selectedIds.size;
    },
    clear: jest.fn()
  };
  const mockRepositoryAgentSelection = {
    selectedIds: /* @__PURE__ */ new Set(),
    get size() {
      return this.selectedIds.size;
    },
    clear: jest.fn()
  };
  const mockToolSelection = {
    selectedIds: /* @__PURE__ */ new Set(),
    get size() {
      return this.selectedIds.size;
    },
    clear: jest.fn()
  };
  const mockAgents = [
    { id: "agent-1", name: "Agent 1" },
    { id: "agent-2", name: "Agent 2" }
  ];
  const mockRepositoryAgents = [
    { id: "repo-agent-1", name: "Repo Agent 1" },
    { id: "repo-agent-2", name: "Repo Agent 2" }
  ];
  const mockTools = [
    { id: "tool-1", name: "Calculator", tool_config: { tool_name: "calculator" } },
    { id: "tool-2", name: "Web Search", tool_config: { tool_name: "web_search" } }
  ];
  const defaultOptions = {
    activeTab: MARKETPLACE_TABS.AGENTS,
    repositorySubTab: REPOSITORY_SUB_TABS.WORKFLOWS,
    templateSelection: mockTemplateSelection,
    agentSelection: mockAgentSelection,
    repositoryAgentSelection: mockRepositoryAgentSelection,
    toolSelection: mockToolSelection,
    agents: mockAgents,
    repositoryAgents: mockRepositoryAgents,
    tools: mockTools,
    storage: mockStorage,
    useTemplate: mockUseTemplate,
    deleteSelectedAgents: mockDeleteSelectedAgents,
    deleteSelectedWorkflows: mockDeleteSelectedWorkflows,
    deleteSelectedRepositoryAgents: mockDeleteSelectedRepositoryAgents,
    fetchRepositoryAgents: mockFetchRepositoryAgents
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockTemplateSelection.selectedIds.clear();
    mockAgentSelection.selectedIds.clear();
    mockRepositoryAgentSelection.selectedIds.clear();
    mockToolSelection.selectedIds.clear();
    mockTemplateSelection.clear.mockClear();
    mockAgentSelection.clear.mockClear();
    mockRepositoryAgentSelection.clear.mockClear();
    mockToolSelection.clear.mockClear();
    mockStorage.getItem.mockReset();
    mockStorage.setItem.mockReset();
    jest.useFakeTimers();
  });
  afterEach(async () => {
    jest.advanceTimersByTime(0);
    jest.runOnlyPendingTimers();
    jest.runAllTimers();
    jest.advanceTimersByTime(1e3);
    await Promise.resolve();
    await Promise.resolve();
    jest.useRealTimers();
  });
  describe("hook initialization", () => {
    it("should initialize without errors", () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      expect(result.current.handleLoadWorkflows).toBeDefined();
      expect(result.current.handleUseAgents).toBeDefined();
      expect(result.current.handleUseTools).toBeDefined();
      expect(result.current.handleDeleteAgents).toBeDefined();
      expect(result.current.handleDeleteWorkflows).toBeDefined();
      expect(result.current.handleDeleteRepositoryAgents).toBeDefined();
    });
  });
  describe("handleLoadWorkflows", () => {
    it("should load multiple workflows sequentially", async () => {
      mockTemplateSelection.selectedIds.add("template-1");
      mockTemplateSelection.selectedIds.add("template-2");
      mockUseTemplate.mockResolvedValue(void 0);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        const promise = result.current.handleLoadWorkflows();
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        await promise;
      });
      expect(mockUseTemplate).toHaveBeenCalledTimes(2);
      expect(mockUseTemplate).toHaveBeenCalledWith("template-1");
      expect(mockUseTemplate).toHaveBeenCalledWith("template-2");
      expect(mockTemplateSelection.clear).toHaveBeenCalled();
    });
    it("should clear template selection after loading", async () => {
      mockTemplateSelection.selectedIds.add("template-1");
      mockUseTemplate.mockResolvedValue(void 0);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        const promise = result.current.handleLoadWorkflows();
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        await promise;
      });
      expect(mockTemplateSelection.clear).toHaveBeenCalled();
    });
    it("should handle empty template selection", async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleLoadWorkflows();
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      });
      expect(mockUseTemplate).not.toHaveBeenCalled();
      expect(mockTemplateSelection.clear).toHaveBeenCalled();
    });
  });
  describe("handleUseAgents", () => {
    it("should add agents to workflow from agents tab", () => {
      mockAgentSelection.selectedIds.add("agent-1");
      mockAgentSelection.selectedIds.add("agent-2");
      mockStorage.getItem.mockReturnValue("tab-123");
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseAgents();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_TAB);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        PENDING_AGENTS_STORAGE_KEY,
        expect.stringContaining('"tabId":"tab-123"')
      );
      expect(mockShowSuccess).toHaveBeenCalledWith("2 agent(s) added to workflow");
      expect(mockAgentSelection.clear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    it("should add repository agents to workflow from repository agents tab", () => {
      mockRepositoryAgentSelection.selectedIds.add("repo-agent-1");
      mockStorage.getItem.mockReturnValue("tab-123");
      const options = {
        ...defaultOptions,
        activeTab: MARKETPLACE_TABS.REPOSITORY,
        repositorySubTab: REPOSITORY_SUB_TABS.AGENTS
      };
      const { result } = renderHook(() => useMarketplaceActions(options));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseAgents();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      const setItemCall = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === PENDING_AGENTS_STORAGE_KEY
      );
      expect(setItemCall).toBeDefined();
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData.agents).toEqual([mockRepositoryAgents[0]]);
      expect(mockShowSuccess).toHaveBeenCalledWith("1 agent(s) added to workflow");
      expect(mockRepositoryAgentSelection.clear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    it("should show error when storage is not available", () => {
      const options = {
        ...defaultOptions,
        storage: null
      };
      const { result } = renderHook(() => useMarketplaceActions(options));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseAgents();
      });
      expect(mockShowError).toHaveBeenCalledWith("Storage not available");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should show error when no active workflow tab", () => {
      mockStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseAgents();
      });
      expect(mockShowError).toHaveBeenCalledWith("No active workflow found. Please open a workflow first.");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should dispatch custom event when adding agents", () => {
      mockAgentSelection.selectedIds.add("agent-1");
      mockStorage.getItem.mockReturnValue("tab-123");
      const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseAgents();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(dispatchEventSpy).toHaveBeenCalled();
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.type).toBe(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW);
      expect(event.detail.tabId).toBe("tab-123");
      expect(event.detail.agents).toEqual([mockAgents[0]]);
      dispatchEventSpy.mockRestore();
    });
  });
  describe("handleUseTools", () => {
    it("should add selected tools to workflow", () => {
      mockToolSelection.selectedIds.add("tool-1");
      mockToolSelection.selectedIds.add("tool-2");
      mockStorage.getItem.mockReturnValue("tab-123");
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseTools();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_TAB);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        PENDING_TOOLS_STORAGE_KEY,
        expect.stringContaining('"tabId":"tab-123"')
      );
      expect(mockShowSuccess).toHaveBeenCalledWith("2 tool(s) added to workflow");
      expect(mockToolSelection.clear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    it("should show error when storage is not available", () => {
      const options = {
        ...defaultOptions,
        storage: null
      };
      const { result } = renderHook(() => useMarketplaceActions(options));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseTools();
      });
      expect(mockShowError).toHaveBeenCalledWith("Storage not available");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should show error when no active workflow tab", () => {
      mockToolSelection.selectedIds.add("tool-1");
      mockStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseTools();
      });
      expect(mockShowError).toHaveBeenCalledWith("No active workflow found. Please open a workflow first.");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should dispatch ADD_TOOLS_TO_WORKFLOW event", () => {
      mockToolSelection.selectedIds.add("tool-1");
      mockStorage.getItem.mockReturnValue("tab-123");
      const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      act(() => {
        result.current.handleUseTools();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(dispatchEventSpy).toHaveBeenCalled();
      const event = dispatchEventSpy.mock.calls.find(
        (call) => call[0].type === MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW
      );
      expect(event).toBeDefined();
      const eventDetail = event[0].detail;
      expect(eventDetail.tabId).toBe("tab-123");
      expect(eventDetail.tools).toEqual([mockTools[0]]);
      dispatchEventSpy.mockRestore();
    });
  });
  describe("handleDeleteAgents", () => {
    it("should delete selected agents", async () => {
      mockAgentSelection.selectedIds.add("agent-1");
      mockDeleteSelectedAgents.mockResolvedValue(void 0);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteAgents();
      });
      expect(mockDeleteSelectedAgents).toHaveBeenCalledWith(mockAgentSelection.selectedIds);
    });
    it("should handle empty selection", async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteAgents();
      });
      expect(mockDeleteSelectedAgents).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
    });
  });
  describe("handleDeleteWorkflows", () => {
    it("should delete selected workflows", async () => {
      mockTemplateSelection.selectedIds.add("template-1");
      mockDeleteSelectedWorkflows.mockResolvedValue(void 0);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteWorkflows();
      });
      expect(mockDeleteSelectedWorkflows).toHaveBeenCalledWith(mockTemplateSelection.selectedIds);
    });
    it("should handle empty selection", async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteWorkflows();
      });
      expect(mockDeleteSelectedWorkflows).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
    });
  });
  describe("handleDeleteRepositoryAgents", () => {
    it("should delete selected repository agents", async () => {
      mockRepositoryAgentSelection.selectedIds.add("repo-agent-1");
      mockDeleteSelectedRepositoryAgents.mockResolvedValue(void 0);
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteRepositoryAgents();
      });
      expect(mockDeleteSelectedRepositoryAgents).toHaveBeenCalledWith(
        mockRepositoryAgentSelection.selectedIds,
        mockFetchRepositoryAgents
      );
    });
    it("should handle empty selection", async () => {
      const { result } = renderHook(() => useMarketplaceActions(defaultOptions));
      expect(result.current).not.toBeNull();
      await act(async () => {
        await result.current.handleDeleteRepositoryAgents();
      });
      expect(mockDeleteSelectedRepositoryAgents).toHaveBeenCalledWith(
        /* @__PURE__ */ new Set(),
        mockFetchRepositoryAgents
      );
    });
  });
});
