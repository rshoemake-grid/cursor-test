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
    ReactFlowProvider: ({ children }) => React2.createElement(React2.Fragment, null, children)
  };
});
describe("useKeyboardShortcuts - Mutation Killers", () => {
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
      getEdges: mockGetEdges
    });
  });
  const renderHookWithProvider = (options) => {
    return renderHook(() => useKeyboardShortcuts(options), {
      wrapper: ReactFlowProvider
    });
  };
  const createKeyboardEvent = (options) => {
    const event = new KeyboardEvent("keydown", {
      key: options.key,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    if (options.target) {
      Object.defineProperty(event, "target", { value: options.target, writable: false });
    }
    return event;
  };
  describe("Input field detection - logical OR", () => {
    it("should verify exact OR - INPUT tagName", () => {
      const mockInput = document.createElement("input");
      mockGetNodes.mockReturnValue([{ id: "node1", selected: true }]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true, target: mockInput });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
    it("should verify exact OR - TEXTAREA tagName", () => {
      const mockTextarea = document.createElement("textarea");
      mockGetNodes.mockReturnValue([{ id: "node1", selected: true }]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true, target: mockTextarea });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
    it("should verify exact OR - isContentEditable", () => {
      const mockDiv = document.createElement("div");
      Object.defineProperty(mockDiv, "isContentEditable", {
        get: () => true,
        configurable: true
      });
      mockGetNodes.mockReturnValue([{ id: "node1", selected: true }]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true, target: mockDiv });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
    it("should verify exact OR - none match (should handle shortcut)", () => {
      const mockDiv = document.createElement("div");
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true, target: mockDiv });
      window.dispatchEvent(event);
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode);
    });
  });
  describe("Copy shortcut - logical OR and exact string match", () => {
    it("should verify exact OR - ctrlKey true", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode);
      expect(event.preventDefault).toHaveBeenCalled();
    });
    it("should verify exact OR - metaKey true", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", metaKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode);
      expect(event.preventDefault).toHaveBeenCalled();
    });
    it('should verify exact string match - key === "c"', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode);
    });
    it('should verify exact string match - key !== "c" (should not copy)', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "d", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
    it("should verify exact equality - selectedNodes.length === 1", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).toHaveBeenCalledWith(selectedNode);
    });
    it("should verify exact equality - selectedNodes.length !== 1 (should not copy)", () => {
      mockGetNodes.mockReturnValue([
        { id: "node1", selected: true },
        { id: "node2", selected: true }
      ]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
    it("should verify exact equality - selectedNodes.length === 0 (should not copy)", () => {
      mockGetNodes.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "c", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
  });
  describe("Cut shortcut - logical OR and exact string match", () => {
    it("should verify exact OR - ctrlKey true", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "x", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode);
      expect(event.preventDefault).toHaveBeenCalled();
    });
    it("should verify exact OR - metaKey true", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "x", metaKey: true });
      window.dispatchEvent(event);
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode);
    });
    it('should verify exact string match - key === "x"', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "x", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode);
    });
    it('should verify exact string match - key !== "x" (should not cut)', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "y", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCut).not.toHaveBeenCalled();
    });
    it("should verify exact equality - selectedNodes.length === 1", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "x", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnCut).toHaveBeenCalledWith(selectedNode);
    });
  });
  describe("Paste shortcut - logical OR and truthy check", () => {
    it("should verify exact OR - ctrlKey true", () => {
      const clipboardNode = { id: "node1", type: "agent" };
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
    it("should verify exact OR - metaKey true", () => {
      const clipboardNode = { id: "node1", type: "agent" };
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", metaKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).toHaveBeenCalled();
    });
    it('should verify exact string match - key === "v"', () => {
      const clipboardNode = { id: "node1", type: "agent" };
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).toHaveBeenCalled();
    });
    it("should verify truthy check - clipboardNode exists", () => {
      const clipboardNode = { id: "node1", type: "agent" };
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).toHaveBeenCalled();
    });
    it("should verify truthy check - clipboardNode is null (should not paste)", () => {
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).not.toHaveBeenCalled();
    });
    it("should verify truthy check - clipboardNode is undefined (should not paste)", () => {
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: void 0,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "v", ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockOnPaste).not.toHaveBeenCalled();
    });
  });
  describe("Delete/Backspace - logical OR and exact string match", () => {
    it('should verify exact OR - key === "Delete"', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
    it('should verify exact OR - key === "Backspace"', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Backspace" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
    it('should verify exact string match - key !== "Delete" && key !== "Backspace" (should not delete)', () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Enter" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).not.toHaveBeenCalled();
    });
  });
  describe("Delete selection - logical OR and comparison operators", () => {
    it("should verify exact OR - selectedNodes.length > 0", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should verify exact OR - selectedEdges.length > 0", () => {
      const selectedEdge = { id: "e1", source: "node1", target: "node2", selected: true };
      mockGetNodes.mockReturnValue([]);
      mockGetEdges.mockReturnValue([selectedEdge]);
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should verify exact OR - both false (should not delete)", () => {
      mockGetNodes.mockReturnValue([]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should verify exact comparison - selectedNodes.length > 0 (not === 0)", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).toHaveBeenCalled();
    });
    it("should verify exact comparison - selectedNodes.length === 0 (should not delete)", () => {
      mockGetNodes.mockReturnValue([]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: null,
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockDeleteElements).not.toHaveBeenCalled();
    });
  });
  describe("Clear selection - some() check", () => {
    it("should verify some() check - node.id === selectedNodeId", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
    });
    it("should verify some() check - node.id !== selectedNodeId (should not clear)", () => {
      const selectedNode = { id: "node1", selected: true };
      mockGetNodes.mockReturnValue([selectedNode]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node2",
        // Different ID
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockSetSelectedNodeId).not.toHaveBeenCalled();
    });
    it("should verify some() check - empty array (should not clear)", () => {
      mockGetNodes.mockReturnValue([]);
      mockGetEdges.mockReturnValue([]);
      renderHookWithProvider({
        selectedNodeId: "node1",
        setSelectedNodeId: mockSetSelectedNodeId,
        notifyModified: mockNotifyModified,
        clipboardNode: null,
        onCopy: mockOnCopy,
        onCut: mockOnCut,
        onPaste: mockOnPaste
      });
      const event = createKeyboardEvent({ key: "Delete" });
      window.dispatchEvent(event);
      expect(mockSetSelectedNodeId).not.toHaveBeenCalled();
    });
  });
});
