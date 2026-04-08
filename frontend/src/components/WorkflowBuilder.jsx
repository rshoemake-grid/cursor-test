import {
  useCallback,
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";
import { nullableString } from "../utils/propTypes";
import { useNodesState, useEdgesState, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import {
  normalizeNodeForStorage,
  convertNodesToWorkflowFormat,
  convertEdgesToWorkflowFormat,
} from "../utils/workflowFormat";
import { useClipboard, useContextMenu, useCanvasEvents } from "../hooks/ui";
import {
  useWorkflowPersistence,
  useWorkflowUpdates,
  useWorkflowUpdateHandler,
  useWorkflowState,
  useWorkflowLoader,
} from "../hooks/workflow";
import { useWorkflowExecution } from "../hooks/execution";
import { useDraftManagement, loadDraftsFromStorage } from "../hooks/storage";
import {
  useMarketplaceIntegration,
  useMarketplaceDialog,
} from "../hooks/marketplace";
import { useNodeSelection } from "../hooks/nodes";
import { convertNodesForExecutionInput } from "../utils/nodeConversion";
import { WorkflowBuilderLayout } from "./WorkflowBuilder/WorkflowBuilderLayout";
import { WorkflowBuilderDialogs } from "./WorkflowBuilder/WorkflowBuilderDialogs";
const WorkflowBuilder = forwardRef(function WorkflowBuilder2(
  { tab, storage: storageProp, workflowTabs = [], callbacks = {} },
  ref,
) {
  const defaultStorageRef = useRef(null);
  if (defaultStorageRef.current === null) {
    defaultStorageRef.current = defaultAdapters.createLocalStorageAdapter();
  }
  const storage = storageProp ?? defaultStorageRef.current;
  const { tabId, workflowId, tabName, tabIsUnsaved } = tab;
  const {
    onExecutionStart,
    onWorkflowSaved,
    onWorkflowModified,
    onWorkflowLoaded,
    onCloseWorkflow: _onCloseWorkflow,
    onClearExecutions: _onClearExecutions,
    onExecutionLogUpdate,
    onExecutionStatusUpdate,
    onExecutionNodeUpdate,
    onRemoveExecution,
  } = callbacks;
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
    tabName,
  });
  const {
    localWorkflowId,
    setLocalWorkflowId,
    localWorkflowName,
    setLocalWorkflowName,
    localWorkflowDescription,
    setLocalWorkflowDescription,
    variables,
    setVariables,
  } = workflowState;
  const nodeSelection = useNodeSelection({
    reactFlowInstanceRef,
    notifyModified,
  });
  const {
    selectedNodeId,
    setSelectedNodeId,
    selectedNodeIds,
    setSelectedNodeIds,
  } = nodeSelection;
  const marketplaceDialog = useMarketplaceDialog();
  const {
    showMarketplaceDialog,
    marketplaceNode,
    openDialog: openMarketplaceDialog,
    closeDialog: closeMarketplaceDialog,
  } = marketplaceDialog;
  const isLoadingRef = useRef(false);
  const { isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [workflowChatClearNonce, setWorkflowChatClearNonce] = useState(0);
  const clipboard = useClipboard(reactFlowInstanceRef, notifyModified);
  const workflowUpdates = useWorkflowUpdates({
    nodes,
    edges,
    setNodes,
    setEdges,
    notifyModified,
    nodeExecutionStates,
  });
  const tabDraftsRef = useRef(null);
  if (tabDraftsRef.current === null) {
    tabDraftsRef.current = loadDraftsFromStorage({ storage, logger });
  }
  const saveDraftsToStorageRef = useRef(() => {});
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
    },
  });
  const draftManagement = useDraftManagement({
    tabDraftsRef,
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
    storage,
    logger,
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
    setIsSaving,
  });
  const workflowIdRef = useRef(workflowId);
  const execution = useWorkflowExecution({
    isAuthenticated,
    localWorkflowId,
    workflowIdRef,
    saveWorkflow,
    onExecutionStart,
  });
  useEffect(() => {
    logger.debug(
      "[WorkflowBuilder] showInputs changed to:",
      execution.showInputs,
    );
  }, [execution.showInputs]);
  useEffect(() => {
    workflowIdRef.current = localWorkflowId;
  }, [localWorkflowId]);
  const clearWorkflow = useCallback(() => {
    const variableCount =
      variables !== null &&
      variables !== void 0 &&
      typeof variables === "object"
        ? Object.keys(variables).length
        : 0;
    const hasContent =
      nodes.length > 0 || edges.length > 0 || variableCount > 0;
    if (hasContent === true) {
      const ok = window.confirm(
        "Clear all nodes, edges, and workflow variables from the canvas, and reset the workflow chat for this tab? Unsaved graph content is removed until you save.",
      );
      if (ok !== true) {
        return;
      }
    }
    setNodes([]);
    setEdges([]);
    setVariables({});
    setSelectedNodeId(null);
    setSelectedNodeIds(new Set());
    setWorkflowChatClearNonce((n) => n + 1);
    notifyModified();
  }, [
    nodes.length,
    edges.length,
    variables,
    setNodes,
    setEdges,
    setVariables,
    setSelectedNodeId,
    setSelectedNodeIds,
    notifyModified,
  ]);
  useImperativeHandle(
    ref,
    () => ({
      saveWorkflow,
      executeWorkflow: execution.executeWorkflow,
      exportWorkflow,
      clearWorkflow,
    }),
    [saveWorkflow, execution.executeWorkflow, exportWorkflow, clearWorkflow],
  );
  const onNodesChange = useCallback(
    (changes) => {
      nodeSelection.handleNodesChange(changes, onNodesChangeBase);
    },
    [nodeSelection, onNodesChangeBase],
  );
  const onEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeBase(changes);
      const hasActualChange = changes.some(
        (change) =>
          change.type === "add" ||
          change.type === "remove" ||
          change.type === "reset",
      );
      if (hasActualChange) {
        notifyModified();
      }
    },
    [onEdgesChangeBase, notifyModified],
  );
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
    isAuthenticated,
  });
  const applyLocalChanges = workflowUpdates.applyLocalChanges;
  const { handleWorkflowUpdate } = useWorkflowUpdateHandler({
    localWorkflowId,
    setNodes,
    setEdges,
    workflowNodeToNode,
    applyLocalChanges,
    isAuthenticated,
  });
  const contextMenu = useContextMenu();
  const {
    onNodeContextMenu,
    onEdgeContextMenu,
    contextMenu: contextMenuState,
  } = contextMenu;
  const canvasEvents = useCanvasEvents({
    reactFlowInstanceRef,
    setNodes,
    setEdges,
    setSelectedNodeId,
    notifyModified,
    clipboard,
    storage,
  });
  const {
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onPaneClick: canvasOnPaneClick,
    handleAddToAgentNodes,
    handleAddToToolNodes,
  } = canvasEvents;
  const onPaneClick = useCallback(
    (event) => {
      contextMenu.closeContextMenu();
      canvasOnPaneClick(event);
    },
    [canvasOnPaneClick, contextMenu],
  );
  const handleSendToMarketplace = useCallback(
    (node) => {
      openMarketplaceDialog(node);
    },
    [openMarketplaceDialog],
  );
  const handleDeleteNode = useCallback(() => {
    if (
      contextMenuState?.nodeId &&
      selectedNodeId === contextMenuState.nodeId
    ) {
      setSelectedNodeId(null);
    }
    notifyModified();
  }, [
    contextMenuState?.nodeId,
    selectedNodeId,
    setSelectedNodeId,
    notifyModified,
  ]);
  const handleConfirmExecute = useCallback(
    (inputs) => {
      execution.setExecutionInputs(JSON.stringify(inputs));
      execution.handleConfirmExecute();
    },
    [execution],
  );
  const executions =
    workflowTabs?.find((t) => t.workflowId === localWorkflowId)?.executions ||
    [];
  const activeExecutionId =
    workflowTabs?.find((t) => t.workflowId === localWorkflowId)
      ?.activeExecutionId || null;
  const workflowChatCanvasRef = useRef({
    nodes: [],
    edges: [],
  });
  workflowChatCanvasRef.current = {
    nodes: convertNodesToWorkflowFormat(nodes),
    edges: convertEdgesToWorkflowFormat(edges),
  };
  const getWorkflowChatCanvasSnapshot = useCallback(
    () => workflowChatCanvasRef.current,
    [],
  );
  return (
    <ReactFlowProvider>
      <WorkflowBuilderLayout
        graph={{
          nodes,
          edges,
          nodeExecutionStates,
        }}
        canvasHandlers={{
          onNodesChange,
          onEdgesChange,
          onConnect,
          onDrop,
          onDragOver,
          onNodeClick,
          onNodeContextMenu,
          onEdgeContextMenu,
          onPaneClick,
        }}
        selection={{
          selectedNodeId,
          setSelectedNodeId,
          selectedNodeIds,
          notifyModified,
        }}
        keyboard={{
          clipboardNode: clipboard.clipboardNode,
          onCopy: clipboard.copy,
          onCut: clipboard.cut,
          onPaste: clipboard.paste,
        }}
        reactFlow={{
          instanceRef: reactFlowInstanceRef,
        }}
        executionConsole={{
          activeWorkflowId: localWorkflowId || null,
          workflowTabId: tabId,
          executions,
          activeExecutionId,
          onWorkflowUpdate: handleWorkflowUpdate,
          getWorkflowChatCanvasSnapshot,
          workflowChatClearNonce,
          onExecutionLogUpdate,
          onExecutionStatusUpdate,
          onExecutionNodeUpdate,
          onRemoveExecution,
        }}
        propertyPanel={{
          onSaveWorkflow: saveWorkflow,
        }}
      />
      <WorkflowBuilderDialogs
        executionInput={{
          isOpen: execution.showInputs,
          onClose: () => execution.setShowInputs(false),
          onSubmit: handleConfirmExecute,
          nodes: convertNodesForExecutionInput(nodes),
        }}
        workflow={{
          name: localWorkflowName,
        }}
        nodeContextMenu={{
          state: contextMenuState
            ? {
                nodeId: contextMenuState.nodeId,
                edgeId: contextMenuState.edgeId,
                node: contextMenuState.node,
                x: contextMenuState.x,
                y: contextMenuState.y,
              }
            : null,
          onClose: contextMenu.closeContextMenu,
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
        }}
        marketplace={{
          isOpen: showMarketplaceDialog,
          onClose: closeMarketplaceDialog,
          node: marketplaceNode,
          workflowId: localWorkflowId,
        }}
      />
    </ReactFlowProvider>
  );
});

WorkflowBuilder.propTypes = {
  tab: PropTypes.shape({
    tabId: PropTypes.string.isRequired,
    workflowId: nullableString,
    tabName: PropTypes.string,
    tabIsUnsaved: PropTypes.bool,
  }).isRequired,
  storage: PropTypes.shape({
    getItem: PropTypes.func,
    setItem: PropTypes.func,
    removeItem: PropTypes.func,
  }),
  workflowTabs: PropTypes.arrayOf(PropTypes.object),
  callbacks: PropTypes.shape({
    onExecutionStart: PropTypes.func,
    onWorkflowSaved: PropTypes.func,
    onWorkflowModified: PropTypes.func,
    onWorkflowLoaded: PropTypes.func,
    onCloseWorkflow: PropTypes.func,
    onClearExecutions: PropTypes.func,
    onExecutionLogUpdate: PropTypes.func,
    onExecutionStatusUpdate: PropTypes.func,
    onExecutionNodeUpdate: PropTypes.func,
    onRemoveExecution: PropTypes.func,
  }),
};

var stdin_default = WorkflowBuilder;
export { stdin_default as default };
