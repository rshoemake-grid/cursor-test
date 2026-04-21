import React from "react";
import { renderHook, act, render } from "@testing-library/react";
import { useClipboard } from "./useClipboard";
import { CanvasClipboardProvider } from "../../contexts/CanvasClipboardContext";
import { showSuccess } from "../../utils/notifications";
jest.mock("../../utils/notifications", () => ({
  showSuccess: jest.fn(),
}));
const mockShowSuccess = showSuccess;

describe("useClipboard", () => {
  let mockNotifyModified;
  let mockReactFlowInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifyModified = jest.fn();
    mockReactFlowInstance = {
      getNodes: jest.fn(() => []),
      screenToFlowPosition: jest.fn((pos) => pos),
      addNodes: jest.fn(),
      addEdges: jest.fn(),
      deleteElements: jest.fn(),
    };
  });
  const createMockRef = (instance) => {
    return { current: instance };
  };
  it("should initialize with empty clipboard", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    expect(result.current.clipboardNode).toBeNull();
    expect(result.current.clipboard).toBeNull();
    expect(result.current.clipboardHasContent).toBe(false);
  });
  it("should copy a node", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    expect(result.current.clipboardNode).toEqual(node);
    expect(result.current.clipboard.action).toBe("copy");
    expect(mockShowSuccess).toHaveBeenCalledWith("Node copied to clipboard");
  });
  it("should cut a node", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.cut(node);
    });
    expect(result.current.clipboardNode).toEqual(node);
    expect(result.current.clipboard.action).toBe("cut");
    expect(mockShowSuccess).toHaveBeenCalledWith("Node cut to clipboard");
  });
  it("should paste a copied node", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste();
    });
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalled();
    expect(mockReactFlowInstance.deleteElements).not.toHaveBeenCalled();
    expect(result.current.clipboardNode).toEqual(node);
    expect(mockNotifyModified).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith("Node pasted");
  });
  it("should paste a cut node and delete original on same tab", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() =>
      useClipboard(ref, mockNotifyModified, "tab-a"),
    );
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.cut(node);
    });
    act(() => {
      result.current.paste();
    });
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalled();
    expect(mockReactFlowInstance.deleteElements).toHaveBeenCalledWith({
      nodes: [{ id: "node1" }],
      edges: [],
    });
    expect(result.current.clipboardNode).toBeNull();
    expect(mockNotifyModified).toHaveBeenCalled();
  });
  it("should not delete originals when pasting cut from another tab id", () => {
    const refFrom = createMockRef(mockReactFlowInstance);
    const refTo = createMockRef(mockReactFlowInstance);
    const apiRef = { current: null };
    function TwoBuildersTabs() {
      const from = useClipboard(refFrom, mockNotifyModified, "tab-a");
      const to = useClipboard(refTo, mockNotifyModified, "tab-b");
      apiRef.current = { from, to };
      return null;
    }
    render(
      <CanvasClipboardProvider>
        <TwoBuildersTabs />
      </CanvasClipboardProvider>,
    );
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      apiRef.current.from.cut(node);
    });
    act(() => {
      apiRef.current.to.paste();
    });
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalled();
    expect(mockReactFlowInstance.deleteElements).not.toHaveBeenCalled();
  });
  it("should paste at specified position", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    mockReactFlowInstance.screenToFlowPosition.mockReturnValue({
      x: 300,
      y: 400,
    });
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste(300, 400);
    });
    expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith({
      x: 300,
      y: 400,
    });
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          position: { x: 300, y: 400 },
        }),
      ]),
    );
  });
  it("should paste at offset position if no coordinates provided", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste();
    });
    expect(mockReactFlowInstance.addNodes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          position: { x: 150, y: 250 },
        }),
      ]),
    );
  });
  it("should add edges when pasting a multi-node selection", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const n1 = {
      id: "a",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {},
    };
    const n2 = {
      id: "b",
      type: "agent",
      position: { x: 100, y: 0 },
      data: {},
    };
    const e1 = { id: "e1", source: "a", target: "b" };
    act(() => {
      result.current.copy({ nodes: [n1, n2], edges: [e1] });
    });
    act(() => {
      result.current.paste();
    });
    expect(mockReactFlowInstance.addEdges).toHaveBeenCalled();
    const addedEdges = mockReactFlowInstance.addEdges.mock.calls[0][0];
    expect(addedEdges).toHaveLength(1);
  });
  it("should not paste if clipboard is empty", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    act(() => {
      result.current.paste();
    });
    expect(mockReactFlowInstance.addNodes).not.toHaveBeenCalled();
    expect(mockNotifyModified).not.toHaveBeenCalled();
  });
  it("should not paste if React Flow instance is missing", () => {
    const ref = createMockRef(null);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste();
    });
    expect(mockNotifyModified).not.toHaveBeenCalled();
  });
  it("should not paste if React Flow methods are missing", () => {
    const ref = createMockRef({});
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste();
    });
    expect(mockNotifyModified).not.toHaveBeenCalled();
  });
  it("should generate new ID when pasting", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    act(() => {
      result.current.paste();
    });
    const addedNodes = mockReactFlowInstance.addNodes.mock.calls[0][0];
    const addedNode = Array.isArray(addedNodes) ? addedNodes[0] : addedNodes;
    expect(addedNode.id).not.toBe("node1");
    expect(addedNode.id).toMatch(/^agent_\d+_0$/);
    expect(addedNode.selected).toBe(false);
  });
  it("should clear clipboard", () => {
    const ref = createMockRef(mockReactFlowInstance);
    const { result } = renderHook(() => useClipboard(ref, mockNotifyModified));
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 100, y: 200 },
      data: { name: "Test Node" },
    };
    act(() => {
      result.current.copy(node);
    });
    expect(result.current.clipboardNode).toEqual(node);
    act(() => {
      result.current.clear();
    });
    expect(result.current.clipboardNode).toBeNull();
    expect(result.current.clipboard).toBeNull();
  });
});
