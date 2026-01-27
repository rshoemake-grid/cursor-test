import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// nodeTypes moved to WorkflowCanvas component
import NodePanel from './NodePanel'
import ExecutionInputDialog from './ExecutionInputDialog'
import PropertyPanel from './PropertyPanel'
import ExecutionConsole from './ExecutionConsole'
import ContextMenu from './NodeContextMenu'
import MarketplaceDialog from './MarketplaceDialog'
// api, showSuccess, showError moved to hooks
import { useAuth } from '../contexts/AuthContext'
// getLocalStorageItem and setLocalStorageItem moved to useDraftManagement hook
import { logger } from '../utils/logger'
import { defaultAdapters } from '../types/adapters'
import { 
  normalizeNodeForStorage
} from '../utils/workflowFormat'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useClipboard } from '../hooks/useClipboard'
import { useWorkflowPersistence } from '../hooks/useWorkflowPersistence'
import { useWorkflowExecution } from '../hooks/useWorkflowExecution'
import { useWorkflowUpdates } from '../hooks/useWorkflowUpdates'
import { useDraftManagement, loadDraftsFromStorage } from '../hooks/useDraftManagement'
import { useMarketplaceIntegration } from '../hooks/useMarketplaceIntegration'
import { useWorkflowLoader } from '../hooks/useWorkflowLoader'
import { useCanvasEvents } from '../hooks/useCanvasEvents'
import { useContextMenu } from '../hooks/useContextMenu'
import { useWorkflowUpdateHandler } from '../hooks/useWorkflowUpdateHandler'
import { useNodeSelection } from '../hooks/useNodeSelection'
import { useWorkflowState } from '../hooks/useWorkflowState'
import { useMarketplaceDialog } from '../hooks/useMarketplaceDialog'
import { convertNodesForExecutionInput } from '../utils/nodeConversion'
import WorkflowCanvas from './WorkflowCanvas'
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
  onCloseWorkflow: _onCloseWorkflow,
      onClearExecutions: _onClearExecutions,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution
}: WorkflowBuilderProps, ref) {
  // Local state for this tab - NOT using global store
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([] as Edge[])
  const [nodeExecutionStates, _setNodeExecutionStates] = useState<Record<string, { status: string; error?: string }>>({})
  const reactFlowInstanceRef = useRef<any>(null)
  
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
  
  // Component to capture React Flow instance for coordinate conversion
  const ReactFlowInstanceCapture = () => {
    const reactFlowInstance = useReactFlow()
    
    useEffect(() => {
      reactFlowInstanceRef.current = reactFlowInstance
    }, [reactFlowInstance])
    
    return null
  }
  
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
  
  // Use draft management refs
  const { tabDraftsRef: finalTabDraftsRef, saveDraftsToStorage: finalSaveDraftsToStorage } = draftManagement
  
  // Update marketplace integration with final draft refs
  useEffect(() => {
    // Marketplace integration already has access via closure
  }, [finalTabDraftsRef, finalSaveDraftsToStorage])
  
  const lastLoadedWorkflowIdRef = useRef<string | null>(null)
  
  // Component to handle keyboard shortcuts (must be inside ReactFlowProvider)
  const KeyboardHandler = () => {
    useKeyboardShortcuts({
      selectedNodeId,
      setSelectedNodeId,
      notifyModified,
      clipboardNode: clipboard.clipboardNode,
      onCopy: clipboard.copy,
      onCut: clipboard.cut,
      onPaste: () => clipboard.paste(),
    })
    return null
  }

  // Draft management is now handled by useDraftManagement hook

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

  const handleSendToMarketplace = useCallback((node: any) => {
    openMarketplaceDialog(node)
  }, [openMarketplaceDialog])

  return (
    <ReactFlowProvider>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Node Palette (Full Height) */}
        <NodePanel />

        {/* Middle Section - Workflow Canvas + Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 relative">
            <KeyboardHandler />
            <ReactFlowInstanceCapture />
            <WorkflowCanvas
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
            />
          </div>

          {/* Bottom: Chat Console */}
          <ExecutionConsole 
            activeWorkflowId={localWorkflowId || null}
            executions={workflowTabs?.find(t => t.workflowId === localWorkflowId)?.executions || []}
            activeExecutionId={workflowTabs?.find(t => t.workflowId === localWorkflowId)?.activeExecutionId || null}
            onWorkflowUpdate={handleWorkflowUpdate}
            onExecutionLogUpdate={onExecutionLogUpdate}
            onExecutionStatusUpdate={onExecutionStatusUpdate}
            onExecutionNodeUpdate={onExecutionNodeUpdate}
            onRemoveExecution={onRemoveExecution}
          />
        </div>

        {/* Right Panel - Properties (Full Height) */}
        <PropertyPanel 
          selectedNodeId={selectedNodeId} 
          setSelectedNodeId={setSelectedNodeId}
          selectedNodeIds={selectedNodeIds}
          nodes={nodes}
          onSaveWorkflow={saveWorkflow}
        />
      </div>
      
      {/* Execution Input Dialog - Using extracted component (SRP compliance) */}
      <ExecutionInputDialog
        isOpen={execution.showInputs}
        onClose={() => {
          execution.setShowInputs(false)
        }}
        onSubmit={(inputs) => {
          execution.setExecutionInputs(JSON.stringify(inputs))
          execution.handleConfirmExecute()
        }}
        nodes={convertNodesForExecutionInput(nodes)}
        workflowName={localWorkflowName}
      />

      {/* Context Menu */}
      {contextMenuState && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={contextMenu.closeContextMenu}
          />
          <ContextMenu
            nodeId={contextMenuState.nodeId}
            edgeId={contextMenuState.edgeId}
            node={contextMenuState.node}
            x={contextMenuState.x}
            y={contextMenuState.y}
            onClose={contextMenu.closeContextMenu}
            onDelete={() => {
              // Clear selection if deleted node was selected
              if (contextMenuState.nodeId && selectedNodeId === contextMenuState.nodeId) {
                setSelectedNodeId(null)
              }
              notifyModified()
            }}
            onCopy={clipboard.copy}
            onCut={clipboard.cut}
            onPaste={clipboard.paste}
            onAddToAgentNodes={handleAddToAgentNodes}
            onSendToMarketplace={handleSendToMarketplace}
            canPaste={!!clipboard.clipboardNode}
          />
        </>
      )}

      {/* Marketplace Dialog */}
      <MarketplaceDialog
        isOpen={showMarketplaceDialog}
        onClose={closeMarketplaceDialog}
        node={marketplaceNode}
        workflowId={localWorkflowId}
        workflowName={localWorkflowName}
      />
    </ReactFlowProvider>
  )
})

export default WorkflowBuilder
