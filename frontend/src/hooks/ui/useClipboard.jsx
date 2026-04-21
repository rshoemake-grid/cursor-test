import { useState, useCallback } from "react";
import { showSuccess } from "../../utils/notifications";
import { logicalOrToEmptyObject } from "../utils/logicalOr";
import { useCanvasClipboardStore } from "../../contexts/CanvasClipboardContext";
import {
  buildPastedGraph,
  normalizeCopyPayload,
} from "../../utils/canvasClipboard";

function useClipboard(reactFlowInstanceRef, notifyModified, tabId) {
  const store = useCanvasClipboardStore();
  const useSharedStore = store !== undefined;
  const [localClipboard, setLocalClipboard] = useState(null);

  const sharedClipboard = useSharedStore ? store.clipboard : null;
  const setSharedClipboard = useSharedStore ? store.setClipboard : null;

  const clipboard = useSharedStore ? sharedClipboard : localClipboard;
  const setClipboard = useSharedStore ? setSharedClipboard : setLocalClipboard;

  const copy = useCallback(
    (payload) => {
      const { nodes, edges } = normalizeCopyPayload(payload);
      if (nodes.length === 0) {
        return;
      }
      setClipboard({
        nodes,
        edges,
        action: "copy",
        sourceTabId: tabId,
      });
      showSuccess(
        nodes.length > 1
          ? `${nodes.length} nodes copied to clipboard`
          : "Node copied to clipboard",
      );
    },
    [setClipboard, tabId],
  );

  const cut = useCallback(
    (payload) => {
      const { nodes, edges } = normalizeCopyPayload(payload);
      if (nodes.length === 0) {
        return;
      }
      setClipboard({
        nodes,
        edges,
        action: "cut",
        sourceTabId: tabId,
      });
      showSuccess(
        nodes.length > 1
          ? `${nodes.length} nodes cut to clipboard`
          : "Node cut to clipboard",
      );
    },
    [setClipboard, tabId],
  );

  const paste = useCallback(
    (x, y) => {
      if (!clipboard?.nodes?.length) {
        return;
      }
      const {
        screenToFlowPosition,
        addNodes,
        addEdges,
        deleteElements,
      } = logicalOrToEmptyObject(reactFlowInstanceRef.current);
      if (!screenToFlowPosition || !addNodes) {
        return;
      }

      const position =
        x !== void 0 && y !== void 0
          ? screenToFlowPosition({ x, y })
          : null;

      const { newNodes, newEdges } = buildPastedGraph(clipboard, position);

      if (newNodes.length === 0) {
        return;
      }

      addNodes(newNodes);
      if (newEdges.length > 0 && addEdges) {
        addEdges(newEdges);
      }

      const sameTabCut =
        clipboard.action === "cut" &&
        clipboard.sourceTabId === tabId &&
        deleteElements;

      if (sameTabCut) {
        deleteElements({
          nodes: clipboard.nodes.map((n) => ({ id: n.id })),
          edges: clipboard.edges.map((e) => ({ id: e.id })),
        });
        setClipboard(null);
      }

      notifyModified();
      showSuccess(newNodes.length > 1 ? "Nodes pasted" : "Node pasted");
    },
    [clipboard, reactFlowInstanceRef, notifyModified, tabId, setClipboard],
  );

  const clear = useCallback(() => {
    setClipboard(null);
  }, [setClipboard]);

  const clipboardNode = clipboard?.nodes?.[0] ?? null;
  const clipboardHasContent = (clipboard?.nodes?.length ?? 0) > 0;

  return {
    clipboardNode,
    clipboard,
    clipboardHasContent,
    copy,
    cut,
    paste,
    clear,
  };
}

export { useClipboard };
