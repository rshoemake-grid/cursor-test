import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import {
  normalizeNodeForStorage
} from "../utils/workflowFormat";
import { useClipboard, useContextMenu, useCanvasEvents } from "../hooks/ui";
import { useWorkflowPersistence, useWorkflowUpdates, useWorkflowUpdateHandler, useWorkflowState, useWorkflowLoader } from "../hooks/workflow";
import { useWorkflowExecution } from "../hooks/execution";
import { useDraftManagement, loadDraftsFromStorage } from "../hooks/storage";
import { useMarketplaceIntegration, useMarketplaceDialog } from "../hooks/marketplace";
import { useNodeSelection } from "../hooks/nodes";
import { convertNodesForExecutionInput } from "../utils/nodeConversion";
import { WorkflowBuilderLayout } from "./WorkflowBuilder/WorkflowBuilderLayout";
import { WorkflowBuilderDialogs } from "./WorkflowBuilder/WorkflowBuilderDialogs";
const WorkflowBuilder = forwardRef(function WorkflowBuilder2({
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
}, ref) {
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([]);
  const [nodeExecutionStates] = useState({});
  const reactFlowInstanceRef = useRef(null);
  const notifyModified = useCallback(() => {
    if (onWorkflowModified && !isLoadingRef.current) {
      onWorkflowModified();
    }
  }, [onWorkflowModified]);
  const workflowState = useWorkflowState({
    workflowId,
    tabName
  });
  const { localWorkflowId, setLocalWorkflowId, localWorkflowName, setLocalWorkflowName, localWorkflowDescription, setLocalWorkflowDescription, variables, setVariables } = workflowState;
  const nodeSelection = useNodeSelection({
    reactFlowInstanceRef,
    notifyModified
  });
  const { selectedNodeId, setSelectedNodeId, selectedNodeIds } = nodeSelection;
  const marketplaceDialog = useMarketplaceDialog();
  const { showMarketplaceDialog, marketplaceNode, openDialog: openMarketplaceDialog, closeDialog: closeMarketplaceDialog } = marketplaceDialog;
  const isLoadingRef = useRef(false);
  const { isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const clipboard = useClipboard(reactFlowInstanceRef, notifyModified);
  const workflowUpdates = useWorkflowUpdates({
    nodes,
    edges,
    setNodes,
    setEdges,
    notifyModified,
    nodeExecutionStates
  });
  const tabDraftsRef = useRef(loadDraftsFromStorage());
  const saveDraftsToStorageRef = useRef(() => {
  });
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
      saveDraftsToStorageRef.current(drafts);
    }
  });
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
    isAddingAgentsRef: marketplaceIntegration.isAddingAgentsRef
  });
  useEffect(() => {
    saveDraftsToStorageRef.current = draftManagement.saveDraftsToStorage;
  }, [draftManagement.saveDraftsToStorage]);
  const lastLoadedWorkflowIdRef = useRef(null);
  useEffect(() => {
    workflowIdRef.current = localWorkflowId;
  }, [localWorkflowId]);
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
    setIsSaving
  });
  const workflowIdRef = useRef(workflowId);
  const execution = useWorkflowExecution({
    isAuthenticated,
    localWorkflowId,
    workflowIdRef,
    saveWorkflow,
    onExecutionStart
  });
  useEffect(() => {
    logger.debug("[WorkflowBuilder] showInputs changed to:", execution.showInputs);
  }, [execution.showInputs]);
  useEffect(() => {
    workflowIdRef.current = localWorkflowId;
  }, [localWorkflowId]);
  useImperativeHandle(ref, () => ({
    saveWorkflow,
    executeWorkflow: execution.executeWorkflow,
    exportWorkflow
  }), [saveWorkflow, execution.executeWorkflow, exportWorkflow]);
  const onNodesChange = useCallback((changes) => {
    nodeSelection.handleNodesChange(changes, onNodesChangeBase);
  }, [nodeSelection, onNodesChangeBase]);
  const onEdgesChange = useCallback((changes) => {
    onEdgesChangeBase(changes);
    const hasActualChange = changes.some(
      (change) => change.type === "add" || change.type === "remove" || change.type === "reset"
    );
    if (hasActualChange) {
      notifyModified();
    }
  }, [onEdgesChangeBase, notifyModified]);
  const workflowNodeToNode = workflowUpdates.workflowNodeToNode;
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
    isAuthenticated
  });
  const applyLocalChanges = workflowUpdates.applyLocalChanges;
  const { handleWorkflowUpdate } = useWorkflowUpdateHandler({
    localWorkflowId,
    setNodes,
    setEdges,
    workflowNodeToNode,
    applyLocalChanges,
    isAuthenticated
  });
  const contextMenu = useContextMenu();
  const { onNodeContextMenu, onEdgeContextMenu, contextMenu: contextMenuState } = contextMenu;
  const canvasEvents = useCanvasEvents({
    reactFlowInstanceRef,
    setNodes,
    setEdges,
    setSelectedNodeId,
    notifyModified,
    clipboard,
    storage
  });
  const { onConnect, onDragOver, onDrop, onNodeClick, onPaneClick: canvasOnPaneClick, handleAddToAgentNodes, handleAddToToolNodes } = canvasEvents;
  const onPaneClick = useCallback((event) => {
    contextMenu.closeContextMenu();
    canvasOnPaneClick(event);
  }, [canvasOnPaneClick, contextMenu]);
  const handleSendToMarketplace = useCallback((node) => {
    openMarketplaceDialog(node);
  }, [openMarketplaceDialog]);
  const handleDeleteNode = useCallback(() => {
    if (contextMenuState?.nodeId && selectedNodeId === contextMenuState.nodeId) {
      setSelectedNodeId(null);
    }
    notifyModified();
  }, [contextMenuState?.nodeId, selectedNodeId, setSelectedNodeId, notifyModified]);
  const handleConfirmExecute = useCallback((inputs) => {
    execution.setExecutionInputs(JSON.stringify(inputs));
    execution.handleConfirmExecute();
  }, [execution]);
  const executions = workflowTabs?.find((t) => t.workflowId === localWorkflowId)?.executions || [];
  const activeExecutionId = workflowTabs?.find((t) => t.workflowId === localWorkflowId)?.activeExecutionId || null;
  return /* @__PURE__ */ jsxs(ReactFlowProvider, { children: [
    /* @__PURE__ */ jsx(
      WorkflowBuilderLayout,
      {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onDrop,
        onDragOver,
        onNodeClick,
        onNodeContextMenu,
        onEdgeContextMenu,
        onPaneClick,
        nodeExecutionStates,
        reactFlowInstanceRef,
        selectedNodeId,
        setSelectedNodeId,
        selectedNodeIds,
        notifyModified,
        clipboardNode: clipboard.clipboardNode,
        onCopy: clipboard.copy,
        onCut: clipboard.cut,
        onPaste: clipboard.paste,
        activeWorkflowId: localWorkflowId || null,
        executions,
        activeExecutionId,
        onWorkflowUpdate: handleWorkflowUpdate,
        onExecutionLogUpdate,
        onExecutionStatusUpdate,
        onExecutionNodeUpdate,
        onRemoveExecution,
        onSaveWorkflow: saveWorkflow
      }
    ),
    /* @__PURE__ */ jsx(
      WorkflowBuilderDialogs,
      {
        showInputs: execution.showInputs,
        onCloseInputs: () => execution.setShowInputs(false),
        onConfirmExecute: handleConfirmExecute,
        executionNodes: convertNodesForExecutionInput(nodes),
        workflowName: localWorkflowName,
        contextMenu: contextMenuState ? {
          nodeId: contextMenuState.nodeId,
          edgeId: contextMenuState.edgeId,
          node: contextMenuState.node,
          x: contextMenuState.x,
          y: contextMenuState.y
        } : null,
        onCloseContextMenu: contextMenu.closeContextMenu,
        onDeleteNode: handleDeleteNode,
        onCopy: () => {
          if (contextMenuState?.node) {
            clipboard.copy(contextMenuState.node);
          }
        },
        onCut: () => {
          if (contextMenuState?.node) {
            clipboard.cut(contextMenuState.node);
          }
        },
        onPaste: () => clipboard.paste(),
        onAddToAgentNodes: () => {
          if (contextMenuState?.node) {
            handleAddToAgentNodes(contextMenuState.node);
          }
        },
        onAddToToolNodes: () => {
          if (contextMenuState?.node) {
            handleAddToToolNodes(contextMenuState.node);
          }
        },
        onSendToMarketplace: handleSendToMarketplace,
        canPaste: !!clipboard.clipboardNode,
        showMarketplaceDialog,
        onCloseMarketplaceDialog: closeMarketplaceDialog,
        marketplaceNode,
        workflowId: localWorkflowId
      }
    )
  ] });
});
var stdin_default = WorkflowBuilder;
export {
  stdin_default as default
};
