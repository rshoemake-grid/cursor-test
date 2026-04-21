/**
 * Builds pasted node/edge lists from a clipboard snapshot, remapping IDs and
 * positioning the group so the top-left of the selection's bounding box aligns
 * to `flowPosition`, or falls back to offset (+50,+50) from original positions.
 *
 * @param {{ nodes: object[], edges: object[] }} clipboard
 * @param {{ x: number, y: number } | null} flowPosition flow space, or null for keyboard paste
 */
function buildPastedGraph(clipboard, flowPosition) {
  const srcNodes = clipboard?.nodes ?? [];
  if (srcNodes.length === 0) {
    return { newNodes: [], newEdges: [] };
  }
  const srcEdges = clipboard?.edges ?? [];
  const minX = Math.min(...srcNodes.map((n) => n.position.x));
  const minY = Math.min(...srcNodes.map((n) => n.position.y));
  const now = Date.now();
  const idMap = new Map();
  const anchor =
    flowPosition != null
      ? { x: flowPosition.x, y: flowPosition.y }
      : { x: minX + 50, y: minY + 50 };

  srcNodes.forEach((node, i) => {
    const base = node.type || "node";
    idMap.set(node.id, `${base}_${now}_${i}`);
  });

  const newNodes = srcNodes.map((node) => ({
    ...node,
    id: idMap.get(node.id),
    position: {
      x: node.position.x - minX + anchor.x,
      y: node.position.y - minY + anchor.y,
    },
    selected: false,
  }));

  const newEdges = srcEdges.map((edge, i) => ({
    ...edge,
    id: `edge_${now}_${i}`,
    source: idMap.get(edge.source),
    target: idMap.get(edge.target),
    selected: false,
  }));

  return { newNodes, newEdges };
}

function normalizeCopyPayload(payload) {
  if (payload && Array.isArray(payload.nodes)) {
    return {
      nodes: payload.nodes,
      edges: payload.edges || [],
    };
  }
  if (payload) {
    return {
      nodes: [payload],
      edges: [],
    };
  }
  return { nodes: [], edges: [] };
}

export { buildPastedGraph, normalizeCopyPayload };
