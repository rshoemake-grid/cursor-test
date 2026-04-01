import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  isInputElement,
  matchesKeyCombination,
  isDeleteKey
} from "./useKeyboardShortcuts.utils";
function useKeyboardShortcuts({
  selectedNodeId,
  setSelectedNodeId,
  notifyModified,
  clipboardNode,
  onCopy,
  onCut,
  onPaste
}) {
  const { deleteElements, getNodes, getEdges } = useReactFlow();
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      if (isInputElement(target)) {
        return;
      }
      if (matchesKeyCombination(event, "c")) {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length === 1) {
          event.preventDefault();
          onCopy(selectedNodes[0]);
        }
        return;
      }
      if (matchesKeyCombination(event, "x")) {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length === 1) {
          event.preventDefault();
          onCut(selectedNodes[0]);
        }
        return;
      }
      if (matchesKeyCombination(event, "v")) {
        if (clipboardNode) {
          event.preventDefault();
          onPaste();
        }
        return;
      }
      if (isDeleteKey(event)) {
        const selectedNodes = getNodes().filter((node) => node.selected);
        const selectedEdges = getEdges().filter((edge) => edge.selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          deleteElements({
            nodes: selectedNodes,
            edges: selectedEdges
          });
          if (selectedNodes.some((node) => node.id === selectedNodeId)) {
            setSelectedNodeId(null);
          }
          notifyModified();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteElements, getNodes, getEdges, selectedNodeId, setSelectedNodeId, notifyModified, clipboardNode, onCopy, onCut, onPaste]);
}
export {
  useKeyboardShortcuts
};
