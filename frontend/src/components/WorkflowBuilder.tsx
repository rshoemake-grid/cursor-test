import React, { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import NodePanel from './NodePanel'
import PropertyPanel from './PropertyPanel'
import Toolbar from './Toolbar'
import { useWorkflowStore } from '../store/workflowStore'
import { api } from '../api/client'

interface WorkflowBuilderProps {
  workflowId: string | null
  onExecutionStart?: (executionId: string) => void
}

export default function WorkflowBuilder({ workflowId, onExecutionStart }: WorkflowBuilderProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    loadWorkflow,
  } = useWorkflowStore()

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)

  // Sync with store
  useEffect(() => {
    setNodes(storeNodes)
  }, [storeNodes, setNodes])

  useEffect(() => {
    setEdges(storeEdges)
  }, [storeEdges, setEdges])

  useEffect(() => {
    setStoreNodes(nodes)
  }, [nodes, setStoreNodes])

  useEffect(() => {
    setStoreEdges(edges)
  }, [edges, setStoreEdges])

  // Load workflow if ID provided
  useEffect(() => {
    if (workflowId) {
      api.getWorkflow(workflowId).then((workflow) => {
        loadWorkflow(workflow)
      })
    }
  }, [workflowId, loadWorkflow])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 150,
      }

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          inputs: [],
        },
      }

      addNode(newNode)
    },
    [addNode]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id)
    },
    []
  )

  return (
    <ReactFlowProvider>
      <div className="h-full flex">
        {/* Left Panel - Node Palette */}
        <NodePanel />

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <Toolbar onExecutionStart={onExecutionStart} />
          
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
            <Controls />
            <MiniMap
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
                  default:
                    return '#94a3b8'
                }
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

      {/* Right Panel - Properties */}
      <PropertyPanel selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} />
    </div>
    </ReactFlowProvider>
  )
}

