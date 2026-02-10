import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Components moved to extracted layout/dialog components
// api, showSuccess, showError moved to hooks
import { useAuth } from '../contexts/AuthContext'
// getLocalStorageItem and setLocalStorageItem moved to useDraftManagement hook
import { logger } from '../utils/logger'
import { defaultAdapters } from '../types/adapters'
import { 
  normalizeNodeForStorage
} from '../utils/workflowFormat'
// Domain-based imports - Phase 7
import { useClipboard, useContextMenu, useCanvasEvents } from '../hooks/ui'
import { useWorkflowPersistence, useWorkflowUpdates, useWorkflowUpdateHandler, useWorkflowState, useWorkflowLoader } from '../hooks/workflow'
import { useWorkflowExecution } from '../hooks/execution'
import { useDraftManagement, loadDraftsFromStorage } from '../hooks/storage'
import { useMarketplaceIntegration, useMarketplaceDialog } from '../hooks/marketplace'
import { useNodeSelection } from '../hooks/nodes'
import { convertNodesForExecutionInput } from '../utils/nodeConversion'
import { WorkflowBuilderLayout } from './WorkflowBuilder/WorkflowBuilderLayout'
import { WorkflowBuilderDialogs } from './WorkflowBuilder/WorkflowBuilderDialogs'
import type { WorkflowBuilderProps } from '../types/workflowBuilder'

// TabDraft interface and storage functions moved to useDraftManagement hook

export interface WorkflowBuilderHandle {
  saveWorkflow: () => Promise<string | null>
  executeWorkflow: () => void
  exportWorkflow: () => void
}

