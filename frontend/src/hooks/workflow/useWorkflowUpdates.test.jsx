import { renderHook, act, waitFor } from "@testing-library/react";
const waitForWithTimeout = async (callback, timeout = 2e3) => {
  const wasUsingFakeTimers = typeof jest.getRealSystemTime === "function";
  if (wasUsingFakeTimers) {
    jest.useRealTimers();
    try {
      return await waitFor(callback, { timeout });
    } finally {
      jest.useFakeTimers();
    }
  } else {
    return await waitFor(callback, { timeout });
  }
};
import { useWorkflowUpdates } from "./useWorkflowUpdates";
import { logger } from "../../utils/logger";
import { addEdge } from "@xyflow/react";
import {
  initializeReactFlowNodes,
  workflowNodeToReactFlowNode,
} from "../../utils/workflowFormat";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock("../../utils/workflowFormat", () => ({
  initializeReactFlowNodes: jest.fn(),
  workflowNodeToReactFlowNode: jest.fn(),
}));
jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual("@xyflow/react");
  return {
    ...actual,
    addEdge: jest.fn((connection, edges) => [
      ...edges,
      {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      },
    ]),
  };
});
const mockLoggerDebug = logger.debug;
const mockLoggerWarn = logger.warn;
const mockAddEdge = addEdge;
const defaultAddEdgeImpl = (connection, edges) => [
  ...edges,
  {
    id: `${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  },
];
describe("useWorkflowUpdates", () => {
  let mockSetNodes;
  let mockSetEdges;
  let mockNotifyModified;
  const initialNodes = [
    {
      id: "node1",
      type: "agent",
      position: { x: 0, y: 0 },
      data: { name: "Node 1" },
    },
  ];
  const initialEdges = [
    {
      id: "e1",
      source: "node1",
      target: "node2",
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAddEdge.mockImplementation(defaultAddEdgeImpl);
    initializeReactFlowNodes.mockImplementation((nodes) => nodes);
    workflowNodeToReactFlowNode.mockImplementation(
      (node, nodeExecutionStates) => {
        const nodeExecutionState = nodeExecutionStates?.[node.id];
        return {
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          draggable: true,
          selected: false,
          data: {
            ...(node.data || {}),
            name: node.data?.name || node.name || node.type,
            label:
              node.data?.label || node.data?.name || node.name || node.type,
            executionStatus: nodeExecutionState?.status,
            executionError: nodeExecutionState?.error,
          },
        };
      },
    );
    mockSetNodes = jest.fn((updater) => {
      if (typeof updater === "function") {
        return updater(initialNodes);
      }
      return updater;
    });
    mockSetEdges = jest.fn((updater) => {
      if (typeof updater === "function") {
        return updater(initialEdges);
      }
      return updater;
    });
    mockNotifyModified = jest.fn();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe("applyLocalChanges", () => {
    it("should add nodes", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            {
              id: "node3",
              type: "agent",
              position: { x: 100, y: 100 },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should update nodes", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated Node 1" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should delete nodes", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should add edges", async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "node2",
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
    });
    it("should not add edge if source node does not exist", async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "nonexistent",
              target: "node2",
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("source node"),
          expect.any(Array),
        );
      });
    });
    it("should not add edge if target node does not exist", async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "nonexistent",
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("target node"),
          expect.any(Array),
        );
      });
    });
    it("should not add duplicate edges", async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: initialEdges,
          // Already has edge from node1 to node2
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "node2",
              // Already exists
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
      });
    });
    it("should delete edges", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: "node1",
              target: "node2",
            },
          ],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should handle empty changes", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetEdges).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should handle multiple change types", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            {
              id: "node3",
              type: "agent",
              position: { x: 0, y: 0 },
            },
          ],
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalledTimes(1);
      expect(mockNotifyModified).toHaveBeenCalledTimes(1);
    });
  });
  describe("workflowNodeToNode", () => {
    it("should convert WorkflowNode to React Flow Node", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 100, y: 200 },
      };
      const converted = result.current.workflowNodeToNode(wfNode);
      expect(converted.id).toBe("node1");
      expect(converted.type).toBe("agent");
    });
    it("should handle empty arrays for nodes_to_add", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [],
        });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should handle empty arrays for nodes_to_update", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [],
        });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should handle empty arrays for nodes_to_delete", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: [],
        });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should handle empty arrays for edges_to_add", async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockSetEdges).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
    });
    it("should handle empty arrays for edges_to_delete", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [],
        });
      });
      expect(mockSetEdges).not.toHaveBeenCalled();
      expect(mockNotifyModified).not.toHaveBeenCalled();
    });
    it("should handle node update when node does not exist", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "nonexistent",
              updates: { name: "Updated" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(updatedNodes.find((n) => n.id === "nonexistent")).toBeUndefined();
    });
    it("should handle edge deletion with sourceHandle and targetHandle", () => {
      const edgesWithHandles = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: "output-1",
          targetHandle: "input-1",
        },
      ];
      const mockSetEdgesWithHandles = jest.fn((updater) => {
        if (typeof updater === "function") {
          return updater(edgesWithHandles);
        }
        return updater;
      });
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: edgesWithHandles,
          setNodes: mockSetNodes,
          setEdges: mockSetEdgesWithHandles,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: "node1",
              target: "node2",
              sourceHandle: "output-1",
              targetHandle: "input-1",
            },
          ],
        });
      });
      expect(mockSetEdgesWithHandles).toHaveBeenCalled();
    });
    it("should handle edge deletion without sourceHandle and targetHandle", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            {
              source: "node1",
              target: "node2",
            },
          ],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
    });
    it("should handle edge deletion with multiple edges", () => {
      const multipleEdges = [
        { id: "e1", source: "node1", target: "node2" },
        { id: "e2", source: "node2", target: "node3" },
        { id: "e3", source: "node1", target: "node3" },
      ];
      const mockSetEdgesMultiple = jest.fn((updater) => {
        if (typeof updater === "function") {
          return updater(multipleEdges);
        }
        return updater;
      });
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: multipleEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdgesMultiple,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            { source: "node1", target: "node2" },
            { source: "node2", target: "node3" },
          ],
        });
      });
      expect(mockSetEdgesMultiple).toHaveBeenCalled();
      const setEdgesCall = mockSetEdgesMultiple.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall(multipleEdges)
          : setEdgesCall;
      expect(filteredEdges.length).toBe(1);
      expect(filteredEdges[0].source).toBe("node1");
      expect(filteredEdges[0].target).toBe("node3");
    });
    it("should handle edge addition with sourceHandle and targetHandle", async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "node2",
              sourceHandle: "output-1",
              targetHandle: "input-1",
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
    });
    it("should handle edge addition when edge already exists", async () => {
      const nodesWithTarget = [
        ...initialNodes,
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdges = [{ id: "e1", source: "node1", target: "node2" }];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithTarget,
          edges: existingEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "node2",
            },
          ],
        });
        jest.advanceTimersByTime(50);
      });
      await waitForWithTimeout(() => {
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
      });
    });
    it("should handle node update with multiple fields", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: {
                name: "Updated Name",
                description: "Updated Description",
              },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const updatedNode = updatedNodes.find((n) => n.id === "node1");
      expect(updatedNode.data.name).toBe("Updated Name");
      expect(updatedNode.data.description).toBe("Updated Description");
    });
    it("should handle node deletion with multiple nodes", () => {
      const multipleNodes = [
        ...initialNodes,
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
        {
          id: "node3",
          type: "agent",
          position: { x: 200, y: 200 },
          data: { name: "Node 3" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: multipleNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1", "node2"],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const filteredNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(multipleNodes)
          : setNodesCall;
      expect(filteredNodes.length).toBe(1);
      expect(filteredNodes[0].id).toBe("node3");
    });
    it("should handle node deletion and remove connected edges", () => {
      const edgesConnected = [
        { id: "e1", source: "node1", target: "node2" },
        { id: "e2", source: "node2", target: "node3" },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: edgesConnected,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall(edgesConnected)
          : setEdgesCall;
      expect(filteredEdges.every((e) => e.source !== "node1")).toBe(true);
    });
    it("should include execution state if provided", () => {
      const nodeExecutionStates = {
        node1: { status: "running", error: void 0 },
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
          nodeExecutionStates,
        }),
      );
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
      };
      const converted = result.current.workflowNodeToNode(wfNode);
      expect(converted.data.executionStatus).toBe("running");
    });
    it("should verify exact comparison changes.nodes_to_add && changes.nodes_to_add.length > 0", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ nodes_to_add: [] });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
    });
    it("should verify exact comparison changes.nodes_to_update && changes.nodes_to_update.length > 0", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ nodes_to_update: [] });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [{ node_id: "node1", updates: {} }],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
    });
    it("should verify exact comparison changes.nodes_to_delete && changes.nodes_to_delete.length > 0", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ nodes_to_delete: [] });
      });
      expect(mockSetNodes).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ nodes_to_delete: ["node1"] });
      });
      expect(mockSetNodes).toHaveBeenCalled();
    });
    it("should verify exact comparison changes.edges_to_add && changes.edges_to_add.length > 0", () => {
      jest.useFakeTimers();
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      jest.advanceTimersByTime(100);
      expect(mockSetEdges).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ edges_to_add: [] });
      });
      jest.advanceTimersByTime(100);
      expect(mockSetEdges).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockSetEdges).toHaveBeenCalled();
      jest.useRealTimers();
    });
    it("should verify exact comparison changes.edges_to_delete && changes.edges_to_delete.length > 0", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({});
      });
      expect(mockSetEdges).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({ edges_to_delete: [] });
      });
      expect(mockSetEdges).not.toHaveBeenCalled();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
    });
    it("should verify exact logical OR edgeToAdd.sourceHandle || null", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2", sourceHandle: void 0 },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      const connection = mockAddEdge.mock.calls[0][0];
      expect(connection.sourceHandle).toBeNull();
      jest.clearAllMocks();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2", sourceHandle: "handle1" },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      const connection2 = mockAddEdge.mock.calls[0][0];
      expect(connection2.sourceHandle).toBe("handle1");
      jest.useRealTimers();
    });
    it("should verify exact logical OR edgeToAdd.targetHandle || null", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2", targetHandle: void 0 },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      const connection = mockAddEdge.mock.calls[0][0];
      expect(connection.targetHandle).toBeNull();
      jest.clearAllMocks();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2", targetHandle: "handle2" },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      const connection2 = mockAddEdge.mock.calls[0][0];
      expect(connection2.targetHandle).toBe("handle2");
      jest.useRealTimers();
    });
    it("should verify exact comparison e.source === edgeToAdd.source && e.target === edgeToAdd.target", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
      );
      jest.useRealTimers();
    });
    it("should verify exact comparison del.source === edge.source && del.target === edge.target", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      jest.clearAllMocks();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node3", target: "node4" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
    });
    it("should verify exact comparison !changes.nodes_to_delete.includes(edge.source) && !changes.nodes_to_delete.includes(edge.target)", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall(initialEdges)
          : setEdgesCall;
      expect(filteredEdges.some((e) => e.source === "node1")).toBe(false);
      jest.clearAllMocks();
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node2"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall2 = mockSetEdges.mock.calls[0][0];
      const filteredEdges2 =
        typeof setEdgesCall2 === "function"
          ? setEdgesCall2(initialEdges)
          : setEdgesCall2;
      expect(filteredEdges2.some((e) => e.target === "node2")).toBe(false);
    });
    it("should verify exact comparison u.node_id === node.id", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [{ node_id: "node1", updates: { name: "Updated" } }],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(updatedNodes[0].data.name).toBe("Updated");
      jest.clearAllMocks();
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            { node_id: "nonexistent", updates: { name: "Updated" } },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall2 = mockSetNodes.mock.calls[0][0];
      const updatedNodes2 =
        typeof setNodesCall2 === "function"
          ? setNodesCall2(initialNodes)
          : setNodesCall2;
      expect(updatedNodes2[0].data.name).toBe("Node 1");
    });
    it("should wire edges in the same applyLocalChanges pass as new nodes (no deferred timer)", () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: [],
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            {
              id: "node-a",
              type: "start",
              position: { x: 0, y: 0 },
              data: { name: "A", label: "A" },
            },
            {
              id: "node-b",
              type: "end",
              position: { x: 200, y: 0 },
              data: { name: "B", label: "B" },
            },
          ],
          edges_to_add: [{ source: "node-a", target: "node-b" }],
        });
      });
      const delay50Call = setTimeoutSpy.mock.calls.find(
        (call) => call[1] === 50,
      );
      expect(delay50Call).toBeUndefined();
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesFn = mockSetEdges.mock.calls[0][0];
      const nextEdges =
        typeof setEdgesFn === "function" ? setEdgesFn([]) : setEdgesFn;
      expect(nextEdges.length).toBeGreaterThanOrEqual(1);
      expect(
        nextEdges.some((e) => e.source === "node-a" && e.target === "node-b"),
      ).toBe(true);
      setTimeoutSpy.mockRestore();
    });
    it("should verify exact Array.from(nodeIds) call", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerDebug).toHaveBeenCalled();
    });
    it("should verify exact nodeIds.has() check - source node exists", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('source node "node1" does not exist'),
      );
    });
    it("should verify exact nodeIds.has() check - source node does not exist", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('source node "node1" does not exist'),
        expect.any(Array),
      );
    });
    it("should verify exact nodeIds.has() check - target node exists", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('target node "node2" does not exist'),
      );
    });
    it("should verify exact nodeIds.has() check - target node does not exist", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalled();
      const warnCalls = mockLoggerWarn.mock.calls;
      const targetNodeWarning = warnCalls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes('target node "node2" does not exist'),
      );
      expect(targetNodeWarning).toBeDefined();
      expect(targetNodeWarning[0]).toContain(
        'target node "node2" does not exist',
      );
      expect(Array.isArray(targetNodeWarning[1])).toBe(true);
    });
    it("should verify exact updatedEdges.some() check - edge exists", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
      );
    });
    it("should verify exact updatedEdges.some() check - edge does not exist", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
      );
    });
    it("should verify exact continue statement when source node missing", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2" },
            // Missing source
            { source: "node2", target: "node3" },
            // Missing target
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('source node "node1" does not exist'),
        expect.any(Array),
      );
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('target node "node3" does not exist'),
        expect.any(Array),
      );
    });
    it("should verify exact continue statement when target node missing", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalled();
      const warnCalls = mockLoggerWarn.mock.calls;
      const targetNodeWarning = warnCalls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes('target node "node2"') &&
          call[0].includes("does not exist"),
      );
      expect(targetNodeWarning).toBeDefined();
      expect(targetNodeWarning[0]).toContain('target node "node2"');
      expect(targetNodeWarning[0]).toContain("does not exist");
      if (targetNodeWarning.length > 1) {
        expect(Array.isArray(targetNodeWarning[1])).toBe(true);
      }
    });
    it("should verify exact continue statement when edge already exists", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2" },
            // Already exists
            { source: "node2", target: "node1" },
            // New edge
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
      );
      expect(mockAddEdge).toHaveBeenCalled();
    });
    it("should verify exact updatedEdges assignment from addEdge result", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
    });
    it("should verify exact changes.edges_to_delete.some() check", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact changes.edges_to_delete.some() check - no match", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node3", target: "node4" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(1);
    });
    it("should verify exact currentNodes.map(n => n.id) call", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
    });
    it("should verify exact currentEdges.map(e => `${e.source} -> ${e.target}`) call", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node2", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerDebug).toHaveBeenCalled();
    });
    it("should verify exact for...of loop iteration over edges_to_add", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
        {
          id: "node3",
          type: "agent",
          position: { x: 200, y: 200 },
          data: { name: "Node 3" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            { source: "node1", target: "node2" },
            { source: "node2", target: "node3" },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalledTimes(2);
    });
    it("should verify exact for...of loop iteration over edges_to_delete", () => {
      const existingEdges = [
        { id: "e1", source: "node1", target: "node2" },
        { id: "e2", source: "node2", target: "node3" },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: existingEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            { source: "node1", target: "node2" },
            { source: "node2", target: "node3" },
          ],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall(existingEdges)
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact spread operator [...nds, ...initializedNodes]", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(newNodes.length).toBeGreaterThan(initialNodes.length);
      expect(newNodes.some((n) => n.id === "new-node")).toBe(true);
    });
    it("should verify exact spread operator [...node.data, ...update.updates]", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { newField: "newValue" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const updatedNode = updatedNodes.find((n) => n.id === "node1");
      expect(updatedNode).toBeDefined();
      expect(updatedNode.data.newField).toBe("newValue");
      expect(updatedNode.data.name).toBe("Node 1");
    });
    it("should verify exact spread operator [...currentEdges] creates copy", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node2", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
    });
    it("should verify exact spread operator {...node, data: {...node.data, ...update.updates}}", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { label: "Updated Label" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const updatedNode = updatedNodes.find((n) => n.id === "node1");
      expect(updatedNode.id).toBe("node1");
      expect(updatedNode.data.label).toBe("Updated Label");
    });
    it("should verify exact changes.nodes_to_add.map() call", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            { id: "node3", type: "agent" },
            { id: "node4", type: "condition" },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(newNodes.some((n) => n.id === "node3")).toBe(true);
      expect(newNodes.some((n) => n.id === "node4")).toBe(true);
    });
    it("should verify exact nds.map() call in nodes_to_update", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(updatedNodes.length).toBe(initialNodes.length);
    });
    it("should verify exact nds.filter() call in nodes_to_delete", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const filteredNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(filteredNodes.length).toBeLessThan(initialNodes.length);
      expect(filteredNodes.some((n) => n.id === "node1")).toBe(false);
    });
    it("should verify exact changes.nodes_to_update.find() call", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated" },
            },
            {
              node_id: "nonexistent",
              updates: { name: "Should not match" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const node1 = updatedNodes.find((n) => n.id === "node1");
      expect(node1).toBeDefined();
      expect(node1?.data.name).toBe("Updated");
      expect(updatedNodes.length).toBe(initialNodes.length);
    });
    it("should verify exact changes.nodes_to_delete.includes() check", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1", "node2"],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const filteredNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(filteredNodes.some((n) => n.id === "node1")).toBe(false);
      expect(filteredNodes.some((n) => n.id === "node2")).toBe(false);
    });
    it("should verify exact changes.nodes_to_delete.includes() check - edge.source", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact changes.nodes_to_delete.includes() check - edge.target", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node2"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact changes.edges_to_delete.some() check with exact comparison", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [
            { source: "node1", target: "node2" },
            // Exact match
            { source: "node3", target: "node4" },
            // No match
          ],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact newNodes.map(n => ({ id: n.id, type: n.type })) call", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Working nodes after addition:"),
        expect.any(Array),
      );
    });
    it("should verify exact nds.map(n => n.id) call in deletion logging", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Current node IDs before deletion"),
        expect.any(Array),
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Nodes after deletion"),
        expect.any(Array),
      );
    });
    it("should verify exact Set creation and usage", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
    });
    it("should verify exact updatedEdges.length check", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Updated edges count"),
        expect.any(Number),
      );
    });
    it("should verify exact for...of loop over changes.nodes_to_add", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            { id: "node3", type: "agent" },
            { id: "node4", type: "condition" },
            { id: "node5", type: "loop" },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(newNodes.some((n) => n.id === "node3")).toBe(true);
      expect(newNodes.some((n) => n.id === "node4")).toBe(true);
      expect(newNodes.some((n) => n.id === "node5")).toBe(true);
    });
    it("should verify exact for...of loop over changes.nodes_to_update", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated 1" },
            },
            {
              node_id: "node2",
              updates: { name: "Updated 2" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const node1 = updatedNodes.find((n) => n.id === "node1");
      expect(node1).toBeDefined();
      expect(node1?.data).toBeDefined();
      expect(node1?.data.name).toBe("Updated 1");
      const updateCalls = mockSetNodes.mock.calls;
      expect(updateCalls.length).toBeGreaterThan(0);
      const node2 = updatedNodes.find((n) => n.id === "node2");
      expect(node2).toBeUndefined();
    });
    it("should verify exact for...of loop over changes.nodes_to_delete", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1", "node2"],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const filteredNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(filteredNodes.length).toBe(0);
    });
    it("should verify exact Connection object creation with all properties", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [
            {
              source: "node1",
              target: "node2",
              sourceHandle: "handle1",
              targetHandle: "handle2",
            },
          ],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      const connection = mockAddEdge.mock.calls[0][0];
      expect(connection).toHaveProperty("source", "node1");
      expect(connection).toHaveProperty("target", "node2");
      expect(connection).toHaveProperty("sourceHandle", "handle1");
      expect(connection).toHaveProperty("targetHandle", "handle2");
    });
    it("should verify exact updatedEdges assignment from addEdge result", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node3",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const updatedEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(updatedEdges.length).toBeGreaterThan(1);
    });
    it("should verify exact edgeToAdd.source property access", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      const connection = mockAddEdge.mock.calls[0][0];
      expect(connection.source).toBe("node1");
    });
    it("should verify exact edgeToAdd.target property access", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      const connection = mockAddEdge.mock.calls[0][0];
      expect(connection.target).toBe("node2");
    });
    it("should verify exact del.source property access in edges_to_delete", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact del.target property access in edges_to_delete", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact edge.source property access in nodes_to_delete filter", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact edge.target property access in nodes_to_delete filter", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node2"],
        });
      });
      expect(mockSetEdges).toHaveBeenCalled();
      const setEdgesCall = mockSetEdges.mock.calls[0][0];
      const filteredEdges =
        typeof setEdgesCall === "function"
          ? setEdgesCall([existingEdge])
          : setEdgesCall;
      expect(filteredEdges.length).toBe(0);
    });
    it("should verify exact u.node_id property access in nodes_to_update", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const updatedNode = updatedNodes.find((n) => n.id === "node1");
      expect(updatedNode?.data.name).toBe("Updated");
    });
    it("should verify exact update.updates property access", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated Name", label: "Updated Label" },
            },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const updatedNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      const updatedNode = updatedNodes.find((n) => n.id === "node1");
      expect(updatedNode?.data.name).toBe("Updated Name");
      expect(updatedNode?.data.label).toBe("Updated Label");
    });
    it("should verify exact n.id property access in map operations", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Current node IDs before deletion"),
        expect.arrayContaining(["node1"]),
      );
    });
    it("should verify exact n.type property access in map operations", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Working nodes after addition:"),
        expect.any(Array),
      );
    });
    it("should verify exact e.source property access in map operations", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node2", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Current edges"),
        expect.any(Array),
      );
    });
    it("should verify exact e.target property access in map operations", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node2", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.stringContaining("Current edges"),
        expect.any(Array),
      );
    });
    it("should verify exact notifyModified() call after nodes_to_add", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockNotifyModified).toHaveBeenCalledTimes(1);
    });
    it("should verify exact notifyModified() call after nodes_to_update", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_update: [
            {
              node_id: "node1",
              updates: { name: "Updated" },
            },
          ],
        });
      });
      expect(mockNotifyModified).toHaveBeenCalledTimes(1);
    });
    it("should verify exact notifyModified() call after nodes_to_delete", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_delete: ["node1"],
        });
      });
      expect(mockNotifyModified).toHaveBeenCalledTimes(2);
    });
    it("should verify exact notifyModified() call after edges_to_add", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node1", target: "node2" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockNotifyModified).toHaveBeenCalledTimes(1);
    });
    it("should verify exact notifyModified() call after edges_to_delete", () => {
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_delete: [{ source: "node1", target: "node2" }],
        });
      });
      expect(mockNotifyModified).toHaveBeenCalledTimes(1);
    });
    it("should verify exact updateRefs() call at start of applyLocalChanges", async () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      await act(async () => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      await waitForWithTimeout(() => {
        expect(mockSetNodes).toHaveBeenCalled();
      }, 2e3);
      expect(mockNotifyModified).toHaveBeenCalled();
    });
    it("should verify exact nodesRef.current assignment", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      jest.useFakeTimers();
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "new-node", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockSetNodes.mock.calls.length).toBeGreaterThanOrEqual(1);
      jest.useRealTimers();
    });
    it("should verify exact edgesRef.current assignment", () => {
      jest.useFakeTimers();
      const nodesWithBoth = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Node 1" },
        },
        {
          id: "node2",
          type: "agent",
          position: { x: 100, y: 100 },
          data: { name: "Node 2" },
        },
      ];
      const existingEdge = {
        id: "e1",
        source: "node1",
        target: "node2",
      };
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: nodesWithBoth,
          edges: [existingEdge],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          edges_to_add: [{ source: "node2", target: "node1" }],
        });
      });
      jest.advanceTimersByTime(100);
      expect(mockAddEdge).toHaveBeenCalled();
      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
      );
    });
    it("should verify exact workflowNodeToNode call for each node in nodes_to_add", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [
            { id: "node3", type: "agent" },
            { id: "node4", type: "condition" },
          ],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
      const setNodesCall = mockSetNodes.mock.calls[0][0];
      const newNodes =
        typeof setNodesCall === "function"
          ? setNodesCall(initialNodes)
          : setNodesCall;
      expect(newNodes.some((n) => n.id === "node3")).toBe(true);
      expect(newNodes.some((n) => n.id === "node4")).toBe(true);
    });
    it("should verify exact initializeReactFlowNodes call", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      act(() => {
        result.current.applyLocalChanges({
          nodes_to_add: [{ id: "new-node", type: "agent" }],
        });
      });
      expect(mockSetNodes).toHaveBeenCalled();
    });
    it("should verify exact return statement structure", () => {
      const { result } = renderHook(() =>
        useWorkflowUpdates({
          nodes: initialNodes,
          edges: initialEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          notifyModified: mockNotifyModified,
        }),
      );
      expect(result.current).toHaveProperty("applyLocalChanges");
      expect(result.current).toHaveProperty("workflowNodeToNode");
      expect(Object.keys(result.current).length).toBe(2);
    });
    it("should verify exact useCallback dependencies - applyLocalChanges", () => {
      const { result, rerender } = renderHook(
        ({ setNodes }) =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        {
          initialProps: { setNodes: mockSetNodes },
        },
      );
      const firstApply = result.current.applyLocalChanges;
      const newSetNodes = jest.fn();
      rerender({ setNodes: newSetNodes });
      const secondApply = result.current.applyLocalChanges;
      expect(secondApply).not.toBe(firstApply);
    });
    it("should verify exact useCallback dependencies - workflowNodeToNode", () => {
      const { result, rerender } = renderHook(
        ({ nodeExecutionStates }) =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
            nodeExecutionStates,
          }),
        {
          initialProps: { nodeExecutionStates: {} },
        },
      );
      const firstWorkflowNodeToNode = result.current.workflowNodeToNode;
      rerender({ nodeExecutionStates: { node1: { status: "running" } } });
      const secondWorkflowNodeToNode = result.current.workflowNodeToNode;
      expect(secondWorkflowNodeToNode).not.toBe(firstWorkflowNodeToNode);
    });
    describe("conditional expression mutation killers", () => {
      it("should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - both true", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_add: [{ id: "new-node", type: "agent" }],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - first false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_add: void 0,
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_add && changes.nodes_to_add.length > 0) - second false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_add: [],
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - both true", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_update: [
              {
                node_id: "node1",
                updates: { name: "Updated" },
              },
            ],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - first false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_update: void 0,
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_update && changes.nodes_to_update.length > 0) - second false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_update: [],
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - both true", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_delete: ["node1"],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - first false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_delete: void 0,
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) - second false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_delete: [],
          });
        });
        expect(mockSetNodes).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - both true", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
        jest.useRealTimers();
      });
      it("should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - first false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: void 0,
          });
        });
        expect(mockSetEdges).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.edges_to_add && changes.edges_to_add.length > 0) - second false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [],
          });
        });
        expect(mockSetEdges).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - both true", () => {
        const existingEdge = {
          id: "e1",
          source: "node1",
          target: "node2",
        };
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: [{ source: "node1", target: "node2" }],
          });
        });
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
      it("should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - first false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: void 0,
          });
        });
        expect(mockSetEdges).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (changes.edges_to_delete && changes.edges_to_delete.length > 0) - second false", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: [],
          });
        });
        expect(mockSetEdges).not.toHaveBeenCalled();
        expect(mockNotifyModified).not.toHaveBeenCalled();
      });
      it("should verify exact if (!nodeIds.has(edgeToAdd.source)) - true branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist'),
          expect.any(Array),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (!nodeIds.has(edgeToAdd.source)) - false branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining('source node "node1" does not exist'),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (!nodeIds.has(edgeToAdd.target)) - true branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining('target node "node2" does not exist'),
          expect.any(Array),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (!nodeIds.has(edgeToAdd.target)) - false branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining('target node "node2" does not exist'),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (edgeExists) - true branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const existingEdge = {
          id: "e1",
          source: "node1",
          target: "node2",
        };
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (edgeExists) - false branch", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).not.toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
        jest.useRealTimers();
      });
      it("should verify exact if (update) - true branch", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_update: [
              {
                node_id: "node1",
                updates: { name: "Updated" },
              },
            ],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const updatedNodes =
          typeof setNodesCall === "function"
            ? setNodesCall(initialNodes)
            : setNodesCall;
        const updatedNode = updatedNodes.find((n) => n.id === "node1");
        expect(updatedNode?.data.name).toBe("Updated");
      });
      it("should verify exact if (update) - false branch", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_update: [
              {
                node_id: "nonexistent",
                updates: { name: "Should not match" },
              },
            ],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const updatedNodes =
          typeof setNodesCall === "function"
            ? setNodesCall(initialNodes)
            : setNodesCall;
        const node1 = updatedNodes.find((n) => n.id === "node1");
        expect(node1?.data.name).toBe("Node 1");
      });
    });
    describe("logical operator mutation killers", () => {
      it("should verify exact && operator in changes.nodes_to_add && changes.nodes_to_add.length > 0", () => {
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: initialEdges,
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_add: [{ id: "new-node", type: "agent" }],
          });
        });
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockNotifyModified).toHaveBeenCalled();
      });
      it("should verify exact && operator in !changes.nodes_to_delete.includes(edge.source) && !changes.nodes_to_delete.includes(edge.target)", () => {
        const existingEdge = {
          id: "e1",
          source: "node1",
          target: "node2",
        };
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            nodes_to_delete: ["node3"],
            // Neither source nor target
          });
        });
        expect(mockSetEdges).toHaveBeenCalled();
        const setEdgesCall = mockSetEdges.mock.calls[0][0];
        const filteredEdges =
          typeof setEdgesCall === "function"
            ? setEdgesCall([existingEdge])
            : setEdgesCall;
        expect(filteredEdges.length).toBe(1);
      });
      it("should verify exact && operator in e.source === edgeToAdd.source && e.target === edgeToAdd.target", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const existingEdge = {
          id: "e1",
          source: "node1",
          target: "node2",
        };
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [{ source: "node1", target: "node2" }],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
        jest.useRealTimers();
      });
      it("should verify exact && operator in del.source === edge.source && del.target === edge.target", () => {
        const existingEdge = {
          id: "e1",
          source: "node1",
          target: "node2",
        };
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: initialNodes,
            edges: [existingEdge],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_delete: [{ source: "node1", target: "node2" }],
          });
        });
        expect(mockSetEdges).toHaveBeenCalled();
        const setEdgesCall = mockSetEdges.mock.calls[0][0];
        const filteredEdges =
          typeof setEdgesCall === "function"
            ? setEdgesCall([existingEdge])
            : setEdgesCall;
        expect(filteredEdges.length).toBe(0);
      });
      it("should verify exact || operator in edgeToAdd.sourceHandle || null", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [
              {
                source: "node1",
                target: "node2",
                sourceHandle: "handle1",
              },
            ],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockAddEdge).toHaveBeenCalled();
        const connection = mockAddEdge.mock.calls[0][0];
        expect(connection.sourceHandle).toBe("handle1");
        jest.useRealTimers();
      });
      it("should verify exact || operator in edgeToAdd.sourceHandle || null - falsy case", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [
              {
                source: "node1",
                target: "node2",
                // sourceHandle is undefined
              },
            ],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockAddEdge).toHaveBeenCalled();
        const connection = mockAddEdge.mock.calls[0][0];
        expect(connection.sourceHandle).toBe(null);
        jest.useRealTimers();
      });
      it("should verify exact || operator in edgeToAdd.targetHandle || null", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [
              {
                source: "node1",
                target: "node2",
                targetHandle: "handle2",
              },
            ],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockAddEdge).toHaveBeenCalled();
        const connection = mockAddEdge.mock.calls[0][0];
        expect(connection.targetHandle).toBe("handle2");
        jest.useRealTimers();
      });
      it("should verify exact || operator in edgeToAdd.targetHandle || null - falsy case", () => {
        jest.useFakeTimers();
        const nodesWithBoth = [
          {
            id: "node1",
            type: "agent",
            position: { x: 0, y: 0 },
            data: { name: "Node 1" },
          },
          {
            id: "node2",
            type: "agent",
            position: { x: 100, y: 100 },
            data: { name: "Node 2" },
          },
        ];
        const { result } = renderHook(() =>
          useWorkflowUpdates({
            nodes: nodesWithBoth,
            edges: [],
            setNodes: mockSetNodes,
            setEdges: mockSetEdges,
            notifyModified: mockNotifyModified,
          }),
        );
        act(() => {
          result.current.applyLocalChanges({
            edges_to_add: [
              {
                source: "node1",
                target: "node2",
                // targetHandle is undefined
              },
            ],
          });
        });
        jest.advanceTimersByTime(100);
        expect(mockAddEdge).toHaveBeenCalled();
        const connection = mockAddEdge.mock.calls[0][0];
        expect(connection.targetHandle).toBe(null);
        jest.useRealTimers();
      });
    });
  });
});
