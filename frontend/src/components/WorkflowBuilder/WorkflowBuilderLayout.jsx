import PropTypes from "prop-types";
import { nullableString } from "../../utils/propTypes";
import NodePanel from "../NodePanel";
import PropertyPanel from "../PropertyPanel";
import WorkflowCanvas from "../WorkflowCanvas";
import ExecutionConsole from "../ExecutionConsole";
import { KeyboardHandler } from "../KeyboardHandler";
import { ReactFlowInstanceCapture } from "../ReactFlowInstanceCapture";
import {
  WorkflowLayoutRow,
  WorkflowLayoutCenter,
  WorkflowCanvasHost,
} from "../../styles/workflowBuilderShell.styled";

function WorkflowBuilderLayout({
  graph,
  canvasHandlers,
  selection,
  keyboard,
  reactFlow,
  executionConsole,
  propertyPanel,
}) {
  const { nodes, edges, nodeExecutionStates } = graph;
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDrop,
    onDragOver,
    onNodeClick,
    onNodeContextMenu,
    onEdgeContextMenu,
    onPaneClick,
  } = canvasHandlers;
  const { selectedNodeId, setSelectedNodeId, notifyModified } = selection;
  const { clipboardHasContent, onCopy, onCut, onPaste } = keyboard;
  const { instanceRef, initialViewport = null, canvasVisible = true } =
    reactFlow;
  const {
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
    onActiveExecutionChange,
  } = executionConsole;
  return (
    <WorkflowLayoutRow>
      <NodePanel />
      <WorkflowLayoutCenter>
        <WorkflowCanvasHost>
          <KeyboardHandler
            selection={{
              selectedNodeId,
              setSelectedNodeId,
              notifyModified,
            }}
            keyboard={{
              clipboardHasContent,
              onCopy,
              onCut,
              onPaste,
            }}
          />
          <ReactFlowInstanceCapture instanceRef={instanceRef} />
          <WorkflowCanvas
            initialViewport={initialViewport}
            canvasVisible={canvasVisible}
            graph={{
              nodes,
              edges,
              nodeExecutionStates,
            }}
            handlers={{
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
          />
        </WorkflowCanvasHost>
        <ExecutionConsole
          workflowContext={{
            activeWorkflowId,
            workflowTabId,
          }}
          executionsState={{
            executions,
            activeExecutionId,
          }}
          chatBridge={{
            onWorkflowUpdate,
            getWorkflowChatCanvasSnapshot,
            workflowChatClearNonce,
          }}
          executionCallbacks={{
            onExecutionLogUpdate,
            onExecutionStatusUpdate,
            onExecutionNodeUpdate,
            onRemoveExecution,
            onActiveExecutionChange,
          }}
        />
      </WorkflowLayoutCenter>
      <PropertyPanel
        selection={selection}
        graph={{ nodes }}
        persistence={propertyPanel}
      />
    </WorkflowLayoutRow>
  );
}

WorkflowBuilderLayout.propTypes = {
  graph: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    edges: PropTypes.arrayOf(PropTypes.object).isRequired,
    nodeExecutionStates: PropTypes.object,
  }).isRequired,
  canvasHandlers: PropTypes.shape({
    onNodesChange: PropTypes.func.isRequired,
    onEdgesChange: PropTypes.func.isRequired,
    onConnect: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
    onDragOver: PropTypes.func.isRequired,
    onNodeClick: PropTypes.func.isRequired,
    onNodeContextMenu: PropTypes.func.isRequired,
    onEdgeContextMenu: PropTypes.func.isRequired,
    onPaneClick: PropTypes.func.isRequired,
  }).isRequired,
  selection: PropTypes.shape({
    selectedNodeId: nullableString,
    setSelectedNodeId: PropTypes.func.isRequired,
    selectedNodeIds: PropTypes.instanceOf(Set),
    notifyModified: PropTypes.func.isRequired,
  }).isRequired,
  keyboard: PropTypes.shape({
    clipboardHasContent: PropTypes.bool,
    onCopy: PropTypes.func.isRequired,
    onCut: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
  }).isRequired,
  reactFlow: PropTypes.shape({
    instanceRef: PropTypes.shape({ current: PropTypes.any }),
    initialViewport: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      zoom: PropTypes.number,
    }),
    canvasVisible: PropTypes.bool,
  }).isRequired,
  executionConsole: PropTypes.shape({
    activeWorkflowId: nullableString,
    workflowTabId: nullableString,
    executions: PropTypes.arrayOf(PropTypes.object),
    activeExecutionId: nullableString,
    onWorkflowUpdate: PropTypes.func.isRequired,
    getWorkflowChatCanvasSnapshot: PropTypes.func,
    workflowChatClearNonce: PropTypes.number,
    onExecutionLogUpdate: PropTypes.func,
    onExecutionStatusUpdate: PropTypes.func,
    onExecutionNodeUpdate: PropTypes.func,
    onRemoveExecution: PropTypes.func,
    onActiveExecutionChange: PropTypes.func,
  }).isRequired,
  propertyPanel: PropTypes.shape({
    onSaveWorkflow: PropTypes.func.isRequired,
  }).isRequired,
};

export { WorkflowBuilderLayout };
