/**
 * Workflow Builder Dialogs Component
 * Extracted from WorkflowBuilder to improve SRP compliance
 * Single Responsibility: Only handles dialog rendering
 */

import React from 'react'
import ExecutionInputDialog from '../ExecutionInputDialog'
import ContextMenu from '../NodeContextMenu'
import MarketplaceDialog from '../MarketplaceDialog'
import type { Node } from '@xyflow/react'

export interface WorkflowBuilderDialogsProps {
  // Execution input dialog
  showInputs: boolean
  onCloseInputs: () => void
  onConfirmExecute: (inputs: Record<string, any>) => void
  executionNodes: any[]
  workflowName: string
  
  // Context menu
  contextMenu: {
    nodeId: string | null
    edgeId: string | null
    node: Node | null
    x: number
    y: number
  } | null
  onCloseContextMenu: () => void
  onDeleteNode: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onAddToAgentNodes: () => void
  onSendToMarketplace: (node: Node) => void
  canPaste: boolean
  
  // Marketplace dialog
  showMarketplaceDialog: boolean
  onCloseMarketplaceDialog: () => void
  marketplaceNode: Node | null
  workflowId: string | null
}

/**
 * Workflow Builder Dialogs Component
 * DRY: Centralized dialog rendering logic
 */
export function WorkflowBuilderDialogs({
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
  onSendToMarketplace,
  canPaste,
  showMarketplaceDialog,
  onCloseMarketplaceDialog,
  marketplaceNode,
  workflowId,
}: WorkflowBuilderDialogsProps) {
  return (
    <>
      {/* Execution Input Dialog */}
      <ExecutionInputDialog
        isOpen={showInputs}
        onClose={onCloseInputs}
        onSubmit={onConfirmExecute}
        nodes={executionNodes}
        workflowName={workflowName}
      />

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={onCloseContextMenu}
          />
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
            onSendToMarketplace={onSendToMarketplace}
            canPaste={canPaste}
          />
        </>
      )}

      {/* Marketplace Dialog */}
      <MarketplaceDialog
        isOpen={showMarketplaceDialog}
        onClose={onCloseMarketplaceDialog}
        node={marketplaceNode}
        workflowId={workflowId}
        workflowName={workflowName}
      />
    </>
  )
}
