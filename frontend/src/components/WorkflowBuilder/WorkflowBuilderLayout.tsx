/**
 * Workflow Builder Layout Component
 * Extracted from WorkflowBuilder to improve SRP compliance
 * Single Responsibility: Only handles layout structure
 */

import React from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import NodePanel from '../NodePanel'
import PropertyPanel from '../PropertyPanel'
import WorkflowCanvas from '../WorkflowCanvas'
import ExecutionConsole from '../ExecutionConsole'
import { KeyboardHandler } from '../KeyboardHandler'
import { ReactFlowInstanceCapture } from '../ReactFlowInstanceCapture'
import type { Node, Edge } from '@xyflow/react'

export interface WorkflowBuilderLayoutProps {
  // Canvas props
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: any) => void
  onDrop: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void
  onEdgeContextMenu: (event: React.MouseEvent, edge: any) => void
  onPaneClick: (event: React.MouseEvent) => void
  nodeExecutionStates: Record<string, { status: string; error?: string }>
  
  // Keyboard handler props
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  notifyModified: () => void
  clipboardNode: Node | null
  onCopy: (node: Node) => void
  onCut: (node: Node) => void
  onPaste: () => void
  
  // ReactFlow instance ref
  reactFlowInstanceRef: React.RefObject<any>
  
  // Property panel props
  selectedNodeIds: Set<string>
  
  // Execution console props
  activeWorkflowId: string | null
  executions: any[]
  activeExecutionId: string | null
  onWorkflowUpdate: (update: any) => void
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: any) => void
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void
  onRemoveExecution?: (workflowId: string, executionId: string) => void
  
  // Save workflow callback
  onSaveWorkflow: () => Promise<string | null>
}

/**
 * Workflow Builder Layout Component
 * DRY: Centralized layout structure
 */
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
  onSaveWorkflow,
}: WorkflowBuilderLayoutProps) {
  return (
    <ReactFlowProvider>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Node Palette (Full Height) */}
        <NodePanel />

        {/* Middle Section - Workflow Canvas + Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Area */}
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

          {/* Bottom: Chat Console */}
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

        {/* Right Panel - Properties (Full Height) */}
        <PropertyPanel 
          selectedNodeId={selectedNodeId} 
          setSelectedNodeId={setSelectedNodeId}
          selectedNodeIds={selectedNodeIds}
          nodes={nodes}
          onSaveWorkflow={onSaveWorkflow}
        />
      </div>
    </ReactFlowProvider>
  )
}
