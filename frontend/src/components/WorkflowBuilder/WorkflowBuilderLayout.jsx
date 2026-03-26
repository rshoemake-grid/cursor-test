import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workflow Builder Layout Component
 * Extracted from WorkflowBuilder to improve SRP compliance
 * Single Responsibility: Only handles layout structure
 */ import React from 'react';
import NodePanel from '../NodePanel';
import PropertyPanel from '../PropertyPanel';
import WorkflowCanvas from '../WorkflowCanvas';
import ExecutionConsole from '../ExecutionConsole';
import { KeyboardHandler } from '../KeyboardHandler';
import { ReactFlowInstanceCapture } from '../ReactFlowInstanceCapture';
/**
 * Workflow Builder Layout Component
 * DRY: Centralized layout structure
 */ export function WorkflowBuilderLayout({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onDrop, onDragOver, onNodeClick, onNodeContextMenu, onEdgeContextMenu, onPaneClick, nodeExecutionStates, selectedNodeId, setSelectedNodeId, notifyModified, clipboardNode, onCopy, onCut, onPaste, reactFlowInstanceRef, selectedNodeIds, activeWorkflowId, executions, activeExecutionId, onWorkflowUpdate, onExecutionLogUpdate, onExecutionStatusUpdate, onExecutionNodeUpdate, onRemoveExecution, onSaveWorkflow }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex-1 flex overflow-hidden",
        children: [
            /*#__PURE__*/ _jsx(NodePanel, {}),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex-1 flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex-1 relative",
                        children: [
                            /*#__PURE__*/ _jsx(KeyboardHandler, {
                                selectedNodeId: selectedNodeId,
                                setSelectedNodeId: setSelectedNodeId,
                                notifyModified: notifyModified,
                                clipboardNode: clipboardNode,
                                onCopy: onCopy,
                                onCut: onCut,
                                onPaste: onPaste
                            }),
                            /*#__PURE__*/ _jsx(ReactFlowInstanceCapture, {
                                instanceRef: reactFlowInstanceRef
                            }),
                            /*#__PURE__*/ _jsx(WorkflowCanvas, {
                                nodes: nodes,
                                edges: edges,
                                onNodesChange: onNodesChange,
                                onEdgesChange: onEdgesChange,
                                onConnect: onConnect,
                                onDrop: onDrop,
                                onDragOver: onDragOver,
                                onNodeClick: onNodeClick,
                                onNodeContextMenu: onNodeContextMenu,
                                onEdgeContextMenu: onEdgeContextMenu,
                                onPaneClick: onPaneClick,
                                nodeExecutionStates: nodeExecutionStates
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(ExecutionConsole, {
                        activeWorkflowId: activeWorkflowId,
                        executions: executions,
                        activeExecutionId: activeExecutionId,
                        onWorkflowUpdate: onWorkflowUpdate,
                        onExecutionLogUpdate: onExecutionLogUpdate,
                        onExecutionStatusUpdate: onExecutionStatusUpdate,
                        onExecutionNodeUpdate: onExecutionNodeUpdate,
                        onRemoveExecution: onRemoveExecution
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(PropertyPanel, {
                selectedNodeId: selectedNodeId,
                setSelectedNodeId: setSelectedNodeId,
                selectedNodeIds: selectedNodeIds,
                nodes: nodes,
                onSaveWorkflow: onSaveWorkflow
            })
        ]
    });
}
