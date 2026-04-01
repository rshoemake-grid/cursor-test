import { useState, useCallback } from "react";
function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        nodeId: node.id,
        node,
        x: event.clientX,
        y: event.clientY
      });
    },
    []
  );
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY
      });
    },
    []
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  return {
    contextMenu,
    setContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    closeContextMenu
  };
}
export {
  useContextMenu
};
