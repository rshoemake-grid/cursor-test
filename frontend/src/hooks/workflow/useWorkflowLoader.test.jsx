import { renderHook, act } from "@testing-library/react";
import { useWorkflowLoader } from "./useWorkflowLoader";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { showError } from "../../utils/notifications";
import {
  initializeReactFlowNodes,
  formatEdgesForReactFlow,
} from "../../utils/workflowFormat";
jest.mock("../../api/client", () => ({
  api: {
    getWorkflow: jest.fn(),
  },
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
}));
jest.mock("../../utils/workflowFormat", () => ({
  initializeReactFlowNodes: jest.fn(),
  formatEdgesForReactFlow: jest.fn(),
}));
describe("useWorkflowLoader", () => {
  const mockSetNodes = jest.fn();
  const mockSetEdges = jest.fn();
  const mockSetLocalWorkflowId = jest.fn();
  const mockSetLocalWorkflowName = jest.fn();
  const mockSetLocalWorkflowDescription = jest.fn();
  const mockSetVariables = jest.fn();
  const mockSetSelectedNodeId = jest.fn();
  const defaultWorkflowNodeToNodeImpl = (wfNode) => ({
    id: wfNode.id,
    type: wfNode.type,
    data: wfNode.data || {},
    position: { x: 0, y: 0 },
  });
  const mockWorkflowNodeToNode = jest.fn(defaultWorkflowNodeToNodeImpl);
  const mockOnWorkflowLoaded = jest.fn();
  const mockShowError = showError;
  const mockIsLoadingRef = { current: false };
  const mockLastLoadedWorkflowIdRef = { current: null };
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockWorkflowNodeToNode.mockImplementation(defaultWorkflowNodeToNodeImpl);
    initializeReactFlowNodes.mockImplementation((nodes) => nodes);
    formatEdgesForReactFlow.mockImplementation((edges) => edges);
    mockIsLoadingRef.current = false;
    mockLastLoadedWorkflowIdRef.current = null;
  });
  afterEach(async () => {
    jest.advanceTimersByTime(0);
    jest.runOnlyPendingTimers();
    jest.runAllTimers();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();
    jest.useRealTimers();
  });
  describe("workflow loading", () => {
    it("should not load if workflowId is null", () => {
      renderHook(() =>
        useWorkflowLoader({
          workflowId: null,
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      expect(api.getWorkflow).not.toHaveBeenCalled();
      expect(mockLastLoadedWorkflowIdRef.current).toBeNull();
      expect(mockIsLoadingRef.current).toBe(false);
    });
    it("should not load when not authenticated even if workflowId is set", () => {
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          isAuthenticated: false,
        }),
      );
      expect(api.getWorkflow).not.toHaveBeenCalled();
      expect(mockLastLoadedWorkflowIdRef.current).toBeNull();
      expect(mockIsLoadingRef.current).toBe(false);
    });
    it("refetches saved workflow when isAuthenticated becomes true", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [{ id: "n1", type: "agent", data: {} }],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      const { rerender } = renderHook(
        ({ auth }) =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
            isAuthenticated: auth,
          }),
        { initialProps: { auth: false } },
      );
      expect(api.getWorkflow).not.toHaveBeenCalled();
      rerender({ auth: true });
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.getWorkflow).toHaveBeenCalledWith("workflow-1");
    });
    it("should not load if workflowId matches lastLoadedWorkflowId", () => {
      mockLastLoadedWorkflowIdRef.current = "workflow-1";
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      expect(api.getWorkflow).not.toHaveBeenCalled();
    });
    it("should not load if tabIsUnsaved is true", () => {
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: true,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      expect(api.getWorkflow).not.toHaveBeenCalled();
    });
    it("should load workflow successfully", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test Description",
        nodes: [
          { id: "node-1", type: "agent", data: {} },
          { id: "node-2", type: "condition", data: {} },
        ],
        edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
        variables: { var1: "value1" },
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.getWorkflow).toHaveBeenCalledWith("workflow-1");
      expect(mockSetLocalWorkflowId).toHaveBeenCalledWith("workflow-1");
      expect(mockSetLocalWorkflowName).toHaveBeenCalledWith("Test Workflow");
      expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith(
        "Test Description",
      );
      expect(mockSetVariables).toHaveBeenCalledWith({ var1: "value1" });
      expect(mockWorkflowNodeToNode).toHaveBeenCalledTimes(2);
      expect(initializeReactFlowNodes).toHaveBeenCalled();
      expect(formatEdgesForReactFlow).toHaveBeenCalledWith(mockWorkflow.edges);
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
      expect(mockLastLoadedWorkflowIdRef.current).toBe("workflow-1");
    });
    it("should set isLoadingRef to true during loading", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      expect(mockIsLoadingRef.current).toBe(true);
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockIsLoadingRef.current).toBe(false);
    });
    it("should handle workflow with empty description", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        nodes: [],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith("");
    });
    it("should handle workflow with null variables", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: [],
        variables: null,
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockSetVariables).toHaveBeenCalledWith({});
    });
    it("should handle workflow with undefined edges", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: void 0,
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(formatEdgesForReactFlow).toHaveBeenCalledWith([]);
    });
    it("should set edges after delay", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockSetEdges).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(50);
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockSetEdges).toHaveBeenCalled();
    });
    it("should call onWorkflowLoaded callback when provided", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockOnWorkflowLoaded).toHaveBeenCalledWith(
        "workflow-1",
        "Test Workflow",
      );
    });
    it("should not call onWorkflowLoaded when not provided", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: void 0,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.getWorkflow).toHaveBeenCalled();
    });
    it("should handle API error", async () => {
      const error = new Error("Failed to load workflow");
      api.getWorkflow.mockRejectedValue(error);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to load workflow:",
        error,
      );
      expect(mockIsLoadingRef.current).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        "Could not load workflow (workflow-1): Failed to load workflow",
      );
    });
    it("should log loaded nodes", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "",
        nodes: [
          { id: "node-1", type: "agent", data: {} },
          { id: "node-2", type: "condition", data: {} },
        ],
        edges: [],
        variables: {},
      };
      api.getWorkflow.mockResolvedValue(mockWorkflow);
      renderHook(() =>
        useWorkflowLoader({
          workflowId: "workflow-1",
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(logger.debug).toHaveBeenCalledWith(
        "Loaded nodes:",
        expect.arrayContaining([
          expect.objectContaining({ id: "node-1", type: "agent" }),
          expect.objectContaining({ id: "node-2", type: "condition" }),
        ]),
      );
    });
    it("should reset lastLoadedWorkflowIdRef when workflowId is null", () => {
      mockLastLoadedWorkflowIdRef.current = "workflow-1";
      renderHook(() =>
        useWorkflowLoader({
          workflowId: null,
          tabIsUnsaved: false,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          setVariables: mockSetVariables,
          setSelectedNodeId: mockSetSelectedNodeId,
          workflowNodeToNode: mockWorkflowNodeToNode,
          onWorkflowLoaded: mockOnWorkflowLoaded,
          isLoadingRef: mockIsLoadingRef,
          lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
        }),
      );
      expect(mockLastLoadedWorkflowIdRef.current).toBeNull();
      expect(mockIsLoadingRef.current).toBe(false);
    });
  });
  describe("mutation killers - exact conditionals and operators", () => {
    describe("useEffect - exact conditional checks", () => {
      it("should verify exact conditional: if (workflowId && workflowId === lastLoadedWorkflowIdRef.current)", () => {
        mockLastLoadedWorkflowIdRef.current = "workflow-1";
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        expect(api.getWorkflow).not.toHaveBeenCalled();
      });
      it("should verify exact conditional: if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) - workflowId different", () => {
        mockLastLoadedWorkflowIdRef.current = "workflow-1";
        const mockWorkflow = {
          id: "workflow-2",
          name: "Workflow 2",
          description: "Description",
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-2",
            // Different from lastLoaded
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        act(() => {
          jest.advanceTimersByTime(0);
        });
        expect(api.getWorkflow).toHaveBeenCalledWith("workflow-2");
      });
      it("should verify exact conditional: if (workflowId)", () => {
        renderHook(() =>
          useWorkflowLoader({
            workflowId: null,
            // Falsy
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        expect(api.getWorkflow).not.toHaveBeenCalled();
        expect(mockLastLoadedWorkflowIdRef.current).toBeNull();
        expect(mockIsLoadingRef.current).toBe(false);
      });
      it("should verify exact conditional: if (tabIsUnsaved)", () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: true,
            // Unsaved - should not load
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        expect(api.getWorkflow).not.toHaveBeenCalled();
      });
    });
    describe("workflow processing - exact logical OR operators", () => {
      it('should verify exact logical OR: workflow.description || ""', async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: null,
          // null - should use fallback
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith("");
      });
      it("should verify exact logical OR: workflow.variables || {}", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [],
          variables: null,
          // null - should use fallback
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockSetVariables).toHaveBeenCalledWith({});
      });
      it("should verify exact logical OR: workflow.edges || []", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: null,
          // null - should use fallback
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(formatEdgesForReactFlow).toHaveBeenCalledWith([]);
      });
    });
    describe("callback execution - exact conditional", () => {
      it("should verify exact conditional: if (onWorkflowLoaded)", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockOnWorkflowLoaded).toHaveBeenCalledWith(
          "workflow-1",
          "Workflow 1",
        );
      });
      it("should verify exact conditional: if (onWorkflowLoaded) - undefined", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: void 0,
            // Undefined - should not call
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        expect(mockSetLocalWorkflowId).toHaveBeenCalled();
      });
    });
    describe("setTimeout - exact delays", () => {
      it("should verify exact setTimeout delay: 50ms for setEdges", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        const setTimeoutCalls = setTimeoutSpy.mock.calls;
        const edgeCall = setTimeoutCalls.find((call) => call[1] === 50);
        expect(edgeCall).toBeDefined();
        setTimeoutSpy.mockRestore();
      });
      it("should verify exact setTimeout delay: 100ms for isLoadingRef", async () => {
        const mockWorkflow = {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description",
          nodes: [],
          edges: [],
          variables: {},
        };
        api.getWorkflow.mockResolvedValue(mockWorkflow);
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");
        renderHook(() =>
          useWorkflowLoader({
            workflowId: "workflow-1",
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        await act(async () => {
          jest.advanceTimersByTime(0);
          await Promise.resolve();
        });
        const setTimeoutCalls = setTimeoutSpy.mock.calls;
        const loadingCall = setTimeoutCalls.find((call) => call[1] === 100);
        expect(loadingCall).toBeDefined();
        setTimeoutSpy.mockRestore();
      });
    });
    describe("else branch - exact assignments", () => {
      it("should verify exact assignments in else branch: lastLoadedWorkflowIdRef.current = null, isLoadingRef.current = false", () => {
        renderHook(() =>
          useWorkflowLoader({
            workflowId: null,
            // Triggers else branch
            tabIsUnsaved: false,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            setLocalWorkflowId: mockSetLocalWorkflowId,
            setLocalWorkflowName: mockSetLocalWorkflowName,
            setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
            setVariables: mockSetVariables,
            setSelectedNodeId: mockSetSelectedNodeId,
            workflowNodeToNode: mockWorkflowNodeToNode,
            onWorkflowLoaded: mockOnWorkflowLoaded,
            isLoadingRef: mockIsLoadingRef,
            lastLoadedWorkflowIdRef: mockLastLoadedWorkflowIdRef,
          }),
        );
        expect(mockLastLoadedWorkflowIdRef.current).toBeNull();
        expect(mockIsLoadingRef.current).toBe(false);
      });
    });
  });
});
