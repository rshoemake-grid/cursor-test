function isValidNodeId(nodeId) {
  if (nodeId === null) {
    return false;
  }
  if (nodeId === void 0) {
    return false;
  }
  if (nodeId === "") {
    return false;
  }
  return true;
}
function hasValidCache(cachedId, currentId, cachedNode) {
  if (cachedId !== currentId) {
    return false;
  }
  if (cachedNode === null) {
    return false;
  }
  if (cachedNode === void 0) {
    return false;
  }
  return true;
}
function nodeExistsAndValid(node) {
  if (node === null) {
    return false;
  }
  if (node === void 0) {
    return false;
  }
  return true;
}
export { hasValidCache, isValidNodeId, nodeExistsAndValid };
