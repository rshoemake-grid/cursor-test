import React, { useCallback, useEffect, useState } from 'react'
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
import ExecutionConsole from './ExecutionConsole'
import { useWorkflowStore } from '../store/workflowStore'
import { api } from '../api/client'

interface WorkflowBuilderProps {
  workflowId: string | null
  onExecutionStart?: (executionId: string) => void
}

interface ExecutionTab {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  nodes: Record<string, any>
  logs: Array<{ timestamp: string; message: string; level: string }>
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
  const [activeExecutions, setActiveExecutions] = useState<ExecutionTab[]>([])

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

  // Poll for execution updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeExecutions.length === 0) return

      const updatedExecutions = await Promise.all(
        activeExecutions.map(async (exec) => {
          try {
            const execution = await api.getExecution(exec.id)
            return {
              id: exec.id,
              status: execution.status === 'completed' ? 'completed' as const :
                      execution.status === 'failed' ? 'failed' as const :
                      'running' as const,
              startedAt: exec.startedAt,
              nodes: execution.node_states || {},
              logs: execution.logs || []
            }
          } catch (error) {
            console.error('Failed to fetch execution:', error)
            return exec
          }
        })
      )

      setActiveExecutions(updatedExecutions)
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [activeExecutions])

  // Handle execution start
  const handleExecutionStart = useCallback((executionId: string) => {
    // Add new execution to the console
    const newExecution: ExecutionTab = {
      id: executionId,
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: []
    }
    setActiveExecutions(prev => [newExecution, ...prev])

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [onExecutionStart])

  // Handle closing execution tabs
  const handleCloseExecution = useCallback((executionId: string) => {
    setActiveExecutions(prev => prev.filter(e => e.id !== executionId))
  }, [])

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
          <Toolbar onExecutionStart={handleExecutionStart} />
          
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

      {/* Bottom Panel - Execution Console */}
      <ExecutionConsole 
        executions={activeExecutions}
        onClose={handleCloseExecution}
      />
    </ReactFlowProvider>
  )
}

