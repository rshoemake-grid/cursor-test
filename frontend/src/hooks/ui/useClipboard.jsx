import { useState, useCallback } from "react";
import { showSuccess } from "../../utils/notifications";
import { logicalOrToEmptyObject } from "../utils/logicalOr";
function useClipboard(reactFlowInstanceRef, notifyModified) {
  const [clipboardNode, setClipboardNode] = useState(null);
  const [clipboardAction, setClipboardAction] = useState(null);
  const copy = useCallback((node) => {
    setClipboardNode(node);
    setClipboardAction("copy");
    showSuccess("Node copied to clipboard");
  }, []);
  const cut = useCallback((node) => {
    setClipboardNode(node);
    setClipboardAction("cut");
    showSuccess("Node cut to clipboard");
  }, []);
  const paste = useCallback((x, y) => {
    if (!clipboardNode) return;
    const { getNodes, screenToFlowPosition, addNodes, deleteElements } = logicalOrToEmptyObject(reactFlowInstanceRef.current);
    if (!getNodes || !screenToFlowPosition || !addNodes) return;
    const position = x !== void 0 && y !== void 0 ? screenToFlowPosition({ x, y }) : { x: clipboardNode.position.x + 50, y: clipboardNode.position.y + 50 };
    const newNode = {
      ...clipboardNode,
      id: `${clipboardNode.type}_${Date.now()}`,
      position,
      selected: false
    };
    addNodes(newNode);
    if (clipboardAction === "cut" && deleteElements) {
      deleteElements({ nodes: [{ id: clipboardNode.id }] });
      setClipboardNode(null);
      setClipboardAction(null);
    }
    notifyModified();
    showSuccess("Node pasted");
  }, [clipboardNode, clipboardAction, reactFlowInstanceRef, notifyModified]);
  const clear = useCallback(() => {
    setClipboardNode(null);
    setClipboardAction(null);
  }, []);
  return {
    clipboardNode,
    clipboardAction,
    copy,
    cut,
    paste,
    clear
  };
}
export {
  useClipboard
};
