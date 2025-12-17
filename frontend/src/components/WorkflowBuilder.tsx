import React, { useCallback, useEffect, useState, useRef } from 'react'
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
import { api } from '../api/client'

interface Execution {
  id: string
  status: string
  startedAt: Date
  nodes: Record<string, any>
  logs: any[]
}

interface WorkflowTab {
  workflowId: string
  workflowName: string
  executions: Execution[]
  activeExecutionId: string | null
}

interface WorkflowBuilderProps {
  tabId: string
  workflowId: string | null
  workflowTabs?: WorkflowTab[] // Execution data from parent
  onExecutionStart?: (executionId: string) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
  onWorkflowModified?: () => void
  onWorkflowLoaded?: (workflowId: string, name: string) => void
  onCloseWorkflow?: (workflowId: string) => void
  onClearExecutions?: (workflowId: string) => void
}

export default function WorkflowBuilder({ 
  tabId,
  workflowId,
  workflowTabs = [],
  onExecutionStart,
  onWorkflowSaved,
  onWorkflowModified,
  onWorkflowLoaded,
  onCloseWorkflow,
  onClearExecutions
}: WorkflowBuilderProps) {
  // Local state for this tab - NOT using global store
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [localWorkflowId, setLocalWorkflowId] = useState<string | null>(workflowId)
  const [localWorkflowName, setLocalWorkflowName] = useState<string>('Untitled Workflow')
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, any>>({})
  const isLoadingRef = useRef<boolean>(false)

  // Track modifications
  const notifyModified = useCallback(() => {
    if (onWorkflowModified && !isLoadingRef.current) {
      onWorkflowModified()
    }
  }, [onWorkflowModified])

  // Wrap React Flow change handlers to notify modifications
  const onNodesChange = useCallback((changes: any) => {
    onNodesChangeBase(changes)
    // Only notify on actual modifications (not selection or dimensions)
    const hasActualChange = changes.some((change: any) => 
      change.type === 'add' || change.type === 'remove' || change.type === 'reset'
    )
    if (hasActualChange) {
      notifyModified()
    }
  }, [onNodesChangeBase, notifyModified])

  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeBase(changes)
    // Only notify on actual modifications (not selection)
    const hasActualChange = changes.some((change: any) => 
      change.type === 'add' || change.type === 'remove' || change.type === 'reset'
    )
    if (hasActualChange) {
      notifyModified()
    }
  }, [onEdgesChangeBase, notifyModified])

  // Helper to convert WorkflowNode to React Flow Node
  const workflowNodeToNode = useCallback((wfNode: any) => {
    const data = wfNode.data || {}
    return {
      id: wfNode.id,
      type: wfNode.type,
      position: wfNode.position || { x: 0, y: 0 },
      data: {
        label: data.label || data.name || wfNode.name || wfNode.type,
        name: data.name || wfNode.name || wfNode.type,
        description: data.description || wfNode.description,
        agent_config: data.agent_config || wfNode.agent_config,
        condition_config: data.condition_config || wfNode.condition_config,
        loop_config: data.loop_config || wfNode.loop_config,
        inputs: data.inputs || wfNode.inputs || [],
      },
    }
  }, [])

  // Load workflow if ID provided and create/activate tab
  useEffect(() => {
    if (workflowId) {
      isLoadingRef.current = true // Prevent marking as modified during load
      api.getWorkflow(workflowId).then((workflow) => {
        // Set local state for this tab
        setLocalWorkflowId(workflow.id!)
        setLocalWorkflowName(workflow.name)
        setLocalWorkflowDescription(workflow.description || '')
        setVariables(workflow.variables || {})
        setNodes(workflow.nodes.map(workflowNodeToNode))
        setEdges(workflow.edges as any[])
        
        // Allow modifications after load completes
        setTimeout(() => {
          isLoadingRef.current = false
        }, 100)
        
        // Notify parent that workflow was loaded
        if (onWorkflowLoaded) {
          onWorkflowLoaded(workflowId, workflow.name)
        }
      }).catch(err => {
        console.error("Failed to load workflow:", err)
        isLoadingRef.current = false
      })
    } else {
      // New workflow - make sure loading flag is off
      isLoadingRef.current = false
    }
  }, [workflowId, onWorkflowLoaded, workflowNodeToNode, setNodes, setEdges])

  // Handle execution start - just call parent callback
  const handleExecutionStart = useCallback((executionId: string) => {
    // Parent (WorkflowTabs) handles execution tracking
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [onExecutionStart])

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

      // Add to local nodes state
      setNodes((nds) => [...nds, newNode])
      notifyModified()
    },
    [setNodes, notifyModified]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id)
    },
    []
  )

  return (
    <ReactFlowProvider>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Node Palette (Full Height) */}
        <NodePanel />

        {/* Middle Section - Workflow Canvas + Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 relative">
            <Toolbar 
              workflowId={localWorkflowId}
              workflowName={localWorkflowName}
              workflowDescription={localWorkflowDescription}
              nodes={nodes}
              edges={edges}
              variables={variables}
              onExecutionStart={handleExecutionStart}
              onWorkflowSaved={onWorkflowSaved}
              onWorkflowNameChange={setLocalWorkflowName}
              onWorkflowDescriptionChange={setLocalWorkflowDescription}
              onWorkflowIdChange={setLocalWorkflowId}
            />
            
            <div className="absolute inset-0">
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
          </div>

          {/* Bottom: Execution Console (Only under workflow canvas) */}
          <ExecutionConsole 
            workflowTabs={workflowTabs}
            activeWorkflowId={localWorkflowId || null}
            onCloseWorkflow={onCloseWorkflow || (() => {})}
            onClearExecutions={onClearExecutions || (() => {})}
          />
        </div>

        {/* Right Panel - Properties (Full Height) */}
        <PropertyPanel selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} />
      </div>
    </ReactFlowProvider>
  )
}

