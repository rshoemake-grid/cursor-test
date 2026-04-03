import { useMemo, memo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import { nodeTypes } from "./nodes";
const WorkflowCanvas = memo(function WorkflowCanvas2({
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
  nodeExecutionStates = {},
}) {
  const nodesWithExecutionState = useMemo(() => {
    return nodes.map((node) => {
      const nodeExecutionState = nodeExecutionStates[node.id];
      return {
        ...node,
        data: {
          ...node.data,
          executionStatus: nodeExecutionState?.status,
          executionError: nodeExecutionState?.error,
        },
      };
    });
  }, [nodes, nodeExecutionStates]);
  const nodeColor = useMemo(
    () => (node) => {
      switch (node.type) {
        case "agent":
          return "#3b82f6";
        case "condition":
          return "#a855f7";
        case "loop":
          return "#22c55e";
        case "start":
          return "#0ea5e9";
        case "end":
          return "#6b7280";
        case "gcp_bucket":
          return "#f97316";
        case "aws_s3":
          return "#eab308";
        case "gcp_pubsub":
          return "#a855f7";
        case "local_filesystem":
          return "#22c55e";
        default:
          return "#94a3b8";
      }
    },
    [],
  );
  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodesWithExecutionState}
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
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        panOnDrag={[1, 2]}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectionOnDrag={true}
        selectNodesOnDrag={false}
        fitView={true}
        className="bg-gray-50"
        defaultEdgeOptions={{
          style: {
            strokeWidth: 3,
          },
        }}
      >
        <Controls />
        <MiniMap
          className="border-2 border-gray-300 rounded-lg shadow-lg"
          nodeColor={nodeColor}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
});
var stdin_default = WorkflowCanvas;
export { stdin_default as default };
