import { useMemo, memo, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
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

/**
 * Applies pan/zoom when the tab becomes visible or when a saved viewport arrives from the parent.
 * Built-in {@code defaultViewport} / {@code fitView} do not react to prop changes; hidden tabs (display:none)
 * also get wrong measurements if fitView runs while inactive.
 *
 * When a workflow is opened from the server, nodes arrive after the first paint; without
 * {@code graphNodeCount} we would only fitView the empty graph and later restore that bad viewport
 * from the tab strip cache after switching tabs.
 *
 * Tabs hide the canvas with {@code display:none}. While hidden the pane has no layout size; React Flow
 * often needs a deferred {@code fitView} when the tab is shown again or the graph stays blank even
 * though nodes are still in state.
 */
function ReactFlowViewportSync({
  initialViewport,
  canvasVisible,
  graphNodeCount = 0,
}) {
  const { setViewport, fitView } = useReactFlow();
  const prevVisibleNodeCountRef = useRef({ visible: false, count: -1 });
  /** False on first paint if this instance mounts visible; set true whenever {@code canvasVisible} is false. */
  const wasCanvasHiddenRef = useRef(!canvasVisible);
  const savedKey = useMemo(() => {
    if (
      initialViewport != null &&
      typeof initialViewport === "object" &&
      Number.isFinite(initialViewport.x) &&
      Number.isFinite(initialViewport.y) &&
      Number.isFinite(initialViewport.zoom)
    ) {
      return `${initialViewport.x}|${initialViewport.y}|${initialViewport.zoom}`;
    }
    return "";
  }, [initialViewport]);

  useLayoutEffect(() => {
    if (!canvasVisible) {
      wasCanvasHiddenRef.current = true;
      return;
    }

    const justShown = wasCanvasHiddenRef.current;
    wasCanvasHiddenRef.current = false;

    const apply = () => {
      if (savedKey) {
        const parts = savedKey.split("|").map(Number);
        setViewport(
          { x: parts[0], y: parts[1], zoom: parts[2] },
          { duration: 0 },
        );
        prevVisibleNodeCountRef.current = {
          visible: true,
          count: graphNodeCount,
        };
        return;
      }
      const prev = prevVisibleNodeCountRef.current;
      const prevCount = prev.visible ? prev.count : -1;
      if (graphNodeCount === 0) {
        fitView({ padding: 0.2, duration: 0 });
        prevVisibleNodeCountRef.current = { visible: true, count: 0 };
        return;
      }
      if (prevCount <= 0) {
        fitView({ padding: 0.2, duration: 0 });
      } else if (justShown) {
        fitView({ padding: 0.2, duration: 0 });
      }
      prevVisibleNodeCountRef.current = { visible: true, count: graphNodeCount };
    };

    if (justShown) {
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(apply);
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    apply();
    // setViewport / fitView from useReactFlow are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [canvasVisible, savedKey, graphNodeCount]);
  return null;
}

const WorkflowCanvas = memo(function WorkflowCanvas2({
  graph,
  handlers,
  initialViewport = null,
  canvasVisible = true,
}) {
  const { nodes, edges, nodeExecutionStates = {} } = graph;
  const graphNodeCount = nodes.length;
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
  } = handlers;
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
  const hasSavedViewport =
    initialViewport != null &&
    typeof initialViewport === "object" &&
    Number.isFinite(initialViewport.x) &&
    Number.isFinite(initialViewport.y) &&
    Number.isFinite(initialViewport.zoom);
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
        defaultViewport={
          hasSavedViewport
            ? {
                x: initialViewport.x,
                y: initialViewport.y,
                zoom: initialViewport.zoom,
              }
            : undefined
        }
        fitView={false}
        defaultEdgeOptions={{
          style: {
            strokeWidth: 3,
          },
        }}
      >
        <ReactFlowViewportSync
          initialViewport={initialViewport}
          canvasVisible={canvasVisible}
          graphNodeCount={graphNodeCount}
        />
        <Controls />
        <StyledMiniMap nodeColor={nodeColor} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </StyledReactFlow>
    </WorkflowCanvasAbsolute>
  );
});

WorkflowCanvas.propTypes = {
  canvasVisible: PropTypes.bool,
  graph: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    edges: PropTypes.arrayOf(PropTypes.object).isRequired,
    nodeExecutionStates: PropTypes.object,
  }).isRequired,
  initialViewport: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    zoom: PropTypes.number,
  }),
  handlers: PropTypes.shape({
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
};

var stdin_default = WorkflowCanvas;
export { stdin_default as default };
