import { useState, useCallback } from "react";
function useNodeSelection({ reactFlowInstanceRef, notifyModified }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState(
    new Set(),
  );
  const handleNodesChange = useCallback(
    (changes, onNodesChangeBase) => {
      onNodesChangeBase(changes);
      const reactFlowInstance = reactFlowInstanceRef.current;
      if (reactFlowInstance) {
        const allSelectedNodes = reactFlowInstance
          .getNodes()
          .filter((n) => n.selected);
        const allSelectedIds = new Set(allSelectedNodes.map((n) => n.id));
        setSelectedNodeIds(allSelectedIds);
        if (allSelectedIds.size === 0) {
          setSelectedNodeId(null);
        } else if (allSelectedIds.size === 1) {
          const singleId = Array.from(allSelectedIds)[0];
          setSelectedNodeId(singleId);
        } else {
          setSelectedNodeId(null);
        }
      }
      const hasActualChange = changes.some(
        (change) =>
          change.type === "position" ||
          change.type === "dimensions" ||
          change.type === "add" ||
          change.type === "remove" ||
          change.type === "reset",
      );
      if (hasActualChange) {
        notifyModified();
      }
    },
    [reactFlowInstanceRef, notifyModified],
  );
  return {
    selectedNodeId,
    setSelectedNodeId,
    selectedNodeIds,
    setSelectedNodeIds,
    handleNodesChange,
  };
}
export { useNodeSelection };