const WorkflowBuilder = forwardRef<WorkflowBuilderHandle, WorkflowBuilderProps>(function WorkflowBuilder({ 
  tabId,
  workflowId,
  tabName,
  tabIsUnsaved,
  storage = defaultAdapters.createLocalStorageAdapter(),
  workflowTabs = [],
  onExecutionStart,
  onWorkflowSaved,
  onWorkflowModified,
  onWorkflowLoaded,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCloseWorkflow: _onCloseWorkflow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearExecutions: _onClearExecutions,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution
}: WorkflowBuilderProps, ref) {
  // Note: onCloseWorkflow and onClearExecutions are passed to WorkflowBuilder
  // but handled by parent component (WorkflowTabs) via context
  // Local state for this tab - NOT using global store
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([] as Edge[])
  const [nodeExecutionStates] = useState<Record<string, { status: string; error?: string }>>({})
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null)
  
  // Track modifications (must be before hooks that use it)
  const notifyModified = useCallback(() => {
    if (onWorkflowModified && !isLoadingRef.current) {
      onWorkflowModified()
    }
  }, [onWorkflowModified])
  
  // Workflow state management
  const workflowState = useWorkflowState({
    workflowId,
    tabName,
  })
  const { localWorkflowId, setLocalWorkflowId, localWorkflowName, setLocalWorkflowName, localWorkflowDescription, setLocalWorkflowDescription, variables, setVariables } = workflowState
  
  // Node selection management
  const nodeSelection = useNodeSelection({
    reactFlowInstanceRef,
    notifyModified,
  })
  const { selectedNodeId, setSelectedNodeId, selectedNodeIds } = nodeSelection
  
  // Marketplace dialog management
  const marketplaceDialog = useMarketplaceDialog()
  const { showMarketplaceDialog, marketplaceNode, openDialog: openMarketplaceDialog, closeDialog: closeMarketplaceDialog } = marketplaceDialog
  
  const isLoadingRef = useRef<boolean>(false)
  const { isAuthenticated } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  
  // Clipboard operations (must be before KeyboardHandler)
  const clipboard = useClipboard(reactFlowInstanceRef, notifyModified)
  
  // Workflow updates handler
  const workflowUpdates = useWorkflowUpdates({
    nodes,
    edges,
    setNodes,
    setEdges,
    notifyModified,
    nodeExecutionStates,
  })

  // Marketplace integration (needs draft refs, so we create them first)
  const tabDraftsRef = useRef<Record<string, any>>(loadDraftsFromStorage())
  const saveDraftsToStorageRef = useRef<(drafts: Record<string, any>) => void>(() => {})
  
  // Marketplace integration
  const marketplaceIntegration = useMarketplaceIntegration({
    tabId,
    storage,
    setNodes,
    notifyModified,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    tabIsUnsaved,
    tabDraftsRef,
    saveDraftsToStorage: (drafts) => {
      saveDraftsToStorageRef.current(drafts)
    },
  })

  // Draft management (uses marketplace integration ref to check if adding agents)
  const draftManagement = useDraftManagement({
    tabId,
    workflowId,
    nodes,
    edges,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    tabIsUnsaved,
    setNodes,
    setEdges,
    setLocalWorkflowId,
    setLocalWorkflowName,
    setLocalWorkflowDescription,
    normalizeNodeForStorage,
    isAddingAgentsRef: marketplaceIntegration.isAddingAgentsRef,
  })
  
  // Update save function ref
  useEffect(() => {
    saveDraftsToStorageRef.current = draftManagement.saveDraftsToStorage
  }, [draftManagement.saveDraftsToStorage])
  
  // Note: Marketplace integration already has access to draft refs via closure
  // No need for additional synchronization
  
  const lastLoadedWorkflowIdRef = useRef<string | null>(null)

  useEffect(() => {
    workflowIdRef.current = localWorkflowId
  }, [localWorkflowId])
  
  // Workflow persistence (save, export)
  const { saveWorkflow, exportWorkflow } = useWorkflowPersistence({
    isAuthenticated,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    nodes,
    edges,
    variables,
    setLocalWorkflowId,
    onWorkflowSaved,
    isSaving,
    setIsSaving,
  })
  
  // Workflow execution
  const workflowIdRef = useRef<string | null>(workflowId)
  const execution = useWorkflowExecution({
    isAuthenticated,
    localWorkflowId,
    workflowIdRef,
    saveWorkflow,
    onExecutionStart,
  })

  // Log when showInputs changes
  useEffect(() => {
    logger.debug('[WorkflowBuilder] showInputs changed to:', execution.showInputs)
  }, [execution.showInputs])
  
  // Update workflowIdRef when localWorkflowId changes
  useEffect(() => {
    workflowIdRef.current = localWorkflowId
  }, [localWorkflowId])

  useImperativeHandle(ref, () => ({
    saveWorkflow,
    executeWorkflow: execution.executeWorkflow,
    exportWorkflow,
  }), [saveWorkflow, execution.executeWorkflow, exportWorkflow])

  // Wrap React Flow change handlers to notify modifications
  const onNodesChange = useCallback((changes: any) => {
    nodeSelection.handleNodesChange(changes, onNodesChangeBase)
  }, [nodeSelection, onNodesChangeBase])

  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeBase(changes)
    // Only notify on actual modifications (not selection)
    const hasActualChange = changes.some((change: any) => 
      change.type === 'add' || change.type === 'remove' || change.type === 'reset'
    )
    if (hasActualChange) {
      notifyModified()
    }
  }, [onEdgesChangeBase, notifyModified])

  // Use workflowNodeToNode from hook
  const workflowNodeToNode = workflowUpdates.workflowNodeToNode

  // Load workflow if ID provided
  useWorkflowLoader({
    workflowId,
    tabIsUnsaved,
    setNodes,
    setEdges,
    setLocalWorkflowId,
    setLocalWorkflowName,
    setLocalWorkflowDescription,
    setVariables,
    setSelectedNodeId,
    workflowNodeToNode,
    onWorkflowLoaded,
    isLoadingRef,
    lastLoadedWorkflowIdRef,
  })


  // Use applyLocalChanges from hook
  const applyLocalChanges = workflowUpdates.applyLocalChanges

  // Handle workflow updates from chat
  const { handleWorkflowUpdate } = useWorkflowUpdateHandler({
    localWorkflowId,
    setNodes,
    setEdges,
    workflowNodeToNode,
    applyLocalChanges,
  })

  // Context menu management (must be before canvas events to use in pane click)
  const contextMenu = useContextMenu()
  const { onNodeContextMenu, onEdgeContextMenu, contextMenu: contextMenuState } = contextMenu

  // Canvas event handlers
  const canvasEvents = useCanvasEvents({
    reactFlowInstanceRef,
    setNodes,
    setEdges,
    setSelectedNodeId,
    notifyModified,
    clipboard,
    storage,
  })

  const { onConnect, onDragOver, onDrop, onNodeClick, onPaneClick: canvasOnPaneClick, handleAddToAgentNodes } = canvasEvents

  // Enhanced pane click to also close context menu
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    contextMenu.closeContextMenu()
    canvasOnPaneClick(event)
  }, [canvasOnPaneClick, contextMenu])

  const handleSendToMarketplace = useCallback((node: Node) => {
    openMarketplaceDialog(node)
  }, [openMarketplaceDialog])

  const handleDeleteNode = useCallback(() => {
    // Clear selection if deleted node was selected
    if (contextMenuState?.nodeId && selectedNodeId === contextMenuState.nodeId) {
      setSelectedNodeId(null)
    }
    notifyModified()
  }, [contextMenuState?.nodeId, selectedNodeId, setSelectedNodeId, notifyModified])

  const handleConfirmExecute = useCallback((inputs: Record<string, any>) => {
    execution.setExecutionInputs(JSON.stringify(inputs))
    execution.handleConfirmExecute()
  }, [execution])

  const executions = workflowTabs?.find(t => t.workflowId === localWorkflowId)?.executions || []
  const activeExecutionId = workflowTabs?.find(t => t.workflowId === localWorkflowId)?.activeExecutionId || null

  return (
    <>
      <WorkflowBuilderLayout
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeExecutionStates={nodeExecutionStates}
        reactFlowInstanceRef={reactFlowInstanceRef}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        selectedNodeIds={selectedNodeIds}
        notifyModified={notifyModified}
        clipboardNode={clipboard.clipboardNode}
        onCopy={clipboard.copy}
        onCut={clipboard.cut}
        onPaste={clipboard.paste}
        activeWorkflowId={localWorkflowId || null}
        executions={executions}
        activeExecutionId={activeExecutionId}
        onWorkflowUpdate={handleWorkflowUpdate}
        onExecutionLogUpdate={onExecutionLogUpdate}
        onExecutionStatusUpdate={onExecutionStatusUpdate}
        onExecutionNodeUpdate={onExecutionNodeUpdate}
        onRemoveExecution={onRemoveExecution}
        onSaveWorkflow={saveWorkflow}
      />
      
      <WorkflowBuilderDialogs
        showInputs={execution.showInputs}
        onCloseInputs={() => execution.setShowInputs(false)}
        onConfirmExecute={handleConfirmExecute}
        executionNodes={convertNodesForExecutionInput(nodes)}
        workflowName={localWorkflowName}
        contextMenu={contextMenuState ? {
          nodeId: contextMenuState.nodeId,
          edgeId: contextMenuState.edgeId,
          node: contextMenuState.node,
          x: contextMenuState.x,
          y: contextMenuState.y,
        } : null}
        onCloseContextMenu={contextMenu.closeContextMenu}
        onDeleteNode={handleDeleteNode}
        onCopy={() => {
          if (contextMenuState?.node) {
            clipboard.copy(contextMenuState.node)
          }
        }}
        onCut={() => {
          if (contextMenuState?.node) {
            clipboard.cut(contextMenuState.node)
          }
        }}
        onPaste={() => clipboard.paste()}
        onAddToAgentNodes={() => {
          if (contextMenuState?.node) {
            handleAddToAgentNodes(contextMenuState.node)
          }
        }}
        onSendToMarketplace={handleSendToMarketplace}
        canPaste={!!clipboard.clipboardNode}
        showMarketplaceDialog={showMarketplaceDialog}
        onCloseMarketplaceDialog={closeMarketplaceDialog}
        marketplaceNode={marketplaceNode}
        workflowId={localWorkflowId}
      />
    </>
  )
})

export default WorkflowBuilder
