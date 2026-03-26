import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Workflow Builder Dialogs Component
 * Extracted from WorkflowBuilder to improve SRP compliance
 * Single Responsibility: Only handles dialog rendering
 */ import ExecutionInputDialog from '../ExecutionInputDialog';
import ContextMenu from '../NodeContextMenu';
import MarketplaceDialog from '../MarketplaceDialog';
/**
 * Workflow Builder Dialogs Component
 * DRY: Centralized dialog rendering logic
 */ export function WorkflowBuilderDialogs({ showInputs, onCloseInputs, onConfirmExecute, executionNodes, workflowName, contextMenu, onCloseContextMenu, onDeleteNode, onCopy, onCut, onPaste, onAddToAgentNodes, onAddToToolNodes, onSendToMarketplace, canPaste, showMarketplaceDialog, onCloseMarketplaceDialog, marketplaceNode, workflowId }) {
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx(ExecutionInputDialog, {
                isOpen: showInputs,
                onClose: onCloseInputs,
                onSubmit: onConfirmExecute,
                nodes: executionNodes,
                workflowName: workflowName
            }),
            contextMenu && /*#__PURE__*/ _jsxs(_Fragment, {
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        className: "fixed inset-0 z-40",
                        onClick: onCloseContextMenu
                    }),
                    /*#__PURE__*/ _jsx(ContextMenu, {
                        nodeId: contextMenu.nodeId,
                        edgeId: contextMenu.edgeId,
                        node: contextMenu.node,
                        x: contextMenu.x,
                        y: contextMenu.y,
                        onClose: onCloseContextMenu,
                        onDelete: onDeleteNode,
                        onCopy: onCopy,
                        onCut: onCut,
                        onPaste: onPaste,
                        onAddToAgentNodes: onAddToAgentNodes,
                        onAddToToolNodes: onAddToToolNodes,
                        onSendToMarketplace: onSendToMarketplace,
                        canPaste: canPaste
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(MarketplaceDialog, {
                isOpen: showMarketplaceDialog,
                onClose: onCloseMarketplaceDialog,
                node: marketplaceNode,
                workflowId: workflowId,
                workflowName: workflowName
            })
        ]
    });
}
