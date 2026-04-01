import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import ExecutionInputDialog from "../ExecutionInputDialog";
import ContextMenu from "../NodeContextMenu";
import MarketplaceDialog from "../MarketplaceDialog";
function WorkflowBuilderDialogs({
  showInputs,
  onCloseInputs,
  onConfirmExecute,
  executionNodes,
  workflowName,
  contextMenu,
  onCloseContextMenu,
  onDeleteNode,
  onCopy,
  onCut,
  onPaste,
  onAddToAgentNodes,
  onAddToToolNodes,
  onSendToMarketplace,
  canPaste,
  showMarketplaceDialog,
  onCloseMarketplaceDialog,
  marketplaceNode,
  workflowId
}) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ExecutionInputDialog,
      {
        isOpen: showInputs,
        onClose: onCloseInputs,
        onSubmit: onConfirmExecute,
        nodes: executionNodes,
        workflowName
      }
    ),
    contextMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 z-40",
          onClick: onCloseContextMenu
        }
      ),
      /* @__PURE__ */ jsx(
        ContextMenu,
        {
          nodeId: contextMenu.nodeId,
          edgeId: contextMenu.edgeId,
          node: contextMenu.node,
          x: contextMenu.x,
          y: contextMenu.y,
          onClose: onCloseContextMenu,
          onDelete: onDeleteNode,
          onCopy,
          onCut,
          onPaste,
          onAddToAgentNodes,
          onAddToToolNodes,
          onSendToMarketplace,
          canPaste
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      MarketplaceDialog,
      {
        isOpen: showMarketplaceDialog,
        onClose: onCloseMarketplaceDialog,
        node: marketplaceNode,
        workflowId,
        workflowName
      }
    )
  ] });
}
export {
  WorkflowBuilderDialogs
};
