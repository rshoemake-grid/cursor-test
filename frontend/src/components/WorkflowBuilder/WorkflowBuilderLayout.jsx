/**
 * Workflow Builder Layout Component
 * Extracted from WorkflowBuilder to improve SRP compliance
 * Single Responsibility: Only handles layout structure
 * DRY: Centralized layout structure
 */
import NodePanel from '../NodePanel';
import PropertyPanel from '../PropertyPanel';
import WorkflowCanvas from '../WorkflowCanvas';
import ExecutionConsole from '../ExecutionConsole';
import { KeyboardHandler } from '../KeyboardHandler';
import { ReactFlowInstanceCapture } from '../ReactFlowInstanceCapture';

export function WorkflowBuilderLayout({
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
    executions,
    activeExecutionId,
    onWorkflowUpdate,
    onExecutionLogUpdate,
    onExecutionStatusUpdate,
    onExecutionNodeUpdate,
    onRemoveExecution,
    onSaveWorkflow
}) {
    return (
        <div className="flex-1 flex overflow-hidden">
            <NodePanel />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 relative">
                    <KeyboardHandler
                        selectedNodeId={selectedNodeId}
                        setSelectedNodeId={setSelectedNodeId}
                        notifyModified={notifyModified}
                        clipboardNode={clipboardNode}
                        onCopy={onCopy}
                        onCut={onCut}
                        onPaste={onPaste}
                    />
                    <ReactFlowInstanceCapture instanceRef={reactFlowInstanceRef} />
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
                <ExecutionConsole
                    activeWorkflowId={activeWorkflowId}
                    executions={executions}
                    activeExecutionId={activeExecutionId}
                    onWorkflowUpdate={onWorkflowUpdate}
                    onExecutionLogUpdate={onExecutionLogUpdate}
                    onExecutionStatusUpdate={onExecutionStatusUpdate}
                    onExecutionNodeUpdate={onExecutionNodeUpdate}
                    onRemoveExecution={onRemoveExecution}
                />
            </div>
            <PropertyPanel
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                selectedNodeIds={selectedNodeIds}
                nodes={nodes}
                onSaveWorkflow={onSaveWorkflow}
            />
        </div>
    );
}
