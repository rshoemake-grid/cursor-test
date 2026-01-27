/**
 * Workflow Canvas Component
 * Encapsulates ReactFlow rendering and canvas event handling
 */

import React from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import { nodeTypes } from './nodes'

interface WorkflowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  onDrop: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void
  onEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void
  onPaneClick: (event: React.MouseEvent) => void
  nodeExecutionStates?: Record<string, { status: string; error?: string }>
}

export default function WorkflowCanvas({
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
}: WorkflowCanvasProps) {
  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodes.map((node: any) => {
          // Update nodes with current execution state
          const nodeExecutionState = nodeExecutionStates[node.id]
          return {
            ...node,
            data: {
              ...node.data,
              executionStatus: nodeExecutionState?.status,
              executionError: nodeExecutionState?.error,
            }
          }
        })}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={(event) => onPaneClick(event)}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        panOnDrag={[1, 2]} // Allow panning with middle mouse button or with two fingers
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectionOnDrag={true} // Enable box selection by dragging on canvas
        selectNodesOnDrag={false} // Don't select nodes when dragging them individually
        fitView
        className="bg-gray-50"
        defaultEdgeOptions={{
          style: { strokeWidth: 3 },
        }}
      >
        <Controls />
        <MiniMap
          className="border-2 border-gray-300 rounded-lg shadow-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'agent':
                return '#3b82f6'
              case 'condition':
                return '#a855f7'
              case 'loop':
                return '#22c55e'
              case 'start':
                return '#0ea5e9'
              case 'end':
                return '#6b7280'
              case 'gcp_bucket':
                return '#f97316'
              case 'aws_s3':
                return '#eab308'
              case 'gcp_pubsub':
                return '#a855f7'
              case 'local_filesystem':
                return '#22c55e'
              default:
                return '#94a3b8'
            }
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
