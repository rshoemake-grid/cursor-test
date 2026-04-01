import { renderHook, act, waitFor } from "@testing-library/react";
import { useMarketplaceIntegration } from "./useMarketplaceIntegration";
import { logger } from "../../utils/logger";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));
const mockLoggerDebug = logger.debug;
describe("useMarketplaceIntegration", () => {
  let mockSetNodes;
  let mockNotifyModified;
  let mockSaveDraftsToStorage;
  let mockTabDraftsRef;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSetNodes = jest.fn((updater) => {
      if (typeof updater === "function") {
        return updater([]);
      }
      return updater;
    });
    mockNotifyModified = jest.fn();
    mockSaveDraftsToStorage = jest.fn();
    mockTabDraftsRef = {
      current: {
        "tab-1": {
          nodes: [],
          edges: [],
          workflowId: null,
          workflowName: "Test Workflow",
          workflowDescription: "Test Description",
          isUnsaved: false
        }
      }
    };
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe("addAgentsToCanvas", () => {
    it("should add agents to canvas", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          description: "Test Description",
          agent_config: { model: "gpt-4" }
        }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes).toHaveLength(1);
      expect(newNodes[0].type).toBe("agent");
      expect(newNodes[0].data.label).toBe("Test Agent");
    });
    it("should position agents when no existing nodes", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1" },
        { id: "agent-2", name: "Agent 2" }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.x).toBe(250);
      expect(newNodes[0].position.y).toBe(250);
      expect(newNodes[1].position.y).toBe(400);
    });
    it("should position agents after existing nodes", () => {
      const existingNodes = [
        {
          id: "node-1",
          type: "agent",
          position: { x: 100, y: 100 },
          data: {}
        },
        {
          id: "node-2",
          type: "agent",
          position: { x: 500, y: 200 },
          data: {}
        }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent 1" }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(700);
    });
    it("should use label when name is not available", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        {
          id: "agent-1",
          label: "Agent Label",
          description: "Test Description"
        }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Agent Label");
      expect(newNodes[0].data.name).toBe("Agent Label");
    });
    it("should use fallback label when neither name nor label available", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        {
          id: "agent-1",
          agent_config: {}
        }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Agent Node");
      expect(newNodes[0].data.name).toBe("Agent Node");
    });
    it("should update draft storage after adding agents", async () => {
      let currentNodes = [];
      mockSetNodes.mockImplementation((updater) => {
        if (typeof updater === "function") {
          currentNodes = updater(currentNodes);
        } else {
          currentNodes = updater;
        }
      });
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: "workflow-1",
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: true,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        {
          id: "agent-1",
          name: "Test Agent",
          agent_config: {}
        }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      }, { timeout: 1e3 });
      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0];
      expect(savedDrafts["tab-1"].nodes.length).toBeGreaterThan(0);
      expect(savedDrafts["tab-1"].workflowId).toBe("workflow-1");
      expect(savedDrafts["tab-1"].isUnsaved).toBe(true);
    });
    it("should preserve existing edges in draft", async () => {
      mockTabDraftsRef.current["tab-1"] = {
        nodes: [],
        edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
        workflowId: null,
        workflowName: "Test Workflow",
        workflowDescription: "Test Description",
        isUnsaved: false
      };
      let currentNodes = [];
      mockSetNodes.mockImplementation((updater) => {
        if (typeof updater === "function") {
          currentNodes = updater(currentNodes);
        } else {
          currentNodes = updater;
        }
      });
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      }, { timeout: 1e3 });
      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0];
      expect(savedDrafts["tab-1"].edges).toHaveLength(1);
      expect(savedDrafts["tab-1"].edges[0].id).toBe("edge-1");
    });
    it("should call notifyModified", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should set isAddingAgentsRef flag", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
        expect(result.current.isAddingAgentsRef.current).toBe(true);
      });
      act(() => {
        jest.advanceTimersByTime(1e3);
      });
      expect(result.current.isAddingAgentsRef.current).toBe(false);
    });
    it("should handle empty agents array", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      act(() => {
        result.current.addAgentsToCanvas([]);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes).toHaveLength(0);
    });
    it("should handle multiple agents with proper spacing", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} },
        { id: "agent-3", name: "Agent 3", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes).toHaveLength(3);
      expect(newNodes[0].position.y).toBe(250);
      expect(newNodes[1].position.y).toBe(400);
      expect(newNodes[2].position.y).toBe(550);
    });
    it("should use current state values in draft update", async () => {
      let currentNodes = [];
      mockSetNodes.mockImplementation((updater) => {
        if (typeof updater === "function") {
          currentNodes = updater(currentNodes);
        } else {
          currentNodes = updater;
        }
      });
      const { result, rerender } = renderHook(
        ({ localWorkflowId, localWorkflowName, tabIsUnsaved }) => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId,
          localWorkflowName,
          localWorkflowDescription: "Test Description",
          tabIsUnsaved,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        }),
        {
          initialProps: {
            localWorkflowId: null,
            localWorkflowName: "Initial Name",
            tabIsUnsaved: false
          }
        }
      );
      rerender({
        localWorkflowId: "workflow-1",
        localWorkflowName: "Updated Name",
        tabIsUnsaved: true
      });
      const agents = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      }, { timeout: 1e3 });
      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0];
      expect(savedDrafts["tab-1"].workflowId).toBe("workflow-1");
      expect(savedDrafts["tab-1"].workflowName).toBe("Updated Name");
      expect(savedDrafts["tab-1"].isUnsaved).toBe(true);
    });
    it("should verify agent.name || agent.label || Agent Node - all branches", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentsWithName = [{ id: "agent-1", name: "Agent Name", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentsWithName);
      });
      let setNodesCall = mockSetNodes.mock.calls[mockSetNodes.mock.calls.length - 1][0];
      let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.name).toBe("Agent Name");
      const agentsWithLabel = [{ id: "agent-2", label: "Agent Label", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentsWithLabel);
      });
      setNodesCall = mockSetNodes.mock.calls[mockSetNodes.mock.calls.length - 1][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.name).toBe("Agent Label");
      const agentsWithoutNameOrLabel = [{ id: "agent-3", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentsWithoutNameOrLabel);
      });
      setNodesCall = mockSetNodes.mock.calls[mockSetNodes.mock.calls.length - 1][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.name).toBe("Agent Node");
    });
    it('should verify agent.description || "" fallback', () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentsWithoutDescription = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentsWithoutDescription);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.description).toBe("");
    });
    it("should verify agent.agent_config || {} fallback", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentsWithoutConfig = [{ id: "agent-1", name: "Agent" }];
      act(() => {
        result.current.addAgentsToCanvas(agentsWithoutConfig);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.agent_config).toEqual({});
    });
    it("should verify currentDraft?.edges || [] fallback", async () => {
      mockTabDraftsRef.current["tab-1"] = void 0;
      let currentNodes = [];
      mockSetNodes.mockImplementation((updater) => {
        if (typeof updater === "function") {
          currentNodes = updater(currentNodes);
        } else {
          currentNodes = updater;
        }
      });
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      await waitFor(() => {
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      }, { timeout: 1e3 });
      const savedDrafts = mockSaveDraftsToStorage.mock.calls[0][0];
      expect(savedDrafts["tab-1"].edges).toEqual([]);
    });
  });
  describe("useEffect event handling", () => {
    it("should verify targetTabId !== tabId check - different tab", () => {
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const event = new CustomEvent("addAgentsToWorkflow", {
        detail: {
          agents: [{ id: "agent-1", name: "Agent" }],
          tabId: "tab-2"
          // Different tab
        }
      });
      act(() => {
        window.dispatchEvent(event);
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify targetTabId !== tabId check - same tab", () => {
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const event = new CustomEvent("addAgentsToWorkflow", {
        detail: {
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          tabId: "tab-1"
          // Same tab
        }
      });
      act(() => {
        window.dispatchEvent(event);
      });
      expect(mockSetNodes).toHaveBeenCalled();
    });
    it("should verify !storage check in checkPendingAgents", () => {
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          // No storage
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify pendingData check - pendingData is null", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - both true", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          tabId: "tab-1",
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          timestamp: Date.now() - 5e3
          // Recent (5 seconds ago)
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      await waitFor(() => {
        expect(mockSetNodes).toHaveBeenCalled();
      }, { timeout: 1e3 });
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
    });
    it("should verify pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - tabId mismatch", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          tabId: "tab-2",
          // Different tab
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          timestamp: Date.now() - 5e3
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - timestamp too old", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          tabId: "tab-1",
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          timestamp: Date.now() - 15e3
          // Too old (15 seconds ago)
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify else if (pending.tabId !== tabId) branch", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          tabId: "tab-2",
          // Different tab
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          timestamp: Date.now() - 5e3
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
    });
    it("should verify else if (Date.now() - pending.timestamp >= 10000) branch", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          tabId: "tab-1",
          agents: [{ id: "agent-1", name: "Agent", agent_config: {} }],
          timestamp: Date.now() - 2e4
          // Too old
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
    });
    it("should verify catch block error handling", () => {
      const mockLoggerError = logger.error;
      const mockStorage = {
        getItem: jest.fn().mockReturnValue("invalid json"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        "Failed to process pending agents:",
        expect.any(Error)
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
    });
    it("should verify if (storage) check in catch block - storage is null", () => {
      const mockStorage = null;
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
    it("should verify if (typeof window !== undefined) check - window exists", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      expect(result.current.addAgentsToCanvas).toBeDefined();
    });
    it("should verify checkCount >= maxChecks branch", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      act(() => {
        jest.advanceTimersByTime(1e4);
      });
      expect(mockStorage.getItem).toHaveBeenCalledTimes(22);
    });
    it("should verify cleanup removes event listener", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "addAgentsToWorkflow",
        expect.any(Function)
      );
      removeEventListenerSpy.mockRestore();
    });
    it("should verify cleanup clears interval", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      const { unmount } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const initialCallCount = mockStorage.getItem.mock.calls.length;
      unmount();
      act(() => {
        jest.advanceTimersByTime(5e3);
      });
      expect(mockStorage.getItem.mock.calls.length).toBe(initialCallCount);
    });
    it("should verify currentNodes.length > 0 branch - nodes exist", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 100, y: 100 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 300, y: 200 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(500);
    });
    it("should verify currentNodes.length > 0 branch - no nodes", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.x).toBe(250);
    });
    it("should verify Math.max(...currentNodes.map(n => n.position.x)) calculation", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 50, y: 100 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 200, y: 150 }, data: {} },
        { id: "node-3", type: "agent", position: { x: 150, y: 200 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(400);
    });
    it("should verify currentY + (index * 150) calculation for multiple agents", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} },
        { id: "agent-3", name: "Agent 3", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.y).toBe(250);
      expect(newNodes[1].position.y).toBe(400);
      expect(newNodes[2].position.y).toBe(550);
    });
    it("should verify Date.now() and Math.random() in node ID generation", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].id).toMatch(/^agent-\d+-\d+$/);
    });
    it("should verify Date.now() in node ID generation", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].id).toMatch(/^agent-\d+-\d+$/);
      const parts = newNodes[0].id.split("-");
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe("agent");
      expect(parseInt(parts[1])).toBeGreaterThan(0);
      expect(parseInt(parts[2])).toBe(0);
    });
    it("should verify setTimeout delay of 0 for draft update", async () => {
      let currentNodes = [];
      mockSetNodes.mockImplementation((updater) => {
        if (typeof updater === "function") {
          currentNodes = updater(currentNodes);
        } else {
          currentNodes = updater;
        }
      });
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
        await waitFor(() => {
          expect(mockSaveDraftsToStorage).toHaveBeenCalled();
        });
      });
      expect(mockSaveDraftsToStorage).toHaveBeenCalled();
    });
    it("should verify setTimeout delay of 1000 for flag reset", async () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
        expect(result.current.isAddingAgentsRef.current).toBe(true);
      });
      act(() => {
        jest.advanceTimersByTime(1e3);
      });
      await waitFor(() => {
        expect(result.current.isAddingAgentsRef.current).toBe(false);
      });
    });
    it("should verify checkCount >= maxChecks branch in interval", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      const { unmount } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const initialCallCount = mockStorage.getItem.mock.calls.length;
      act(() => {
        jest.advanceTimersByTime(1e4);
      });
      await waitFor(() => {
        const callCountAfter2 = mockStorage.getItem.mock.calls.length;
        expect(callCountAfter2).toBeGreaterThan(initialCallCount);
      });
      unmount();
      const callCountAfter = mockStorage.getItem.mock.calls.length;
      act(() => {
        jest.advanceTimersByTime(5e3);
      });
      await waitFor(() => {
        const finalCallCount = mockStorage.getItem.mock.calls.length;
        expect(finalCallCount).toBe(callCountAfter);
      });
    });
  });
  describe("string literal and template literal mutations", () => {
    it("should verify string literal type: agent exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].type).toBe("agent");
    });
    it("should verify string literal Agent Node exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Agent Node");
      expect(newNodes[0].data.name).toBe("Agent Node");
    });
    it("should verify template literal agent-${Date.now()}-${index} exact format", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].id).toMatch(/^agent-\d+-\d+$/);
      expect(newNodes[0].id.startsWith("agent-")).toBe(true);
      expect(newNodes[1].id).toMatch(/^agent-\d+-\d+$/);
      const parts0 = newNodes[0].id.split("-");
      const parts1 = newNodes[1].id.split("-");
      expect(parseInt(parts0[parts0.length - 1])).toBe(0);
      expect(parseInt(parts1[parts1.length - 1])).toBe(1);
    });
    it("should verify Math.max(...currentNodes.map(n => n.position.x)) + 200 exact calculation", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 100, y: 100 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 300, y: 200 }, data: {} },
        { id: "node-3", type: "agent", position: { x: 200, y: 300 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(500);
    });
    it("should verify currentY + (index * 150) exact calculation", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} },
        { id: "agent-3", name: "Agent 3", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.y).toBe(250);
      expect(newNodes[1].position.y).toBe(400);
      expect(newNodes[2].position.y).toBe(550);
    });
    it("should verify string literal 250 exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.x).toBe(250);
      expect(newNodes[0].position.y).toBe(250);
    });
    it("should verify string literal 200 exact value in Math.max calculation", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 500, y: 100 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(700);
    });
    it("should verify string literal 150 exact value in positioning", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[1].position.y - newNodes[0].position.y).toBe(150);
    });
    it("should verify checkCount >= maxChecks exact comparison", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: mockStorage,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const initialCallCount = mockStorage.getItem.mock.calls.length;
      act(() => {
        jest.advanceTimersByTime(1e4);
      });
      await waitFor(() => {
        const callCountAfter = mockStorage.getItem.mock.calls.length;
        expect(callCountAfter).toBeGreaterThan(initialCallCount);
      });
    });
  });
  describe("string literal and template literal mutations", () => {
    it("should verify string literal type: agent exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].type).toBe("agent");
    });
    it("should verify string literal Agent Node exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Agent Node");
      expect(newNodes[0].data.name).toBe("Agent Node");
    });
    it("should verify template literal agent-${Date.now()}-${index} exact format", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].id).toMatch(/^agent-\d+-\d+$/);
      expect(newNodes[0].id.startsWith("agent-")).toBe(true);
      expect(newNodes[1].id).toMatch(/^agent-\d+-\d+$/);
      const parts0 = newNodes[0].id.split("-");
      const parts1 = newNodes[1].id.split("-");
      expect(parseInt(parts0[parts0.length - 1])).toBe(0);
      expect(parseInt(parts1[parts1.length - 1])).toBe(1);
    });
    it("should verify Math.max(...currentNodes.map(n => n.position.x)) + 200 exact calculation", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 100, y: 100 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 300, y: 200 }, data: {} },
        { id: "node-3", type: "agent", position: { x: 200, y: 300 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(500);
    });
    it("should verify currentY + (index * 150) exact calculation", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} },
        { id: "agent-3", name: "Agent 3", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.y).toBe(250);
      expect(newNodes[1].position.y).toBe(400);
      expect(newNodes[2].position.y).toBe(550);
    });
    it("should verify string literal 250 exact value", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].position.x).toBe(250);
      expect(newNodes[0].position.y).toBe(250);
    });
    it("should verify string literal 200 exact value in Math.max calculation", () => {
      const existingNodes = [
        { id: "node-1", type: "agent", position: { x: 500, y: 100 }, data: {} }
      ];
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
      expect(newNodes[newNodes.length - 1].position.x).toBe(700);
    });
    it("should verify string literal 150 exact value in positioning", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agents = [
        { id: "agent-1", name: "Agent 1", agent_config: {} },
        { id: "agent-2", name: "Agent 2", agent_config: {} }
      ];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[1].position.y - newNodes[0].position.y).toBe(150);
    });
    it("should verify agent.name || agent.label || Agent Node fallback chain", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentWithName = [{ id: "agent-1", name: "Test Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithName);
      });
      let setNodesCall = mockSetNodes.mock.calls[0][0];
      let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Test Agent");
      expect(newNodes[0].data.name).toBe("Test Agent");
      mockSetNodes.mockClear();
      const agentWithLabel = [{ id: "agent-2", label: "Label Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithLabel);
      });
      setNodesCall = mockSetNodes.mock.calls[0][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Label Agent");
      expect(newNodes[0].data.name).toBe("Label Agent");
      mockSetNodes.mockClear();
      const agentWithoutNameOrLabel = [{ id: "agent-3", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithoutNameOrLabel);
      });
      setNodesCall = mockSetNodes.mock.calls[0][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.label).toBe("Agent Node");
      expect(newNodes[0].data.name).toBe("Agent Node");
      expect(newNodes[0].data.label).not.toBe("agent node");
      expect(newNodes[0].data.label).not.toBe("");
    });
    it("should verify agent.description || empty string fallback", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentWithDescription = [{
        id: "agent-1",
        name: "Agent",
        description: "Test Description",
        agent_config: {}
      }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithDescription);
      });
      let setNodesCall = mockSetNodes.mock.calls[0][0];
      let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.description).toBe("Test Description");
      mockSetNodes.mockClear();
      const agentWithoutDescription = [{
        id: "agent-2",
        name: "Agent",
        agent_config: {}
      }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithoutDescription);
      });
      setNodesCall = mockSetNodes.mock.calls[0][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.description).toBe("");
      expect(newNodes[0].data.description.length).toBe(0);
    });
    it("should verify agent.agent_config || empty object fallback", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      const agentWithConfig = [{
        id: "agent-1",
        name: "Agent",
        agent_config: { model: "gpt-4" }
      }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithConfig);
      });
      let setNodesCall = mockSetNodes.mock.calls[0][0];
      let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.agent_config).toEqual({ model: "gpt-4" });
      mockSetNodes.mockClear();
      const agentWithoutConfig = [{
        id: "agent-2",
        name: "Agent"
      }];
      act(() => {
        result.current.addAgentsToCanvas(agentWithoutConfig);
      });
      setNodesCall = mockSetNodes.mock.calls[0][0];
      newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
      expect(newNodes[0].data.agent_config).toEqual({});
      expect(Object.keys(newNodes[0].data.agent_config)).toHaveLength(0);
    });
    it("should verify currentDraft?.edges || empty array fallback", () => {
      const { result } = renderHook(
        () => useMarketplaceIntegration({
          tabId: "tab-1",
          storage: null,
          setNodes: mockSetNodes,
          notifyModified: mockNotifyModified,
          localWorkflowId: null,
          localWorkflowName: "Test Workflow",
          localWorkflowDescription: "Test Description",
          tabIsUnsaved: false,
          tabDraftsRef: mockTabDraftsRef,
          saveDraftsToStorage: mockSaveDraftsToStorage
        })
      );
      mockTabDraftsRef.current["tab-1"] = {
        nodes: [],
        edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
        workflowId: null,
        workflowName: "Test Workflow",
        workflowDescription: "Test Description",
        isUnsaved: false
      };
      const agents = [{ id: "agent-1", name: "Agent", agent_config: {} }];
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(0);
      });
      const updatedDraft = mockTabDraftsRef.current["tab-1"];
      expect(updatedDraft.edges).toEqual([{ id: "edge-1", source: "node-1", target: "node-2" }]);
      mockTabDraftsRef.current["tab-1"] = {
        nodes: [],
        edges: void 0,
        workflowId: null,
        workflowName: "Test Workflow",
        workflowDescription: "Test Description",
        isUnsaved: false
      };
      mockSetNodes.mockClear();
      act(() => {
        result.current.addAgentsToCanvas(agents);
      });
      act(() => {
        jest.advanceTimersByTime(0);
      });
      const updatedDraft2 = mockTabDraftsRef.current["tab-1"];
      expect(updatedDraft2.edges).toEqual([]);
      expect(Array.isArray(updatedDraft2.edges)).toBe(true);
    });
  });
  describe("additional coverage for no-coverage mutants", () => {
    describe("addAgentsToCanvas - boundary conditions and edge cases", () => {
      it("should handle currentNodes.length === 0 exact boundary", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.x).toBe(250);
      });
      it("should handle agent.name || agent.label || Agent Node - name exists", () => {
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent Name" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Agent Name");
        expect(newNodes[0].data.label).toBe("Agent Name");
      });
      it("should handle agent.name || agent.label || Agent Node - name null, label exists", () => {
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: null, label: "Agent Label" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Agent Label");
        expect(newNodes[0].data.label).toBe("Agent Label");
      });
      it("should handle agent.name || agent.label || Agent Node - name undefined, label null", () => {
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: void 0, label: null }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Agent Node");
        expect(newNodes[0].data.label).toBe("Agent Node");
      });
      it("should handle agent.description || empty string - description is null", () => {
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent", description: null }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
      });
      it("should handle agent.description || empty string - description is undefined", () => {
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent", description: void 0 }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
      });
      it("should handle currentDraft is null in setTimeout callback", () => {
        mockTabDraftsRef.current["tab-1"] = null;
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      });
      it("should handle currentDraft is undefined in setTimeout callback", () => {
        mockTabDraftsRef.current["tab-1"] = void 0;
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
      });
    });
    describe("useEffect - storage check edge cases", () => {
      it("should handle Date.now() - pending.timestamp === 10000 exact boundary", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 1e4
            // Exactly 10000ms ago
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
      it("should handle Date.now() - pending.timestamp === 9999 just under boundary", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 9999
            // Just under 10000ms
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSetNodes).toHaveBeenCalled();
      });
      it("should handle pending.tabId !== tabId exact comparison", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-2",
            // Different tab
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 5e3
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            // Current tab
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should handle pending object missing tabId property", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            // No tabId property
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 5e3
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
      it("should handle pending object missing timestamp property", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            agents: [{ id: "agent-1", name: "Agent" }]
            // No timestamp property
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.getItem).toHaveBeenCalled();
      });
      it("should handle checkCount >= maxChecks exact boundary", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(null),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        const { unmount } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(1e4);
        });
        expect(mockStorage.getItem.mock.calls.length).toBeGreaterThanOrEqual(10);
        unmount();
      });
      it("should handle storage.removeItem when storage is null in catch block", () => {
        const mockStorage = {
          getItem: jest.fn().mockImplementation(() => {
            throw new Error("Storage error");
          }),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
      it("should handle JSON.parse throwing SyntaxError", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue("invalid json"),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
    });
    describe("mutation killers for addAgentsToCanvas", () => {
      it("should verify exact currentNodes.length > 0 comparison - length is 0", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.x).toBe(250);
      });
      it("should verify exact currentNodes.length > 0 comparison - length is 1", () => {
        const existingNode = {
          id: "node-1",
          type: "agent",
          position: { x: 100, y: 100 },
          data: {}
        };
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([existingNode]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([existingNode]) : setNodesCall;
        expect(newNodes[1].position.x).toBe(300);
      });
      it("should verify exact Math.max(...currentNodes.map(n => n.position.x)) calculation", () => {
        const existingNodes = [
          { id: "node-1", type: "agent", position: { x: 50, y: 50 }, data: {} },
          { id: "node-2", type: "agent", position: { x: 300, y: 100 }, data: {} },
          { id: "node-3", type: "agent", position: { x: 150, y: 150 }, data: {} }
        ];
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater(existingNodes);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
        expect(newNodes[3].position.x).toBe(500);
      });
      it('should verify exact agent.name || agent.label || "Agent Node" fallback chain', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent Name" }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.label).toBe("Agent Name");
        expect(newNodes[0].data.name).toBe("Agent Name");
        mockSetNodes.mockClear();
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", name: null, label: "Agent Label" }]);
        });
        setNodesCall = mockSetNodes.mock.calls[0][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.label).toBe("Agent Label");
        expect(newNodes[0].data.name).toBe("Agent Label");
        mockSetNodes.mockClear();
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-3", name: null, label: null }]);
        });
        setNodesCall = mockSetNodes.mock.calls[0][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.label).toBe("Agent Node");
        expect(newNodes[0].data.name).toBe("Agent Node");
      });
      it('should verify exact agent.description || "" fallback', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", description: "Test Description" }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("Test Description");
        mockSetNodes.mockClear();
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", description: null }]);
        });
        setNodesCall = mockSetNodes.mock.calls[0][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
      });
      it("should verify exact agent.agent_config || {} fallback", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", agent_config: { model: "gpt-4" } }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.agent_config).toEqual({ model: "gpt-4" });
        mockSetNodes.mockClear();
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", agent_config: null }]);
        });
        setNodesCall = mockSetNodes.mock.calls[0][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.agent_config).toEqual({});
      });
      it("should verify exact currentDraft?.edges || [] fallback", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        mockTabDraftsRef.current = {
          "tab-1": {
            nodes: [],
            edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
            workflowId: null,
            workflowName: "Test",
            workflowDescription: "",
            isUnsaved: false
          }
        };
        const { result: result1 } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result1.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent" }]);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
        const savedDraft = mockSaveDraftsToStorage.mock.calls[0][0]["tab-1"];
        expect(savedDraft.edges).toEqual([{ id: "edge-1", source: "node-1", target: "node-2" }]);
        mockSaveDraftsToStorage.mockClear();
        mockTabDraftsRef.current = {};
        const { result: result2 } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result2.current.addAgentsToCanvas([{ id: "agent-2", name: "Agent" }]);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
        const savedDraft2 = mockSaveDraftsToStorage.mock.calls[0][0]["tab-1"];
        expect(savedDraft2.edges).toEqual([]);
      });
      it("should verify exact Date.now() calculation in node ID generation", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(1234567890);
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent" }]);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].id).toContain("1234567890");
        mockDateNow.mockRestore();
      });
      it("should verify exact index * 150 calculation for Y positioning", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [
          { id: "agent-1", name: "Agent 1" },
          { id: "agent-2", name: "Agent 2" },
          { id: "agent-3", name: "Agent 3" }
        ];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.y).toBe(250);
        expect(newNodes[1].position.y).toBe(400);
        expect(newNodes[2].position.y).toBe(550);
      });
      it("should verify exact targetTabId !== tabId comparison", () => {
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const event = new CustomEvent("addAgentsToWorkflow", {
          detail: {
            agents: [{ id: "agent-1", name: "Agent" }],
            tabId: "tab-2"
            // Different tab
          }
        });
        act(() => {
          window.dispatchEvent(event);
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        const event2 = new CustomEvent("addAgentsToWorkflow", {
          detail: {
            agents: [{ id: "agent-2", name: "Agent" }],
            tabId: "tab-1"
            // Same tab
          }
        });
        act(() => {
          window.dispatchEvent(event2);
        });
        expect(mockSetNodes).toHaveBeenCalled();
      });
      it("should verify exact Date.now() - pending.timestamp < 10000 comparison", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 5e3
            // 5 seconds ago (within 10 seconds)
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
      it("should verify exact Date.now() - pending.timestamp >= 10000 comparison", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            agents: [{ id: "agent-1", name: "Agent" }],
            timestamp: Date.now() - 15e3
            // 15 seconds ago (>= 10 seconds)
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should verify exact checkCount >= maxChecks comparison", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(null),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        const { unmount } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(1e4);
        });
        expect(mockStorage.getItem.mock.calls.length).toBeGreaterThanOrEqual(11);
        unmount();
      });
      it("should verify exact number literal 200 in Math.max calculation", () => {
        const existingNodes = [
          { id: "node-1", type: "agent", position: { x: 100, y: 50 }, data: {} }
        ];
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater(existingNodes);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
        expect(newNodes[1].position.x).toBe(300);
        expect(newNodes[1].position.x).not.toBe(299);
        expect(newNodes[1].position.x).not.toBe(301);
      });
      it("should verify exact number literal 250 for default startX", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.x).toBe(250);
        expect(newNodes[0].position.x).not.toBe(249);
        expect(newNodes[0].position.x).not.toBe(251);
        expect(newNodes[0].position.x).not.toBe(200);
      });
      it("should verify exact number literal 250 for currentY initial value", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent 1" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.y).toBe(250);
        expect(newNodes[0].position.y).not.toBe(249);
        expect(newNodes[0].position.y).not.toBe(251);
      });
      it("should verify exact number literal 150 in Y positioning calculation", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [
          { id: "agent-1", name: "Agent 1" },
          { id: "agent-2", name: "Agent 2" },
          { id: "agent-3", name: "Agent 3" }
        ];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.y).toBe(250);
        expect(newNodes[1].position.y).toBe(400);
        expect(newNodes[2].position.y).toBe(550);
        expect(newNodes[1].position.y - newNodes[0].position.y).toBe(150);
        expect(newNodes[1].position.y - newNodes[0].position.y).not.toBe(149);
        expect(newNodes[1].position.y - newNodes[0].position.y).not.toBe(151);
      });
      it('should verify exact string literal "agent-" prefix in node ID', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].id).toMatch(/^agent-/);
        expect(newNodes[0].id).not.toMatch(/^Agent-/);
        expect(newNodes[0].id).not.toMatch(/^agent[^-]/);
      });
      it('should verify exact string literal "Agent Node" fallback value', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: null, label: null }]);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.label).toBe("Agent Node");
        expect(newNodes[0].data.label).not.toBe("agent node");
        expect(newNodes[0].data.label).not.toBe("AgentNode");
        expect(newNodes[0].data.label).not.toBe("Agent");
        expect(newNodes[0].data.name).toBe("Agent Node");
      });
      it("should verify exact setTimeout delay of 0 for draft update", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent" }]);
        });
        const setTimeoutCalls = setTimeoutSpy.mock.calls;
        const zeroDelayCalls = setTimeoutCalls.filter((call) => call[1] === 0);
        expect(zeroDelayCalls.length).toBeGreaterThan(0);
        expect(zeroDelayCalls.some((call) => call[1] === 0)).toBe(true);
        expect(setTimeoutCalls.some((call) => call[1] === 1 && call[0].toString().includes("saveDraftsToStorage"))).toBe(false);
        setTimeoutSpy.mockRestore();
      });
    });
  });
  describe("mutation killers - no-coverage paths and exact operators", () => {
    describe("addAgentsToCanvas - exact boundary conditions", () => {
      it("should verify exact boundary: currentNodes.length === 0", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].position.x).toBe(250);
      });
      it("should verify exact boundary: currentNodes.length > 0", () => {
        const existingNodes = [
          { id: "node-1", position: { x: 100, y: 100 }, type: "agent", data: {} },
          { id: "node-2", position: { x: 300, y: 200 }, type: "agent", data: {} }
        ];
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater(existingNodes);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        const agents = [{ id: "agent-1", name: "Agent" }];
        act(() => {
          result.current.addAgentsToCanvas(agents);
        });
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = typeof setNodesCall === "function" ? setNodesCall(existingNodes) : setNodesCall;
        expect(newNodes[newNodes.length - 1].position.x).toBe(500);
      });
    });
    describe("addAgentsToCanvas - exact logical OR operators", () => {
      it('should verify exact logical OR: agent.name || agent.label || "Agent Node" - all combinations', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Name", label: "Label" }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Name");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", name: "Name", label: null }]);
        });
        setNodesCall = mockSetNodes.mock.calls[1][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Name");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-3", name: null, label: "Label" }]);
        });
        setNodesCall = mockSetNodes.mock.calls[2][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Label");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-4", name: null, label: null }]);
        });
        setNodesCall = mockSetNodes.mock.calls[3][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Agent Node");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-5", name: void 0, label: void 0 }]);
        });
        setNodesCall = mockSetNodes.mock.calls[4][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.name).toBe("Agent Node");
      });
      it('should verify exact logical OR: agent.description || ""', () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent", description: null }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", name: "Agent", description: void 0 }]);
        });
        setNodesCall = mockSetNodes.mock.calls[1][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-3", name: "Agent", description: "" }]);
        });
        setNodesCall = mockSetNodes.mock.calls[2][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.description).toBe("");
      });
      it("should verify exact logical OR: agent.agent_config || {}", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const { result } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent", agent_config: null }]);
        });
        let setNodesCall = mockSetNodes.mock.calls[0][0];
        let newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.agent_config).toEqual({});
        act(() => {
          result.current.addAgentsToCanvas([{ id: "agent-2", name: "Agent", agent_config: void 0 }]);
        });
        setNodesCall = mockSetNodes.mock.calls[1][0];
        newNodes = typeof setNodesCall === "function" ? setNodesCall([]) : setNodesCall;
        expect(newNodes[0].data.agent_config).toEqual({});
      });
      it("should verify exact optional chaining: currentDraft?.edges || []", () => {
        mockSetNodes.mockImplementation((updater) => {
          if (typeof updater === "function") {
            return updater([]);
          }
          return updater;
        });
        const tabDraftsRefNull = { current: { "tab-1": null } };
        const { result: result1 } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: tabDraftsRefNull,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result1.current.addAgentsToCanvas([{ id: "agent-1", name: "Agent" }]);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSaveDraftsToStorage).toHaveBeenCalled();
        const savedDraft = tabDraftsRefNull.current["tab-1"];
        expect(savedDraft.edges).toEqual([]);
        const tabDraftsRefUndefined = { current: { "tab-1": void 0 } };
        const { result: result2 } = renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: null,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: tabDraftsRefUndefined,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          result2.current.addAgentsToCanvas([{ id: "agent-2", name: "Agent" }]);
        });
        act(() => {
          jest.advanceTimersByTime(0);
        });
        const savedDraft2 = tabDraftsRefUndefined.current["tab-1"];
        expect(savedDraft2.edges).toEqual([]);
      });
    });
    describe("checkPendingAgents - exact comparison operators", () => {
      it("should verify exact comparison: pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - both true", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            timestamp: Date.now() - 5e3,
            // 5 seconds ago (< 10000)
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
      it("should verify exact comparison: pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - first true, second false", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            timestamp: Date.now() - 15e3,
            // 15 seconds ago (>= 10000)
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should verify exact comparison: pending.tabId === tabId && Date.now() - pending.timestamp < 10000 - first false", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-2",
            // Different tab
            timestamp: Date.now() - 5e3,
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should verify exact boundary: Date.now() - pending.timestamp === 10000", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            timestamp: Date.now() - 1e4,
            // Exactly 10000ms ago
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should verify exact boundary: Date.now() - pending.timestamp === 9999", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            timestamp: Date.now() - 9999,
            // Exactly 9999ms ago (just under boundary)
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
      });
    });
    describe("checkPendingAgents - exact comparison: pending.tabId !== tabId", () => {
      it("should verify exact comparison: pending.tabId !== tabId - true", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-2",
            // Different tab
            timestamp: Date.now() - 5e3,
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockStorage.removeItem).toHaveBeenCalledWith("pendingAgentsToAdd");
        expect(mockSetNodes).not.toHaveBeenCalled();
      });
      it("should verify exact comparison: pending.tabId !== tabId - false", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(JSON.stringify({
            tabId: "tab-1",
            // Same tab
            timestamp: Date.now() - 5e3,
            agents: [{ id: "agent-1", name: "Agent" }]
          })),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(mockSetNodes).toHaveBeenCalled();
      });
    });
    describe("interval check - exact boundary: checkCount >= maxChecks", () => {
      it("should verify exact boundary: checkCount === maxChecks (10)", () => {
        const mockStorage = {
          getItem: jest.fn().mockReturnValue(null),
          removeItem: jest.fn(),
          setItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        renderHook(
          () => useMarketplaceIntegration({
            tabId: "tab-1",
            storage: mockStorage,
            setNodes: mockSetNodes,
            notifyModified: mockNotifyModified,
            localWorkflowId: null,
            localWorkflowName: "Test Workflow",
            localWorkflowDescription: "Test Description",
            tabIsUnsaved: false,
            tabDraftsRef: mockTabDraftsRef,
            saveDraftsToStorage: mockSaveDraftsToStorage
          })
        );
        for (let i = 0; i < 10; i++) {
          act(() => {
            jest.advanceTimersByTime(1e3);
          });
        }
        expect(mockStorage.getItem).toHaveBeenCalledTimes(22);
        act(() => {
          jest.advanceTimersByTime(1e3);
        });
        expect(mockStorage.getItem).toHaveBeenCalledTimes(22);
      });
    });
  });
});
