import { useMemo, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { findNodeById, nodeExists as checkNodeExists } from "../../utils/nodeUtils";
import { logicalOrToEmptyArray } from "../utils/logicalOr";
import { isValidNodeId, hasValidCache, nodeExistsAndValid as isValidNode } from "../utils/nodeValidation";
import { updateNodeCacheRefs, clearNodeCache, syncCacheData } from "../utils/nodeCache";
function useSelectedNode({
  selectedNodeId,
  nodesProp
}) {
  const { getNodes } = useReactFlow();
  const selectedNodeRef = useRef(null);
  const selectedNodeIdRef = useRef(null);
  const nodes = useMemo(() => {
    try {
      const flowNodes = getNodes();
      return flowNodes.length > 0 ? flowNodes : logicalOrToEmptyArray(nodesProp);
    } catch {
      return logicalOrToEmptyArray(nodesProp);
    }
  }, [getNodes, nodesProp]);
  const selectedNode = useMemo(() => {
    if (!isValidNodeId(selectedNodeId)) {
      clearNodeCache(selectedNodeRef, selectedNodeIdRef);
      return null;
    }
    if (hasValidCache(selectedNodeIdRef.current, selectedNodeId, selectedNodeRef.current)) {
      if (checkNodeExists(selectedNodeId, getNodes, nodes)) {
        const updated = findNodeById(selectedNodeId, getNodes, nodes);
        if (isValidNode(updated)) {
          syncCacheData(selectedNodeRef, updated);
          return selectedNodeRef.current;
        }
      }
    }
    const found = findNodeById(selectedNodeId, getNodes, nodes);
    updateNodeCacheRefs(selectedNodeRef, selectedNodeIdRef, found, selectedNodeId);
    return found;
  }, [selectedNodeId, getNodes, nodes]);
  return {
    selectedNode,
    nodes
  };
}
export {
  useSelectedNode
};
