import { useCallback, useRef } from "react";
import { logger } from "../../utils/logger";
import { addEdge } from "@xyflow/react";
import { initializeReactFlowNodes, workflowNodeToReactFlowNode } from "../../utils/workflowFormat";
import { logicalOrToNull } from "../utils/logicalOr";
function useWorkflowUpdates({
  nodes,
  edges,
  setNodes,
  setEdges,
  notifyModified,
  nodeExecutionStates = {}
}) {
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const updateRefs = useCallback(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);
  const workflowNodeToNode = useCallback((wfNode) => {
    return workflowNodeToReactFlowNode(wfNode, nodeExecutionStates);
  }, [nodeExecutionStates]);
  const applyLocalChanges = useCallback((changes) => {
    updateRefs();
    if (changes.nodes_to_add && changes.nodes_to_add.length > 0) {
      logger.debug("Adding nodes:", changes.nodes_to_add);
      setNodes((nds) => {
        const convertedNodes = changes.nodes_to_add.map((n) => workflowNodeToNode(n));
        const initializedNodes = initializeReactFlowNodes(convertedNodes);
        const newNodes = [...nds, ...initializedNodes];
        logger.debug("New nodes after addition:", newNodes.map((n) => ({ id: n.id, type: n.type })));
        return newNodes;
      });
      notifyModified();
    }
    if (changes.nodes_to_update && changes.nodes_to_update.length > 0) {
      setNodes(
        (nds) => nds.map((node) => {
          const update = changes.nodes_to_update.find((u) => u.node_id === node.id);
          if (update) {
            return {
              ...node,
              data: {
                ...node.data,
                ...update.updates
              }
            };
          }
          return node;
        })
      );
      notifyModified();
    }
    if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) {
      logger.debug("Deleting nodes:", changes.nodes_to_delete);
      setNodes((nds) => {
        logger.debug("Current node IDs before deletion:", nds.map((n) => n.id));
        const filtered = nds.filter((node) => !changes.nodes_to_delete.includes(node.id));
        logger.debug("Nodes after deletion:", filtered.map((n) => n.id));
        return filtered;
      });
      setEdges(
        (eds) => eds.filter(
          (edge) => !changes.nodes_to_delete.includes(edge.source) && !changes.nodes_to_delete.includes(edge.target)
        )
      );
      notifyModified();
    }
    if (changes.edges_to_add && changes.edges_to_add.length > 0) {
      setTimeout(() => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const nodeIds = new Set(currentNodes.map((n) => n.id));
        logger.debug("Adding edges:", changes.edges_to_add);
        logger.debug("Current nodes:", Array.from(nodeIds));
        logger.debug("Current edges:", currentEdges.map((e) => `${e.source} -> ${e.target}`));
        let updatedEdges = [...currentEdges];
        for (const edgeToAdd of changes.edges_to_add) {
          if (!nodeIds.has(edgeToAdd.source)) {
            logger.warn(`Cannot connect edge: source node "${edgeToAdd.source}" does not exist. Available nodes:`, Array.from(nodeIds));
            continue;
          }
          if (!nodeIds.has(edgeToAdd.target)) {
            logger.warn(`Cannot connect edge: target node "${edgeToAdd.target}" does not exist. Available nodes:`, Array.from(nodeIds));
            continue;
          }
          const edgeExists = updatedEdges.some(
            (e) => e.source === edgeToAdd.source && e.target === edgeToAdd.target
          );
          if (edgeExists) {
            logger.warn(`Edge from "${edgeToAdd.source}" to "${edgeToAdd.target}" already exists`);
            continue;
          }
          const connection = {
            source: edgeToAdd.source,
            target: edgeToAdd.target,
            sourceHandle: logicalOrToNull(edgeToAdd.sourceHandle),
            targetHandle: logicalOrToNull(edgeToAdd.targetHandle)
          };
          logger.debug("Adding connection:", connection);
          updatedEdges = addEdge(connection, updatedEdges);
          logger.debug("Updated edges count:", updatedEdges.length);
        }
        setEdges(updatedEdges);
        notifyModified();
      }, 50);
    }
    if (changes.edges_to_delete && changes.edges_to_delete.length > 0) {
      setEdges(
        (eds) => eds.filter(
          (edge) => !changes.edges_to_delete.some(
            (del) => del.source === edge.source && del.target === edge.target
          )
        )
      );
      notifyModified();
    }
  }, [setNodes, setEdges, notifyModified, workflowNodeToNode, updateRefs]);
  return {
    applyLocalChanges,
    workflowNodeToNode
  };
}
export {
  useWorkflowUpdates
};
