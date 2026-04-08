import PropTypes from "prop-types";
import ExecutionInputDialog from "../ExecutionInputDialog";
import ContextMenu from "../NodeContextMenu";
import MarketplaceDialog from "../MarketplaceDialog";
import { ContextMenuBackdrop } from "../../styles/workflowBuilderShell.styled";

function WorkflowBuilderDialogs({
  executionInput,
  workflow,
  nodeContextMenu,
  marketplace,
}) {
  const { isOpen: showInputs, onClose: onCloseInputs, onSubmit, nodes } =
    executionInput;
  const { name: workflowName } = workflow;
  const {
    state: contextMenu,
    onClose: onCloseContextMenu,
    onDeleteNode,
    onCopy,
    onCut,
    onPaste,
    onAddToAgentNodes,
    onAddToToolNodes,
    onSendToMarketplace,
    canPaste,
  } = nodeContextMenu;
  const {
    isOpen: showMarketplaceDialog,
    onClose: onCloseMarketplaceDialog,
    node: marketplaceNode,
    workflowId,
  } = marketplace;
  return (
    <>
      <ExecutionInputDialog
        dialog={{
          isOpen: showInputs,
          workflowName,
        }}
        graph={{ nodes }}
        handlers={{
          onClose: onCloseInputs,
          onSubmit,
        }}
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

WorkflowBuilderDialogs.propTypes = {
  executionInput: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  workflow: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  nodeContextMenu: PropTypes.shape({
    state: PropTypes.shape({
      nodeId: PropTypes.string,
      edgeId: PropTypes.string,
      node: PropTypes.object,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    onClose: PropTypes.func.isRequired,
    onDeleteNode: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onCut: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onAddToAgentNodes: PropTypes.func.isRequired,
    onAddToToolNodes: PropTypes.func.isRequired,
    onSendToMarketplace: PropTypes.func.isRequired,
    canPaste: PropTypes.bool.isRequired,
  }).isRequired,
  marketplace: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    node: PropTypes.object,
    workflowId: PropTypes.string,
  }).isRequired,
};

export { WorkflowBuilderDialogs };
