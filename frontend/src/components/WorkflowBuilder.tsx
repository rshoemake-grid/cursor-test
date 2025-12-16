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

interface Execution {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  nodes: Record<string, any>
  logs: Array<{ timestamp: string; message: string; level: string; node_id?: string }>
}

interface WorkflowTab {
  workflowId: string
  workflowName: string
  executions: Execution[]
  activeExecutionId: string | null
}

export default function WorkflowBuilder({ workflowId, onExecutionStart }: WorkflowBuilderProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    workflowId: storeWorkflowId,
    workflowName,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    loadWorkflow,
  } = useWorkflowStore()

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [workflowTabs, setWorkflowTabs] = useState<WorkflowTab[]>([])
  const workflowTabsRef = useRef<WorkflowTab[]>([])
  
  // Keep ref in sync with state
  useEffect(() => {
    workflowTabsRef.current = workflowTabs
  }, [workflowTabs])

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

  // Load workflow if ID provided and create/activate tab
  useEffect(() => {
    if (workflowId) {
      api.getWorkflow(workflowId).then((workflow) => {
        loadWorkflow(workflow)
        
        // Create or activate workflow tab
        setWorkflowTabs(prev => {
          const existingTab = prev.find(tab => tab.workflowId === workflowId)
          if (existingTab) {
            // Tab already exists, just return current state
            return prev
          }
          // Create new tab
          return [...prev, {
            workflowId: workflowId,
            workflowName: workflow.name,
            executions: [],
            activeExecutionId: null
          }]
        })
      })
    }
  }, [workflowId, loadWorkflow])

  // Ensure current workflow has a tab
  useEffect(() => {
    if (storeWorkflowId && workflowName) {
      setWorkflowTabs(prev => {
        const existingTab = prev.find(tab => tab.workflowId === storeWorkflowId)
        if (existingTab) {
          // Update name if changed
          return prev.map(tab => 
            tab.workflowId === storeWorkflowId 
              ? { ...tab, workflowName } 
              : tab
          )
        }
        // Create new tab for current workflow
        return [...prev, {
          workflowId: storeWorkflowId,
          workflowName: workflowName,
          executions: [],
          activeExecutionId: null
        }]
      })
    }
  }, [storeWorkflowId, workflowName])

  // Poll for execution updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Use ref to access current state without triggering effect re-run
      const currentTabs = workflowTabsRef.current
      const allExecutions = currentTabs.flatMap(tab => tab.executions)
      const runningExecutions = allExecutions.filter(e => e.status === 'running')
      
      if (runningExecutions.length === 0) return

      // Update all running executions
      const updates = await Promise.all(
        runningExecutions.map(async (exec) => {
          try {
            const execution = await api.getExecution(exec.id)
            return {
              id: exec.id,
              status: execution.status === 'completed' ? 'completed' as const :
                      execution.status === 'failed' ? 'failed' as const :
                      'running' as const,
              startedAt: exec.startedAt,
              completedAt: execution.completed_at ? new Date(execution.completed_at) : undefined,
              nodes: execution.node_states || {},
              logs: execution.logs || []
            }
          } catch (error) {
            console.error('Failed to fetch execution:', error)
            return null
          }
        })
      )

      // Apply updates to workflow tabs
      setWorkflowTabs(prev => prev.map(tab => ({
        ...tab,
        executions: tab.executions.map(exec => {
          const update = updates.find(u => u && u.id === exec.id)
          return update || exec
        })
      })))
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, []) // ✅ Empty dependency array - interval runs consistently

  // Handle execution start
  const handleExecutionStart = useCallback((executionId: string) => {
    const currentWorkflowId = storeWorkflowId || 'unsaved'
    const currentWorkflowName = workflowName || 'Unsaved Workflow'
    
    // Add new execution to the current workflow's tab
    const newExecution: Execution = {
      id: executionId,
      status: 'running',
      startedAt: new Date(),
      nodes: {},
      logs: []
    }
    
    setWorkflowTabs(prev => {
      const existingTab = prev.find(tab => tab.workflowId === currentWorkflowId)
      if (existingTab) {
        // Add to existing tab
        return prev.map(tab => 
          tab.workflowId === currentWorkflowId
            ? { 
                ...tab, 
                executions: [newExecution, ...tab.executions],
                activeExecutionId: executionId
              }
            : tab
        )
      }
      // Create new tab with this execution
      return [...prev, {
        workflowId: currentWorkflowId,
        workflowName: currentWorkflowName,
        executions: [newExecution],
        activeExecutionId: executionId
      }]
    })

    // Also call parent callback if provided
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [storeWorkflowId, workflowName, onExecutionStart])

  // Handle closing workflow tabs
  const handleCloseWorkflow = useCallback((workflowId: string) => {
    setWorkflowTabs(prev => prev.filter(tab => tab.workflowId !== workflowId))
  }, [])

  // Handle clearing executions for a workflow
  const handleClearExecutions = useCallback((workflowId: string) => {
    setWorkflowTabs(prev => prev.map(tab => 
      tab.workflowId === workflowId
        ? { ...tab, executions: [], activeExecutionId: null }
        : tab
    ))
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
        workflowTabs={workflowTabs}
        activeWorkflowId={storeWorkflowId || null}
        onCloseWorkflow={handleCloseWorkflow}
        onClearExecutions={handleClearExecutions}
      />
    </ReactFlowProvider>
  )
}

