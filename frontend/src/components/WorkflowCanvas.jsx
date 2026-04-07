import { useMemo, memo } from "react";
import styled from "styled-components";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import { colors as c } from "../styles/designTokens";
import { nodeTypes } from "./nodes";
import { WorkflowCanvasAbsolute } from "../styles/workflowBuilderShell.styled";

const StyledReactFlow = styled(ReactFlow)`
  width: 100%;
  height: 100%;
  background: ${c.gray50};
`;

const StyledMiniMap = styled(MiniMap)`
  border: 2px solid ${c.gray300};
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
`;

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
    <WorkflowCanvasAbsolute>
      <StyledReactFlow
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
        defaultEdgeOptions={{
          style: {
            strokeWidth: 3,
          },
        }}
      >
        <Controls />
        <StyledMiniMap nodeColor={nodeColor} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </StyledReactFlow>
    </WorkflowCanvasAbsolute>
  );
});
var stdin_default = WorkflowCanvas;
export { stdin_default as default };
