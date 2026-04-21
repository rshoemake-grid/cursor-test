import { renderHook } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
const mockUseReactFlow = jest.fn();
jest.mock("@xyflow/react", () => {
  const React2 = require("react");
  const actual = jest.requireActual("@xyflow/react");
  return {
    ...actual,
    useReactFlow: () => mockUseReactFlow(),
    ReactFlowProvider: ({ children }) =>
      React2.createElement(React2.Fragment, null, children),
  };
});
describe("useKeyboardShortcuts", () => {
  let mockDeleteElements;
  let mockGetNodes;
  let mockGetEdges;
  let mockOnCopy;
  let mockOnCut;
  let mockOnPaste;
  let mockSetSelectedNodeId;
  let mockNotifyModified;
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteElements = jest.fn();
    mockGetNodes = jest.fn(() => []);
    mockGetEdges = jest.fn(() => []);
    mockOnCopy = jest.fn();
    mockOnCut = jest.fn();
    mockOnPaste = jest.fn();
    mockSetSelectedNodeId = jest.fn();
    mockNotifyModified = jest.fn();
    mockUseReactFlow.mockReturnValue({
      deleteElements: mockDeleteElements,
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
    });
  });
  const renderHookWithProvider = (options) => {
    return renderHook(() => useKeyboardShortcuts(options), {
      wrapper: ReactFlowProvider,
    });
  };
  it("should set up keyboard event listeners", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
    addEventListenerSpy.mockRestore();
  });
  it("should clean up event listeners on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
  it("should not handle shortcuts when typing in input field", () => {
    const mockInput = document.createElement("input");
    mockGetNodes.mockReturnValue([{ id: "node1", selected: true }]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
    });
    Object.defineProperty(event, "target", {
      value: mockInput,
      writable: false,
    });
    window.dispatchEvent(event);
    expect(mockOnCopy).not.toHaveBeenCalled();
  });
  it("should handle Copy shortcut (Ctrl+C)", () => {
    const selectedNode = { id: "node1", selected: true };
    mockGetNodes.mockReturnValue([selectedNode]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
    });
    event.preventDefault = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOnCopy).toHaveBeenCalledWith({
      nodes: [selectedNode],
      edges: [],
    });
  });
  it("should handle Copy shortcut (Cmd+C on Mac)", () => {
    const selectedNode = { id: "node1", selected: true };
    mockGetNodes.mockReturnValue([selectedNode]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "c",
      metaKey: true,
    });
    event.preventDefault = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOnCopy).toHaveBeenCalledWith({
      nodes: [selectedNode],
      edges: [],
    });
  });
  it("should copy multiple selected nodes and internal edges", () => {
    const n1 = { id: "node1", selected: true };
    const n2 = { id: "node2", selected: true };
    mockGetNodes.mockReturnValue([n1, n2]);
    mockGetEdges.mockReturnValue([
      { id: "e1", source: "node1", target: "node2" },
      { id: "e2", source: "node0", target: "node1" },
    ]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
    });
    event.preventDefault = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOnCopy).toHaveBeenCalledWith({
      nodes: [n1, n2],
      edges: [{ id: "e1", source: "node1", target: "node2" }],
    });
  });
  it("should handle Cut shortcut (Ctrl+X)", () => {
    const selectedNode = { id: "node1", selected: true };
    mockGetNodes.mockReturnValue([selectedNode]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "x",
      ctrlKey: true,
    });
    event.preventDefault = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOnCut).toHaveBeenCalledWith({
      nodes: [selectedNode],
      edges: [],
    });
  });
  it("should handle Paste shortcut (Ctrl+V)", () => {
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: true,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
    });
    event.preventDefault = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOnPaste).toHaveBeenCalled();
  });
  it("should not paste if clipboard is empty", () => {
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
    });
    window.dispatchEvent(event);
    expect(mockOnPaste).not.toHaveBeenCalled();
  });
  it("should handle Delete key", () => {
    const selectedNode = { id: "node1", selected: true };
    const selectedEdge = {
      id: "e1",
      source: "node1",
      target: "node2",
      selected: true,
    };
    mockGetNodes.mockReturnValue([selectedNode]);
    mockGetEdges.mockReturnValue([selectedEdge]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "Delete",
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    window.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockDeleteElements).toHaveBeenCalledWith({
      nodes: [selectedNode],
      edges: [selectedEdge],
    });
    expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
    expect(mockNotifyModified).toHaveBeenCalled();
  });
  it("should handle Backspace key", () => {
    const selectedNode = { id: "node1", selected: true };
    mockGetNodes.mockReturnValue([selectedNode]);
    mockGetEdges.mockReturnValue([]);
    renderHookWithProvider({
      selectedNodeId: "node1",
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "Backspace",
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    window.dispatchEvent(event);
    expect(mockDeleteElements).toHaveBeenCalled();
    expect(mockNotifyModified).toHaveBeenCalled();
  });
  it("should not delete if nothing is selected", () => {
    mockGetNodes.mockReturnValue([]);
    mockGetEdges.mockReturnValue([]);
    renderHookWithProvider({
      selectedNodeId: null,
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "Delete",
    });
    window.dispatchEvent(event);
    expect(mockDeleteElements).not.toHaveBeenCalled();
  });
  it("should not clear selectedNodeId if deleted node was not selected", () => {
    const selectedNode = { id: "node1", selected: true };
    mockGetNodes.mockReturnValue([selectedNode]);
    mockGetEdges.mockReturnValue([]);
    renderHookWithProvider({
      selectedNodeId: "node2",
      // Different node selected
      setSelectedNodeId: mockSetSelectedNodeId,
      notifyModified: mockNotifyModified,
      clipboardHasContent: false,
      onCopy: mockOnCopy,
      onCut: mockOnCut,
      onPaste: mockOnPaste,
    });
    const event = new KeyboardEvent("keydown", {
      key: "Delete",
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    window.dispatchEvent(event);
    expect(mockDeleteElements).toHaveBeenCalled();
    expect(mockSetSelectedNodeId).not.toHaveBeenCalled();
  });
});
