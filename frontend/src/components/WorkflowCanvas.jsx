import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workflow Canvas Component
 * Encapsulates ReactFlow rendering and canvas event handling
 * Performance: Memoized to prevent unnecessary re-renders
 */ import React, { useMemo, memo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, BackgroundVariant } from '@xyflow/react';
import { nodeTypes } from './nodes';
const WorkflowCanvas = /*#__PURE__*/ memo(function WorkflowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onDrop, onDragOver, onNodeClick, onNodeContextMenu, onEdgeContextMenu, onPaneClick, nodeExecutionStates = {} }) {
    // Memoize nodes transformation to prevent unnecessary recalculations
    const nodesWithExecutionState = useMemo(()=>{
        return nodes.map((node)=>{
            // Update nodes with current execution state
            const nodeExecutionState = nodeExecutionStates[node.id];
            return {
                ...node,
                data: {
                    ...node.data,
                    executionStatus: nodeExecutionState?.status,
                    executionError: nodeExecutionState?.error
                }
            };
        });
    }, [
        nodes,
        nodeExecutionStates
    ]);
    // Memoize nodeColor function to prevent recreation on each render
    const nodeColor = useMemo(()=>(node)=>{
            switch(node.type){
                case 'agent':
                    return '#3b82f6';
                case 'condition':
                    return '#a855f7';
                case 'loop':
                    return '#22c55e';
                case 'start':
                    return '#0ea5e9';
                case 'end':
                    return '#6b7280';
                case 'gcp_bucket':
                    return '#f97316';
                case 'aws_s3':
                    return '#eab308';
                case 'gcp_pubsub':
                    return '#a855f7';
                case 'local_filesystem':
                    return '#22c55e';
                default:
                    return '#94a3b8';
            }
        }, []);
    return /*#__PURE__*/ _jsx("div", {
        className: "absolute inset-0",
        children: /*#__PURE__*/ _jsxs(ReactFlow, {
            nodes: nodesWithExecutionState,
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
            nodeTypes: nodeTypes,
            nodesDraggable: true,
            nodesConnectable: true,
            panOnDrag: [
                1,
                2
            ],
            panOnScroll: true,
            zoomOnScroll: true,
            zoomOnPinch: true,
            selectionOnDrag: true,
            selectNodesOnDrag: false,
            fitView: true,
            className: "bg-gray-50",
            defaultEdgeOptions: {
                style: {
                    strokeWidth: 3
                }
            },
            children: [
                /*#__PURE__*/ _jsx(Controls, {}),
                /*#__PURE__*/ _jsx(MiniMap, {
                    className: "border-2 border-gray-300 rounded-lg shadow-lg",
                    nodeColor: nodeColor
                }),
                /*#__PURE__*/ _jsx(Background, {
                    variant: BackgroundVariant.Dots,
                    gap: 12,
                    size: 1
                })
            ]
        })
    });
});
export default WorkflowCanvas;
