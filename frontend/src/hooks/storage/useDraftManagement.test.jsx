import { renderHook, waitFor } from "@testing-library/react";
import {
  useDraftManagement,
  loadDraftsFromStorage,
  saveDraftsToStorage,
  shouldApplyDraftCanvas,
} from "./useDraftManagement";
import { getLocalStorageItem, setLocalStorageItem } from "./useLocalStorage";
jest.mock("./useLocalStorage", () => ({
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
const mockSetLocalStorageItem = setLocalStorageItem;
describe("useDraftManagement", () => {
  const mockNodes = [
    { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
  ];
  const mockEdges = [{ id: "edge-1", source: "node-1", target: "node-2" }];
  const mockSetNodes = jest.fn();
  const mockSetEdges = jest.fn();
  const mockSetLocalWorkflowId = jest.fn();
  const mockSetLocalWorkflowName = jest.fn();
  const mockSetLocalWorkflowDescription = jest.fn();
  const mockNormalizeNodeForStorage = jest.fn((node) => node);
  const mockIsAddingAgentsRef = { current: false };
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalStorageItem.mockReturnValue({});
    mockNormalizeNodeForStorage.mockImplementation((node) => node);
  });
  it("should load draft when tabId matches and tab is unsaved", () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: "workflow-1",
      workflowName: "Test Workflow",
      workflowDescription: "Test Description",
      isUnsaved: true,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: "workflow-1",
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: true,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).toHaveBeenCalledWith(mockNodes);
    expect(mockSetEdges).toHaveBeenCalledWith(mockEdges);
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith("workflow-1");
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith("Test Workflow");
    expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith(
      "Test Description",
    );
  });
  it("does not overlay draft onto a saved tab (avoids stale empty drafts blanking canvas)", () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: "workflow-1",
      workflowName: "Stale Name",
      workflowDescription: "",
      isUnsaved: false,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: "workflow-1",
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).not.toHaveBeenCalled();
    expect(mockSetEdges).not.toHaveBeenCalled();
    expect(mockSetLocalWorkflowId).not.toHaveBeenCalled();
    expect(mockSetLocalWorkflowName).not.toHaveBeenCalled();
    expect(mockSetLocalWorkflowDescription).not.toHaveBeenCalled();
  });
  it("should not load draft when workflowId does not match", () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: "workflow-1",
      workflowName: "Test Workflow",
      workflowDescription: "Test Description",
      isUnsaved: false,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: "workflow-2",
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).not.toHaveBeenCalled();
  });
  it("should clear workflow when no workflowId and no draft", () => {
    mockGetLocalStorageItem.mockReturnValue({});
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: null,
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).toHaveBeenCalledWith([]);
    expect(mockSetEdges).toHaveBeenCalledWith([]);
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith(null);
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith("Untitled Workflow");
    expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith("");
  });
  it("should hydrate from draft when workflowId prop is null but draft is a saved workflow with nodes", () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: "workflow-1",
      workflowName: "From Draft",
      workflowDescription: "Desc",
      isUnsaved: false,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: null,
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).toHaveBeenCalledWith(mockNodes);
    expect(mockSetEdges).toHaveBeenCalledWith(mockEdges);
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith("workflow-1");
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith("From Draft");
    expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith("Desc");
  });
  it("should hydrate saved workflow draft when prop workflowId is null even if graph is empty", () => {
    const draft = {
      nodes: [],
      edges: [],
      workflowId: "workflow-1",
      workflowName: "Empty Graph",
      workflowDescription: "",
      isUnsaved: false,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: null,
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockSetNodes).toHaveBeenCalledWith([]);
    expect(mockSetEdges).toHaveBeenCalledWith([]);
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith("workflow-1");
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith("Empty Graph");
  });
  it("should save draft when workflow state changes", () => {
    const { rerender } = renderHook((props) => useDraftManagement(props), {
      initialProps: {
        tabId: "tab-1",
        workflowId: null,
        nodes: mockNodes,
        edges: mockEdges,
        localWorkflowId: null,
        localWorkflowName: "Test Workflow",
        localWorkflowDescription: "Test Description",
        tabIsUnsaved: true,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      },
    });
    expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
      "workflowBuilderDrafts",
      expect.objectContaining({
        "tab-1": expect.objectContaining({
          nodes: mockNodes,
          edges: mockEdges,
          workflowName: "Test Workflow",
          workflowDescription: "Test Description",
          isUnsaved: true,
        }),
      }),
      expect.objectContaining({
        storage: void 0,
        logger: expect.any(Object),
      }),
    );
    rerender({
      tabId: "tab-1",
      workflowId: null,
      nodes: [
        ...mockNodes,
        { id: "node-2", type: "condition", position: { x: 0, y: 0 }, data: {} },
      ],
      edges: mockEdges,
      localWorkflowId: null,
      localWorkflowName: "Test Workflow",
      localWorkflowDescription: "Test Description",
      tabIsUnsaved: true,
      setNodes: mockSetNodes,
      setEdges: mockSetEdges,
      setLocalWorkflowId: mockSetLocalWorkflowId,
      setLocalWorkflowName: mockSetLocalWorkflowName,
      setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
      normalizeNodeForStorage: mockNormalizeNodeForStorage,
    });
    expect(mockSetLocalStorageItem).toHaveBeenCalledTimes(2);
  });
  it("should skip loading draft when adding agents", () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: "workflow-1",
      workflowName: "Test Workflow",
      workflowDescription: "Test Description",
      isUnsaved: false,
    };
    mockGetLocalStorageItem.mockReturnValue({
      "tab-1": draft,
    });
    mockIsAddingAgentsRef.current = true;
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: "workflow-1",
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Untitled Workflow",
        localWorkflowDescription: "",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
        isAddingAgentsRef: mockIsAddingAgentsRef,
      }),
    );
    expect(mockSetNodes).not.toHaveBeenCalled();
  });
  it("persists previous tab draft when tabId changes", () => {
    let stored = {};
    mockGetLocalStorageItem.mockImplementation(() => stored);
    mockSetLocalStorageItem.mockImplementation((key, val) => {
      if (key === "workflowBuilderDrafts" && val && typeof val === "object") {
        stored = { ...val };
      }
    });
    const baseProps = {
      workflowId: null,
      nodes: mockNodes,
      edges: mockEdges,
      localWorkflowId: null,
      localWorkflowName: "Tab One",
      localWorkflowDescription: "",
      tabIsUnsaved: true,
      setNodes: mockSetNodes,
      setEdges: mockSetEdges,
      setLocalWorkflowId: mockSetLocalWorkflowId,
      setLocalWorkflowName: mockSetLocalWorkflowName,
      setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
      normalizeNodeForStorage: mockNormalizeNodeForStorage,
    };
    const { rerender } = renderHook((p) => useDraftManagement(p), {
      initialProps: { ...baseProps, tabId: "tab-1" },
    });
    rerender({
      ...baseProps,
      tabId: "tab-2",
      nodes: [],
      edges: [],
      localWorkflowName: "Untitled Workflow",
      tabIsUnsaved: false,
    });
    expect(stored["tab-1"]).toEqual(
      expect.objectContaining({
        nodes: mockNodes,
        edges: mockEdges,
        workflowName: "Tab One",
        isUnsaved: true,
      }),
    );
  });
  it("merges flush with latest storage so another tab's draft is not clobbered", async () => {
    let stored = {
      "tab-a": {
        nodes: [{ id: "node-a", type: "agent", position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        workflowId: null,
        workflowName: "Tab A",
        workflowDescription: "",
        isUnsaved: true,
      },
    };
    mockGetLocalStorageItem.mockImplementation(() => ({ ...stored }));
    mockSetLocalStorageItem.mockImplementation((key, val) => {
      if (key === "workflowBuilderDrafts" && val && typeof val === "object") {
        stored = { ...val };
      }
    });
    const tabBNodes = [
      { id: "node-b", type: "agent", position: { x: 1, y: 1 }, data: {} },
    ];
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-b",
        workflowId: null,
        nodes: tabBNodes,
        edges: [],
        localWorkflowId: null,
        localWorkflowName: "Tab B",
        localWorkflowDescription: "",
        tabIsUnsaved: true,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    await waitFor(() => {
      expect(stored["tab-b"]).toBeDefined();
    });
    expect(stored["tab-a"]?.nodes?.[0]?.id).toBe("node-a");
    expect(stored["tab-b"]?.nodes?.[0]?.id).toBe("node-b");
  });
  it("should normalize nodes before saving", () => {
    const normalizedNode = { ...mockNodes[0], data: { normalized: true } };
    mockNormalizeNodeForStorage.mockReturnValue(normalizedNode);
    renderHook(() =>
      useDraftManagement({
        tabId: "tab-1",
        workflowId: null,
        nodes: mockNodes,
        edges: mockEdges,
        localWorkflowId: null,
        localWorkflowName: "Test Workflow",
        localWorkflowDescription: "Test Description",
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      }),
    );
    expect(mockNormalizeNodeForStorage).toHaveBeenCalledWith(
      mockNodes[0],
      0,
      mockNodes,
    );
    expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
      "workflowBuilderDrafts",
      expect.objectContaining({
        "tab-1": expect.objectContaining({
          nodes: [normalizedNode],
        }),
      }),
      expect.objectContaining({
        storage: void 0,
        logger: expect.any(Object),
      }),
    );
  });
});
describe("loadDraftsFromStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should load drafts from storage", () => {
    const drafts = {
      "tab-1": {
        nodes: [],
        edges: [],
        workflowId: "workflow-1",
        workflowName: "Test",
        workflowDescription: "",
        isUnsaved: false,
      },
    };
    mockGetLocalStorageItem.mockReturnValue(drafts);
    const result = loadDraftsFromStorage();
    expect(result).toEqual(drafts);
    expect(mockGetLocalStorageItem).toHaveBeenCalledWith(
      "workflowBuilderDrafts",
      {},
      void 0,
    );
  });
  it("should return empty object when storage returns null", () => {
    mockGetLocalStorageItem.mockReturnValue(null);
    const result = loadDraftsFromStorage();
    expect(result).toEqual({});
  });
  it("should return empty object when storage returns non-object", () => {
    mockGetLocalStorageItem.mockReturnValue("invalid");
    const result = loadDraftsFromStorage();
    expect(result).toEqual({});
  });
});
describe("saveDraftsToStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should save drafts to storage", () => {
    const drafts = {
      "tab-1": {
        nodes: [],
        edges: [],
        workflowId: "workflow-1",
        workflowName: "Test",
        workflowDescription: "",
        isUnsaved: false,
      },
    };
    saveDraftsToStorage(drafts);
    expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
      "workflowBuilderDrafts",
      drafts,
      void 0,
    );
  });
});
describe("shouldApplyDraftCanvas", () => {
  it("is false for saved tab even when ids match", () => {
    const draft = { workflowId: "w1", nodes: [] };
    expect(shouldApplyDraftCanvas(draft, "w1", false)).toBe(false);
  });
  it("is true for unsaved tab when ids match", () => {
    const draft = { workflowId: "w1", nodes: [] };
    expect(shouldApplyDraftCanvas(draft, "w1", true)).toBe(true);
  });
  it("is true when workflowId is not yet set (recovery)", () => {
    const draft = { workflowId: "w1", nodes: [] };
    expect(shouldApplyDraftCanvas(draft, null, false)).toBe(true);
  });
});
