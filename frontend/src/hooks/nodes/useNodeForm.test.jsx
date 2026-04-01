import { renderHook, act, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import { useNodeForm } from "./useNodeForm";
describe("useNodeForm", () => {
  let mockOnUpdate;
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpdate = jest.fn();
  });
  it("should initialize with empty values", () => {
    const { result } = renderHook(
      () => useNodeForm({
        selectedNode: null,
        onUpdate: mockOnUpdate
      })
    );
    expect(result.current.nameValue).toBe("");
    expect(result.current.descriptionValue).toBe("");
  });
  it("should sync values with selected node", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: "Test Node",
        description: "Test description"
      }
    };
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: null }
      }
    );
    expect(result.current.nameValue).toBe("");
    rerender({ selectedNode: node });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("Test Node");
      expect(result.current.descriptionValue).toBe("Test description");
    });
  });
  it("should use label if name is not provided", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: "Label Only"
      }
    };
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: null }
      }
    );
    rerender({ selectedNode: node });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("Label Only");
    });
  });
  it("should prefer name over label", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: "Name Value",
        label: "Label Value"
      }
    };
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: null }
      }
    );
    rerender({ selectedNode: node });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("Name Value");
    });
  });
  it("should clear values when node is deselected", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: "Test Node",
        description: "Test description"
      }
    };
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: node }
      }
    );
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("Test Node");
    });
    rerender({ selectedNode: null });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("");
      expect(result.current.descriptionValue).toBe("");
    });
  });
  it("should call onUpdate when name changes", () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: { name: "Original" }
    };
    const { result } = renderHook(
      () => useNodeForm({
        selectedNode: node,
        onUpdate: mockOnUpdate
      })
    );
    act(() => {
      result.current.handleNameChange("New Name");
    });
    expect(mockOnUpdate).toHaveBeenCalledWith("name", "New Name");
    expect(result.current.nameValue).toBe("New Name");
  });
  it("should call onUpdate when description changes", () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: { description: "Original" }
    };
    const { result } = renderHook(
      () => useNodeForm({
        selectedNode: node,
        onUpdate: mockOnUpdate
      })
    );
    act(() => {
      result.current.handleDescriptionChange("New Description");
    });
    expect(mockOnUpdate).toHaveBeenCalledWith("description", "New Description");
    expect(result.current.descriptionValue).toBe("New Description");
  });
  it("should not call onUpdate if no node selected", () => {
    const { result } = renderHook(
      () => useNodeForm({
        selectedNode: null,
        onUpdate: mockOnUpdate
      })
    );
    act(() => {
      result.current.handleNameChange("New Name");
    });
    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(result.current.nameValue).toBe("New Name");
  });
  it("should provide input refs", () => {
    const { result } = renderHook(
      () => useNodeForm({
        selectedNode: null,
        onUpdate: mockOnUpdate
      })
    );
    expect(result.current.nameInputRef).toBeDefined();
    expect(result.current.nameInputRef.current).toBeNull();
    expect(result.current.descriptionInputRef).toBeDefined();
    expect(result.current.descriptionInputRef.current).toBeNull();
  });
  it("should handle non-string name/label values", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: 123,
        label: { type: "span" }
      }
    };
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: null }
      }
    );
    rerender({ selectedNode: node });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("");
    });
  });
  it("should handle null/undefined nodeName and nodeDescription with defensive checks", async () => {
    const node = {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: null,
        description: void 0
      }
    };
    const originalActiveElement = document.activeElement;
    Object.defineProperty(document, "activeElement", {
      writable: true,
      value: null
    });
    const { result, rerender } = renderHook(
      ({ selectedNode }) => useNodeForm({
        selectedNode,
        onUpdate: mockOnUpdate
      }),
      {
        initialProps: { selectedNode: null }
      }
    );
    rerender({ selectedNode: node });
    await waitForWithTimeout(() => {
      expect(result.current.nameValue).toBe("");
      expect(result.current.descriptionValue).toBe("");
    });
    Object.defineProperty(document, "activeElement", {
      writable: true,
      value: originalActiveElement
    });
  });
});
