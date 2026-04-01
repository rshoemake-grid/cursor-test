function findNodeById(nodeId, getNodes, fallbackNodes) {
  try {
    const flowNodes = getNodes();
    const found = flowNodes.find((n) => n.id === nodeId);
    return found !== null && found !== void 0 ? found : null;
  } catch {
    const found = fallbackNodes?.find((n) => n.id === nodeId);
    return found !== null && found !== void 0 ? found : null;
  }
}
function nodeExists(nodeId, getNodes, fallbackNodes) {
  return findNodeById(nodeId, getNodes, fallbackNodes) !== null;
}
function findNodesByIds(nodeIds, getNodes, fallbackNodes) {
  try {
    const flowNodes = getNodes();
    return flowNodes.filter((n) => nodeIds.includes(n.id));
  } catch {
    const nodes = fallbackNodes !== null && fallbackNodes !== void 0 ? fallbackNodes : [];
    return nodes.filter((n) => nodeIds.includes(n.id));
  }
}
function getSelectedNodes(getNodes, fallbackNodes) {
  try {
    const flowNodes = getNodes();
    return flowNodes.filter((n) => n.selected);
  } catch {
    const nodes = fallbackNodes !== null && fallbackNodes !== void 0 ? fallbackNodes : [];
    return nodes.filter((n) => n.selected);
  }
}
export {
  findNodeById,
  findNodesByIds,
  getSelectedNodes,
  nodeExists
};
