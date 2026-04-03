import { nodeExistsAndValid } from "./nodeValidation";
function updateNodeCache(node, nodeId) {
  if (nodeExistsAndValid(node) && node !== null && node !== void 0) {
    const nodeCopy = {
      ...node,
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    };
    return {
      cached: nodeCopy,
      idCached: nodeId,
    };
  } else {
    return {
      cached: null,
      idCached: null,
    };
  }
}
function updateCachedNodeData(cachedNode, updatedNode) {
  if (
    !nodeExistsAndValid(cachedNode) ||
    cachedNode === null ||
    cachedNode === void 0
  ) {
    return false;
  }
  if (
    !nodeExistsAndValid(updatedNode) ||
    updatedNode === null ||
    updatedNode === void 0
  ) {
    return false;
  }
  Object.assign(cachedNode, updatedNode);
  return true;
}
function clearNodeCache(nodeRef, idRef) {
  nodeRef.current = null;
  idRef.current = null;
}
function syncCacheData(nodeRef, updatedNode) {
  if (nodeExistsAndValid(nodeRef.current) && nodeExistsAndValid(updatedNode)) {
    Object.assign(nodeRef.current, updatedNode);
  }
}
function updateNodeCacheRefs(nodeRef, idRef, node, nodeId) {
  const result = updateNodeCache(node, nodeId);
  nodeRef.current = result.cached;
  idRef.current = result.idCached;
}
export {
  clearNodeCache,
  syncCacheData,
  updateCachedNodeData,
  updateNodeCache,
  updateNodeCacheRefs,
};
