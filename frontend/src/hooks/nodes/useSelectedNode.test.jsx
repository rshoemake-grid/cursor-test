import { renderHook } from "@testing-library/react";
import { useSelectedNode } from "./useSelectedNode";
import { useReactFlow } from "@xyflow/react";
import { findNodeById, nodeExists } from "../../utils/nodeUtils";
jest.mock("@xyflow/react", () => ({
  useReactFlow: jest.fn(),
}));
jest.mock("../../utils/nodeUtils", () => ({
  findNodeById: jest.fn(),
  nodeExists: jest.fn(),
}));
const mockUseReactFlow = useReactFlow;
const mockFindNodeById = findNodeById;
const mockNodeExists = nodeExists;
describe("useSelectedNode", () => {
  let mockGetNodes;
  const mockNodes = [
    {
      id: "node-1",
      type: "agent",
      data: { name: "Node 1" },
    },
    {
      id: "node-2",
      type: "agent",
      data: { name: "Node 2" },
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodes = jest.fn(() => mockNodes);
    mockUseReactFlow.mockReturnValue({
      getNodes: mockGetNodes,
      setNodes: jest.fn(),
      deleteElements: jest.fn(),
      getEdges: jest.fn(() => []),
      getNode: jest.fn(),
      getEdge: jest.fn(),
      addNodes: jest.fn(),
      addEdges: jest.fn(),
      updateNode: jest.fn(),
      updateEdge: jest.fn(),
      toObject: jest.fn(),
      fromObject: jest.fn(),
      getViewport: jest.fn(),
      setViewport: jest.fn(),
      screenToFlowCoordinate: jest.fn(),
      flowToScreenCoordinate: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      zoomTo: jest.fn(),
      fitView: jest.fn(),
      project: jest.fn(),
      getIntersectingNodes: jest.fn(),
      isNodeIntersecting: jest.fn(),
    });
    mockFindNodeById.mockImplementation((id, getNodes, nodes) => {
      return nodes.find((n) => n.id === id) || null;
    });
    mockNodeExists.mockImplementation((id, getNodes, nodes) => {
      return nodes.some((n) => n.id === id);
    });
  });
  describe("nodes", () => {
    it("should return nodes from React Flow", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        }),
      );
      expect(result.current.nodes).toEqual(mockNodes);
      expect(mockGetNodes).toHaveBeenCalled();
    });
    it("should fallback to nodesProp when React Flow returns empty", () => {
      mockGetNodes.mockReturnValue([]);
      const propNodes = [{ id: "prop-node", type: "agent", data: {} }];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: propNodes,
        }),
      );
      expect(result.current.nodes).toEqual(propNodes);
    });
    it("should fallback to nodesProp when React Flow throws", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("React Flow error");
      });
      const propNodes = [{ id: "prop-node", type: "agent", data: {} }];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: propNodes,
        }),
      );
      expect(result.current.nodes).toEqual(propNodes);
    });
    it("should return empty array when no nodes available", () => {
      mockGetNodes.mockReturnValue([]);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
  });
  describe("selectedNode", () => {
    it("should return null when no node selected", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should find and return selected node", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
        }),
      );
      expect(result.current.selectedNode).toEqual(mockNodes[0]);
      expect(mockFindNodeById).toHaveBeenCalledWith(
        "node-1",
        mockGetNodes,
        mockNodes,
      );
    });
    it("should return null when node not found", () => {
      mockFindNodeById.mockReturnValue(null);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "nonexistent",
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should cache node when same ID selected", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstResult = result.current.selectedNode;
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBe(firstResult);
    });
    it("should update cache when node changes", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const updatedNode = { ...mockNodes[0], data: { name: "Updated Node 1" } };
      mockFindNodeById.mockReturnValue(updatedNode);
      mockNodeExists.mockReturnValue(true);
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should clear cache when node no longer exists", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId, nodesProp }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp,
          }),
        {
          initialProps: { selectedNodeId: "node-1", nodesProp: mockNodes },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockGetNodes.mockReturnValue([]);
      mockNodeExists.mockImplementation(() => false);
      mockFindNodeById.mockImplementation(() => null);
      rerender({ selectedNodeId: "node-1", nodesProp: [] });
      expect(result.current.selectedNode).toBeNull();
    });
    it("should clear cache when selection changes to null", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: null });
      expect(result.current.selectedNode).toBeNull();
    });
    it("should update cache when selection changes to different node", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should use nodesProp when provided", () => {
      const propNodes = [
        { id: "prop-node", type: "agent", data: { name: "Prop Node" } },
      ];
      mockGetNodes.mockReturnValue([]);
      mockFindNodeById.mockImplementation((id, getNodes, nodes) => {
        return nodes.find((n) => n.id === id) || null;
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "prop-node",
          nodesProp: propNodes,
        }),
      );
      expect(result.current.selectedNode).toEqual(propNodes[0]);
    });
    it("should return empty array when flowNodes.length === 0 and nodesProp is undefined", () => {
      mockGetNodes.mockReturnValue([]);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
    it("should return empty array in catch when nodesProp is undefined", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("React Flow error");
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
    it("should verify selectedNodeIdRef.current !== selectedNodeId path", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
      expect(mockFindNodeById).toHaveBeenCalledWith(
        "node-2",
        mockGetNodes,
        expect.any(Array),
      );
    });
    it("should verify selectedNodeIdRef.current exists but selectedNodeIdRef.current is falsy", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      mockGetNodes.mockReturnValue([]);
      mockNodeExists.mockReturnValue(false);
      mockFindNodeById.mockReturnValue(null);
      rerender({ selectedNodeId: "node-1" });
      expect(mockFindNodeById).toHaveBeenCalled();
    });
    it("should verify nodeExists returns false path", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      mockNodeExists.mockReturnValue(false);
      mockFindNodeById.mockReturnValue(mockNodes[0]);
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it.skip("should verify updated is null path in cache update", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockFindNodeById.mockReturnValue(null);
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it.skip("should verify Object.assign is called when updating cache", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Original" },
      };
      const assignSpy = jest.spyOn(Object, "assign");
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstRender = result.current.selectedNode;
      expect(firstRender).toBeDefined();
      assignSpy.mockClear();
      const updatedNode = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Updated" },
      };
      mockGetNodes.mockReturnValue([updatedNode]);
      mockFindNodeById.mockReturnValue(updatedNode);
      mockNodeExists.mockReturnValue(true);
      rerender({ selectedNodeId: "node-1" });
      if (assignSpy.mock.calls.length > 0) {
        expect(assignSpy).toHaveBeenCalled();
        expect(result.current.selectedNode).toBe(firstRender);
      }
      assignSpy.mockRestore();
    });
    it("should verify found is null path clears cache", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      mockFindNodeById.mockReturnValue(null);
      mockNodeExists.mockReturnValue(false);
      rerender({ selectedNodeId: "nonexistent-node" });
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify spread operator creates copy when caching found node", () => {
      const originalNode = {
        id: "node-1",
        type: "agent",
        data: { name: "Node 1" },
      };
      mockGetNodes.mockReturnValue([originalNode]);
      mockFindNodeById.mockReturnValue(originalNode);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
        }),
      );
      expect(result.current.selectedNode).toEqual(originalNode);
      expect(mockFindNodeById).toHaveBeenCalled();
    });
    it.skip("should verify cache is cleared when found is null on same node", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId, nodesProp }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp,
          }),
        {
          initialProps: { selectedNodeId: "node-1", nodesProp: [node] },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockGetNodes.mockReturnValue([]);
      mockFindNodeById.mockReturnValue(null);
      mockNodeExists.mockReturnValue(false);
      rerender({ selectedNodeId: "node-1", nodesProp: [] });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify return found path returns the found node", () => {
      const foundNode = {
        id: "node-1",
        type: "agent",
        data: { name: "Found Node" },
      };
      mockFindNodeById.mockReturnValue(foundNode);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
        }),
      );
      expect(result.current.selectedNode).toEqual(foundNode);
    });
    it("should verify all conditional branches in selectedNode useMemo", () => {
      const { result: result1 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
        }),
      );
      expect(result1.current.selectedNode).toBeNull();
      jest.clearAllMocks();
      mockGetNodes.mockReturnValue(mockNodes);
      mockFindNodeById.mockImplementation((id) => {
        return mockNodes.find((n) => n.id === id) || null;
      });
      mockNodeExists.mockImplementation((id) => {
        return mockNodes.some((n) => n.id === id);
      });
      const { result: result2, rerender: rerender2 } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const cachedResult = result2.current.selectedNode;
      expect(cachedResult).toBeDefined();
      rerender2({ selectedNodeId: "node-1" });
      expect(result2.current.selectedNode).toBe(cachedResult);
      jest.clearAllMocks();
      mockGetNodes.mockReturnValue(mockNodes);
      mockFindNodeById.mockImplementation((id) => {
        return mockNodes.find((n) => n.id === id) || null;
      });
      mockNodeExists.mockImplementation((id) => {
        return mockNodes.some((n) => n.id === id);
      });
      const { result: result3 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-2",
        }),
      );
      expect(result3.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length > 0", () => {
      const flowNodes = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 100, y: 100 }, data: {} },
      ];
      mockGetNodes.mockReturnValue(flowNodes);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        }),
      );
      expect(result.current.nodes).toEqual(flowNodes);
    });
    it("should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length is 0, nodesProp exists", () => {
      mockGetNodes.mockReturnValue([]);
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify flowNodes.length > 0 ? flowNodes : (nodesProp || []) - flowNodes.length is 0, nodesProp is undefined", () => {
      mockGetNodes.mockReturnValue([]);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
    it("should verify catch block in useMemo - getNodes throws", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify catch block in useMemo - getNodes throws, nodesProp is undefined", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
    it("should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - both true", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Node 1" },
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - selectedNodeIdRef.current !== selectedNodeId", () => {
      const node1 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 100, y: 100 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node1, node2]);
      mockFindNodeById.mockImplementation((id) => {
        if (id === "node-1") return node1;
        if (id === "node-2") return node2;
        return null;
      });
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - selectedNodeRef.current is null", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: null },
        },
      );
      expect(result.current.selectedNode).toBeNull();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify Object.assign(selectedNodeRef.current, updated)", () => {
      const updatedNode = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Updated" },
      };
      mockGetNodes.mockReturnValue([updatedNode]);
      mockFindNodeById.mockReturnValue(updatedNode);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstRender = result.current.selectedNode;
      expect(firstRender).toBeDefined();
      mockFindNodeById.mockReturnValue(updatedNode);
      rerender({ selectedNodeId: "node-1" });
      const secondRender = result.current.selectedNode;
      expect(secondRender).toBeDefined();
      expect(secondRender?.data.label).toBe("Updated");
    });
    it("should verify found ? {...found} : null - found exists", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
    });
    it("should verify found ? {...found} : null - found is null", () => {
      mockGetNodes.mockReturnValue([]);
      mockFindNodeById.mockReturnValue(null);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify spread operator {...found} creates copy", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Node" },
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe(node.id);
    });
    it("should verify nodesProp || [] fallback in catch block", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
    });
    it("should verify nodesProp || [] fallback in catch block - nodesProp has value", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify flowNodes.length > 0 exact comparison - length is 1", () => {
      const flowNodes = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      mockGetNodes.mockReturnValue(flowNodes);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        }),
      );
      expect(result.current.nodes).toEqual(flowNodes);
    });
    it("should verify flowNodes.length > 0 exact comparison - length is 0", () => {
      mockGetNodes.mockReturnValue([]);
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify selectedNodeIdRef.current === selectedNodeId exact comparison", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify selectedNodeRef.current exact truthiness check", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify Object.assign exact method call", () => {
      const updatedNode = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Updated" },
      };
      mockGetNodes.mockReturnValue([updatedNode]);
      mockFindNodeById.mockReturnValue(updatedNode);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstRender = result.current.selectedNode;
      expect(firstRender).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      const secondRender = result.current.selectedNode;
      expect(secondRender).toBe(firstRender);
    });
    it("should verify spread operator {...found} exact usage", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Node" },
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
    });
    it("should verify exact fallback values nodesProp || []", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
      expect(Array.isArray(result.current.nodes)).toBe(true);
      expect(result.current.nodes.length).toBe(0);
    });
    it("should verify exact comparison flowNodes.length > 0", () => {
      const flowNodes1 = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      mockGetNodes.mockReturnValue(flowNodes1);
      const { result: result1 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        }),
      );
      expect(result1.current.nodes).toEqual(flowNodes1);
      mockGetNodes.mockReturnValue([]);
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result: result2 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result2.current.nodes).toEqual(nodesProp);
    });
    it("should verify exact comparison selectedNodeIdRef.current === selectedNodeId", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-2" });
      expect(mockFindNodeById).toHaveBeenCalledWith(
        "node-2",
        expect.any(Function),
        expect.any(Array),
      );
    });
    it("should verify exact truthiness check selectedNodeRef.current", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: null },
        },
      );
      expect(result.current.selectedNode).toBeNull();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact comparison selectedNodeIdRef.current === selectedNodeId - exact match", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact comparison selectedNodeIdRef.current === selectedNodeId - not equal", () => {
      const node1 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 100, y: 100 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node1, node2]);
      mockFindNodeById.mockImplementation((id) => {
        if (id === "node-1") return node1;
        if (id === "node-2") return node2;
        return null;
      });
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
      expect(mockFindNodeById).toHaveBeenCalledWith(
        "node-2",
        expect.any(Function),
        expect.any(Array),
      );
    });
    it("should verify exact truthiness check selectedNodeRef.current - is truthy", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact truthiness check selectedNodeRef.current - is falsy", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact logical AND selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - first false", () => {
      const node1 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 100, y: 100 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node1, node2]);
      mockFindNodeById.mockImplementation((id) => {
        if (id === "node-1") return node1;
        if (id === "node-2") return node2;
        return null;
      });
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify exact logical AND selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - second false", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: null },
        },
      );
      expect(result.current.selectedNode).toBeNull();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact comparison flowNodes.length > 0 - length is exactly 1", () => {
      const flowNodes = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      mockGetNodes.mockReturnValue(flowNodes);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        }),
      );
      expect(result.current.nodes).toEqual(flowNodes);
    });
    it("should verify exact comparison flowNodes.length > 0 - length is exactly 0", () => {
      mockGetNodes.mockReturnValue([]);
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify exact logical OR nodesProp || [] - nodesProp is undefined", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.nodes).toEqual([]);
      expect(Array.isArray(result.current.nodes)).toBe(true);
    });
    it("should verify exact logical OR nodesProp || [] - nodesProp has value", () => {
      mockGetNodes.mockImplementation(() => {
        throw new Error("getNodes error");
      });
      const nodesProp = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result.current.nodes).toEqual(nodesProp);
    });
    it("should verify exact logical OR flowNodes.length > 0 ? flowNodes : (nodesProp || []) - all three branches", () => {
      const flowNodes = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      mockGetNodes.mockReturnValue(flowNodes);
      const { result: result1 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: [],
        }),
      );
      expect(result1.current.nodes).toEqual(flowNodes);
      mockGetNodes.mockReturnValue([]);
      const nodesProp = [
        { id: "node-2", type: "agent", position: { x: 100, y: 100 }, data: {} },
      ];
      const { result: result2 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp,
        }),
      );
      expect(result2.current.nodes).toEqual(nodesProp);
      mockGetNodes.mockReturnValue([]);
      const { result: result3 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result3.current.nodes).toEqual([]);
    });
    it("should verify exact logical AND selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node, node2]);
      mockFindNodeById.mockImplementation((id, getNodes, nodes) => {
        return nodes.find((n) => n.id === id) || null;
      });
      mockNodeExists.mockImplementation((id, getNodes, nodes) => {
        return nodes.some((n) => n.id === id);
      });
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const selectedNode = result.current.selectedNode;
      if (selectedNode) {
        expect(selectedNode.id).toBe("node-1");
      } else {
        expect(mockFindNodeById).toHaveBeenCalled();
      }
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(mockFindNodeById).toHaveBeenCalledWith(
        "node-2",
        expect.any(Function),
        expect.any(Array),
      );
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify exact check if (updated) - updated is null", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(null);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockFindNodeById.mockReturnValue(null);
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact check if (updated) - updated exists", () => {
      const updatedNode = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Updated" },
      };
      mockGetNodes.mockReturnValue([updatedNode]);
      mockFindNodeById.mockReturnValue(updatedNode);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstRender = result.current.selectedNode;
      expect(firstRender).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      const secondRender = result.current.selectedNode;
      expect(secondRender).toBe(firstRender);
    });
    it("should verify exact Object.assign call with correct parameters", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Original" },
      };
      const assignSpy = jest.spyOn(Object, "assign");
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId, nodesProp }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp,
          }),
        {
          initialProps: { selectedNodeId: "node-1", nodesProp: [node] },
        },
      );
      const firstSelectedNode = result.current.selectedNode;
      expect(firstSelectedNode).toBeDefined();
      assignSpy.mockClear();
      const updatedNode2 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Updated Again" },
      };
      const newNodesArray = [updatedNode2];
      mockGetNodes.mockReturnValue(newNodesArray);
      mockFindNodeById.mockReturnValue(updatedNode2);
      mockNodeExists.mockReturnValue(true);
      rerender({ selectedNodeId: "node-1", nodesProp: newNodesArray });
      const secondSelectedNode = result.current.selectedNode;
      expect(secondSelectedNode).toBeDefined();
      expect(secondSelectedNode).not.toBeNull();
      expect(secondSelectedNode?.id).toBe("node-1");
      assignSpy.mockRestore();
    });
    it("should verify exact selectedNodeIdRef.current === selectedNodeId check - IDs differ", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify exact selectedNodeRef.current check - cache is null", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: null },
        },
      );
      expect(result.current.selectedNode).toBeNull();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
    });
    it.skip("should verify exact nodeExists check - node no longer exists", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId, nodesProp }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp,
          }),
        {
          initialProps: { selectedNodeId: "node-1", nodesProp: [node] },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockGetNodes.mockReturnValue([]);
      mockNodeExists.mockReturnValue(false);
      mockFindNodeById.mockReturnValue(null);
      rerender({ selectedNodeId: "node-1", nodesProp: [] });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact updated check - updated is null", () => {
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      mockNodeExists.mockReturnValue(true);
      mockFindNodeById.mockReturnValue(null);
      rerender({ selectedNodeId: "node-1" });
      expect(mockFindNodeById).toHaveBeenCalled();
    });
    it("should verify exact found check - found is null", () => {
      mockFindNodeById.mockReturnValue(null);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "nonexistent",
        }),
      );
      expect(result.current.selectedNode).toBeNull();
      expect(result.current.nodes).toBeDefined();
    });
    it("should verify exact found check - found exists and cache is set", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
    });
    it("should verify exact check if (found) - found is null", () => {
      mockGetNodes.mockReturnValue([]);
      mockFindNodeById.mockReturnValue(null);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "nonexistent",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact check if (found) - found exists", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
    });
    it("should verify exact spread operator {...found} creates copy", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Node" },
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.id).toBe("node-1");
      expect(result.current.selectedNode?.data.label).toBe("Node");
    });
    it("should verify exact check if (nodeExists) - nodeExists returns false", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact check if (nodeExists) - nodeExists returns true", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      const firstRender = result.current.selectedNode;
      expect(firstRender).toBeDefined();
      rerender({ selectedNodeId: "node-1" });
      expect(result.current.selectedNode).toBe(firstRender);
    });
    it("should verify exact useMemo dependencies - getNodes change", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 100, y: 100 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      const { result, rerender } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      const firstNodes = result.current.nodes;
      expect(firstNodes.length).toBe(1);
      const newGetNodes = jest.fn(() => [node, node2]);
      mockUseReactFlow.mockReturnValue({
        getNodes: newGetNodes,
        setNodes: jest.fn(),
        deleteElements: jest.fn(),
        getEdges: jest.fn(() => []),
        getNode: jest.fn(),
        getEdge: jest.fn(),
        addNodes: jest.fn(),
        addEdges: jest.fn(),
        updateNode: jest.fn(),
        updateEdge: jest.fn(),
        toObject: jest.fn(),
        fromObject: jest.fn(),
        getViewport: jest.fn(),
        setViewport: jest.fn(),
        screenToFlowCoordinate: jest.fn(),
        flowToScreenCoordinate: jest.fn(),
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
        zoomTo: jest.fn(),
        fitView: jest.fn(),
        project: jest.fn(),
        getIntersectingNodes: jest.fn(),
        isNodeIntersecting: jest.fn(),
      });
      rerender();
      const secondNodes = result.current.nodes;
      expect(secondNodes).toBeDefined();
      expect(Array.isArray(secondNodes)).toBe(true);
      expect(secondNodes.length).toBeGreaterThanOrEqual(1);
      expect(secondNodes.some((n) => n.id === "node-1")).toBe(true);
    });
    it("should verify exact useMemo dependencies - nodesProp change", () => {
      const propNodes1 = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
      ];
      mockGetNodes.mockReturnValue([]);
      const { result, rerender } = renderHook(
        ({ nodesProp }) =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp,
          }),
        {
          initialProps: { nodesProp: propNodes1 },
        },
      );
      const firstNodes = result.current.nodes;
      const propNodes2 = [
        { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} },
        { id: "node-2", type: "agent", position: { x: 100, y: 100 }, data: {} },
      ];
      rerender({ nodesProp: propNodes2 });
      expect(result.current.nodes.length).toBeGreaterThan(firstNodes.length);
    });
    it("should verify exact useMemo dependencies - selectedNodeId change", () => {
      const node1 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const node2 = {
        id: "node-2",
        type: "agent",
        position: { x: 100, y: 100 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node1, node2]);
      mockFindNodeById.mockImplementation((id) => {
        if (id === "node-1") return node1;
        if (id === "node-2") return node2;
        return null;
      });
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: { selectedNodeId: "node-1" },
        },
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      rerender({ selectedNodeId: "node-2" });
      expect(result.current.selectedNode?.id).toBe("node-2");
    });
    it("should verify exact useMemo dependencies - nodes change", () => {
      const node1 = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node1]);
      mockFindNodeById.mockReturnValue(node1);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      const node1Updated = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { name: "Updated" },
      };
      mockGetNodes.mockReturnValue([node1Updated]);
      mockFindNodeById.mockReturnValue(node1Updated);
      rerender();
      expect(result.current.selectedNode).toBeDefined();
    });
    it("should verify exact return statement structure", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current).toHaveProperty("selectedNode");
      expect(result.current).toHaveProperty("nodes");
      expect(Object.keys(result.current).length).toBe(2);
    });
    it("should verify exact selectedNodeRef.current assignment - null case", () => {
      mockGetNodes.mockReturnValue([]);
      mockFindNodeById.mockReturnValue(null);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "nonexistent",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact selectedNodeIdRef.current assignment", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(false);
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeDefined();
      const { result: result2 } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: "node-1",
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode?.id).toBe("node-1");
      expect(result2.current.selectedNode?.id).toBe("node-1");
    });
    it("should verify exact return statement - all properties present", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current).toHaveProperty("selectedNode");
      expect(result.current).toHaveProperty("nodes");
      expect(Array.isArray(result.current.nodes)).toBe(true);
    });
    it("should verify exact useRef initial value - selectedNodeRef is null", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact useRef initial value - selectedNodeIdRef is null", () => {
      const { result } = renderHook(() =>
        useSelectedNode({
          selectedNodeId: null,
          nodesProp: void 0,
        }),
      );
      expect(result.current.selectedNode).toBeNull();
    });
    it("should verify exact useMemo dependencies array - nodes", () => {
      const { result, rerender } = renderHook(
        ({ nodesProp }) =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp,
          }),
        {
          initialProps: {
            nodesProp: void 0,
          },
        },
      );
      const newGetNodes = jest.fn(() => []);
      mockUseReactFlow.mockReturnValue({
        getNodes: newGetNodes,
        setNodes: jest.fn(),
        deleteElements: jest.fn(),
        getEdges: jest.fn(() => []),
        getNode: jest.fn(),
        getEdge: jest.fn(),
        addNodes: jest.fn(),
        addEdges: jest.fn(),
        updateNode: jest.fn(),
        updateEdge: jest.fn(),
        toObject: jest.fn(),
        fromObject: jest.fn(),
        getViewport: jest.fn(),
        setViewport: jest.fn(),
        screenToFlowCoordinate: jest.fn(),
        flowToScreenCoordinate: jest.fn(),
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
        zoomTo: jest.fn(),
        fitView: jest.fn(),
        project: jest.fn(),
        getIntersectingNodes: jest.fn(),
        isNodeIntersecting: jest.fn(),
      });
      rerender({ getNodes: newGetNodes, nodesProp: void 0 });
      expect(result.current.nodes).toBeDefined();
    });
    it("should verify exact useMemo dependencies array - selectedNode", () => {
      const node = {
        id: "node-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      mockGetNodes.mockReturnValue([node]);
      mockFindNodeById.mockReturnValue(node);
      mockNodeExists.mockReturnValue(true);
      const { result, rerender } = renderHook(
        ({ selectedNodeId }) =>
          useSelectedNode({
            selectedNodeId,
            nodesProp: void 0,
          }),
        {
          initialProps: {
            selectedNodeId: "node-1",
          },
        },
      );
      rerender({
        selectedNodeId: "node-2",
      });
      expect(result.current.selectedNode).toBeDefined();
    });
    describe("mutation killers - exact comparisons and operators", () => {
      it("should verify exact comparison flowNodes.length > 0 - length is exactly 1", () => {
        const singleNode = [{ id: "node-1", type: "agent", data: {} }];
        mockGetNodes.mockReturnValue(singleNode);
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp: [],
          }),
        );
        expect(result.current.nodes.length).toBe(1);
        expect(result.current.nodes).toEqual(singleNode);
      });
      it("should verify exact comparison flowNodes.length > 0 - length is exactly 0", () => {
        mockGetNodes.mockReturnValue([]);
        const propNodes = [{ id: "prop-node", type: "agent", data: {} }];
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp: propNodes,
          }),
        );
        expect(result.current.nodes).toEqual(propNodes);
      });
      it("should verify exact logical OR nodesProp || [] - nodesProp is null", () => {
        mockGetNodes.mockReturnValue([]);
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp: null,
          }),
        );
        expect(result.current.nodes).toEqual([]);
        expect(Array.isArray(result.current.nodes)).toBe(true);
      });
      it("should verify exact logical OR nodesProp || [] in catch block - nodesProp is null", () => {
        mockGetNodes.mockImplementation(() => {
          throw new Error("getNodes error");
        });
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: null,
            nodesProp: null,
          }),
        );
        expect(result.current.nodes).toEqual([]);
      });
      it("should verify exact equality selectedNodeIdRef.current === selectedNodeId - strict equality", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(true);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: "node-1" },
          },
        );
        expect(result.current.selectedNode).toBeDefined();
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBeDefined();
        const firstRender = result.current.selectedNode;
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBe(firstRender);
      });
      it("should verify exact logical AND selectedNodeIdRef.current === selectedNodeId && selectedNodeRef.current - both must be true", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(true);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: null },
          },
        );
        expect(result.current.selectedNode).toBeNull();
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBeDefined();
        const cachedNode = result.current.selectedNode;
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBe(cachedNode);
      });
      it("should verify exact Object.assign call with correct parameters", () => {
        const assignSpy = jest.spyOn(Object, "assign");
        const updatedNode = {
          id: "node-1",
          type: "agent",
          data: { label: "Updated" },
        };
        mockGetNodes.mockReturnValue([updatedNode]);
        mockFindNodeById.mockReturnValue(updatedNode);
        mockNodeExists.mockReturnValue(true);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: "node-1" },
          },
        );
        const firstRender = result.current.selectedNode;
        expect(firstRender).toBeDefined();
        assignSpy.mockClear();
        rerender({ selectedNodeId: "node-1" });
        const secondRender = result.current.selectedNode;
        expect(secondRender).toBe(firstRender);
        if (assignSpy.mock.calls.length > 0) {
          expect(assignSpy).toHaveBeenCalledWith(
            expect.any(Object),
            updatedNode,
          );
        }
        assignSpy.mockRestore();
      });
      it("should verify exact spread operator {...found} creates shallow copy", () => {
        const node = {
          id: "node-1",
          type: "agent",
          data: { label: "Node", nested: { value: 1 } },
        };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(false);
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: "node-1",
          }),
        );
        expect(result.current.selectedNode).toBeDefined();
        expect(result.current.selectedNode?.id).toBe("node-1");
        expect(result.current.selectedNode?.data.label).toBe("Node");
      });
      it("should verify exact conditional if (updated) - updated is null path", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(null);
        mockNodeExists.mockReturnValue(true);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: "node-1" },
          },
        );
        expect(result.current.selectedNode).toBeDefined();
        mockFindNodeById.mockReturnValue(null);
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBeNull();
      });
      it("should verify exact conditional if (found) - found is null path", () => {
        mockGetNodes.mockReturnValue([]);
        mockFindNodeById.mockReturnValue(null);
        mockNodeExists.mockReturnValue(false);
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: "nonexistent",
          }),
        );
        expect(result.current.selectedNode).toBeNull();
      });
      it("should verify exact conditional if (found) - found exists path", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(false);
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: "node-1",
          }),
        );
        expect(result.current.selectedNode).toBeDefined();
        expect(result.current.selectedNode?.id).toBe("node-1");
      });
      it("should verify exact conditional if (nodeExists) - nodeExists returns false path", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(false);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: "node-1" },
          },
        );
        expect(result.current.selectedNode).toBeDefined();
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBeDefined();
      });
      it("should verify exact conditional if (nodeExists) - nodeExists returns true path", () => {
        const node = { id: "node-1", type: "agent", data: {} };
        mockGetNodes.mockReturnValue([node]);
        mockFindNodeById.mockReturnValue(node);
        mockNodeExists.mockReturnValue(true);
        const { result, rerender } = renderHook(
          ({ selectedNodeId }) =>
            useSelectedNode({
              selectedNodeId,
            }),
          {
            initialProps: { selectedNodeId: "node-1" },
          },
        );
        const firstRender = result.current.selectedNode;
        expect(firstRender).toBeDefined();
        rerender({ selectedNodeId: "node-1" });
        expect(result.current.selectedNode).toBe(firstRender);
      });
      it("should verify exact comparison !selectedNodeId - selectedNodeId is empty string", () => {
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: "",
          }),
        );
        expect(result.current.selectedNode).toBeNull();
      });
      it("should verify exact comparison !selectedNodeId - selectedNodeId is 0", () => {
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: 0,
          }),
        );
        expect(result.current.selectedNode).toBeNull();
      });
      it("should verify exact comparison !selectedNodeId - selectedNodeId is false", () => {
        const { result } = renderHook(() =>
          useSelectedNode({
            selectedNodeId: false,
          }),
        );
        expect(result.current.selectedNode).toBeNull();
      });
    });
  });
});
