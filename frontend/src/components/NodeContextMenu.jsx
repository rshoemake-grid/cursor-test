import { Trash2, Copy, Scissors, Clipboard, Plus, Upload } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  CtxMenuRoot,
  CtxMenuItem,
  CtxMenuItemSection,
  CtxMenuDivider,
  CtxMenuDangerItem,
} from "../styles/nodeContextMenu.styled";

function ContextMenu({
  nodeId,
  edgeId,
  node,
  x,
  y,
  onClose,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onAddToAgentNodes,
  onAddToToolNodes,
  onSendToMarketplace,
  canPaste = false,
}) {
  const { deleteElements } = useReactFlow();
  const handleDelete = () => {
    if (nodeId) {
      deleteElements({
        nodes: [
          {
            id: nodeId,
          },
        ],
      });
    } else if (edgeId) {
      deleteElements({
        edges: [
          {
            id: edgeId,
          },
        ],
      });
    }
    if (onDelete) {
      onDelete();
    }
    onClose();
  };
  const handleCopy = () => {
    if (node && onCopy) {
      onCopy(node);
    }
    onClose();
  };
  const handleCut = () => {
    if (node && onCut) {
      onCut(node);
    }
    onClose();
  };
  const handlePaste = () => {
    if (onPaste) {
      onPaste();
    }
    onClose();
  };
  const handleAddToAgentNodes = () => {
    if (node && onAddToAgentNodes) {
      onAddToAgentNodes(node);
    }
    onClose();
  };
  const handleAddToToolNodes = () => {
    if (node && onAddToToolNodes) {
      onAddToToolNodes(node);
    }
    onClose();
  };
  const handleSendToMarketplace = () => {
    if (node && onSendToMarketplace) {
      onSendToMarketplace(node);
    }
    onClose();
  };
  const isAgentNode = node?.type === "agent";
  const isToolNode = node?.type === "tool";
  const label = nodeId ? "Delete Node" : "Delete Connection";
  return (
    <CtxMenuRoot
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {nodeId && (
        <>
          <CtxMenuItem onClick={handleCopy}>
            <Copy aria-hidden />
            Copy
          </CtxMenuItem>
          <CtxMenuItem onClick={handleCut}>
            <Scissors aria-hidden />
            Cut
          </CtxMenuItem>
          {canPaste && (
            <CtxMenuItem onClick={handlePaste}>
              <Clipboard aria-hidden />
              Paste
            </CtxMenuItem>
          )}
          {isAgentNode && (
            <>
              <CtxMenuItemSection onClick={handleAddToAgentNodes}>
                <Plus aria-hidden />
                Add to Agent Nodes
              </CtxMenuItemSection>
              <CtxMenuItem onClick={handleSendToMarketplace}>
                <Upload aria-hidden />
                Send to Marketplace
              </CtxMenuItem>
            </>
          )}
          {isToolNode && (
            <>
              <CtxMenuItemSection onClick={handleAddToToolNodes}>
                <Plus aria-hidden />
                Add to Tool Nodes
              </CtxMenuItemSection>
              <CtxMenuItem onClick={handleSendToMarketplace}>
                <Upload aria-hidden />
                Send to Marketplace
              </CtxMenuItem>
            </>
          )}
          <CtxMenuDivider />
        </>
      )}
      <CtxMenuDangerItem onClick={handleDelete}>
        <Trash2 aria-hidden />
        {label}
      </CtxMenuDangerItem>
    </CtxMenuRoot>
  );
}
export { ContextMenu as default };
