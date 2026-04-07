import ExecutionInputDialog from "../ExecutionInputDialog";
import ContextMenu from "../NodeContextMenu";
import MarketplaceDialog from "../MarketplaceDialog";
import { ContextMenuBackdrop } from "../../styles/workflowBuilderShell.styled";
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
  workflowId,
}) {
  return (
    <>
      <ExecutionInputDialog
        isOpen={showInputs}
        onClose={onCloseInputs}
        onSubmit={onConfirmExecute}
        nodes={executionNodes}
        workflowName={workflowName}
      />
      {contextMenu && (
        <>
          <ContextMenuBackdrop onClick={onCloseContextMenu} />
          <ContextMenu
            nodeId={contextMenu.nodeId}
            edgeId={contextMenu.edgeId}
            node={contextMenu.node}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={onCloseContextMenu}
            onDelete={onDeleteNode}
            onCopy={onCopy}
            onCut={onCut}
            onPaste={onPaste}
            onAddToAgentNodes={onAddToAgentNodes}
            onAddToToolNodes={onAddToToolNodes}
            onSendToMarketplace={onSendToMarketplace}
            canPaste={canPaste}
          />
        </>
      )}
      <MarketplaceDialog
        isOpen={showMarketplaceDialog}
        onClose={onCloseMarketplaceDialog}
        node={marketplaceNode}
        workflowId={workflowId}
        workflowName={workflowName}
      />
    </>
  );
}
export { WorkflowBuilderDialogs };
