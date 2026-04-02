import { jsx, jsxs } from "react/jsx-runtime";
import NodePanel from "../NodePanel";
import PropertyPanel from "../PropertyPanel";
import WorkflowCanvas from "../WorkflowCanvas";
import ExecutionConsole from "../ExecutionConsole";
import { KeyboardHandler } from "../KeyboardHandler";
import { ReactFlowInstanceCapture } from "../ReactFlowInstanceCapture";
function WorkflowBuilderLayout({
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
  selectedNodeId,
  setSelectedNodeId,
  notifyModified,
  clipboardNode,
  onCopy,
  onCut,
  onPaste,
  reactFlowInstanceRef,
  selectedNodeIds,
  activeWorkflowId,
  workflowTabId,
  executions,
  activeExecutionId,
  onWorkflowUpdate,
  getWorkflowChatCanvasSnapshot,
  workflowChatClearNonce,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution,
  onSaveWorkflow
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden", children: [
    /* @__PURE__ */ jsx(NodePanel, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsx(
          KeyboardHandler,
          {
            selectedNodeId,
            setSelectedNodeId,
            notifyModified,
            clipboardNode,
            onCopy,
            onCut,
            onPaste
          }
        ),
        /* @__PURE__ */ jsx(ReactFlowInstanceCapture, { instanceRef: reactFlowInstanceRef }),
        /* @__PURE__ */ jsx(
          WorkflowCanvas,
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
            nodeExecutionStates
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        ExecutionConsole,
        {
          activeWorkflowId,
          workflowTabId,
          executions,
          activeExecutionId,
          onWorkflowUpdate,
          getWorkflowChatCanvasSnapshot,
          workflowChatClearNonce,
          onExecutionLogUpdate,
          onExecutionStatusUpdate,
          onExecutionNodeUpdate,
          onRemoveExecution
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      PropertyPanel,
      {
        selectedNodeId,
        setSelectedNodeId,
        selectedNodeIds,
        nodes,
        onSaveWorkflow
      }
    )
  ] });
}
export {
  WorkflowBuilderLayout
};
