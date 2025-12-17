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

interface WorkflowBuilderProps {
  tabId: string
  workflowId: string | null
  onExecutionStart?: (executionId: string) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
  onWorkflowModified?: () => void
  onWorkflowLoaded?: (workflowId: string, name: string) => void
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

export default function WorkflowBuilder({ 
  tabId,
  workflowId, 
  onExecutionStart,
  onWorkflowSaved,
  onWorkflowModified,
  onWorkflowLoaded
}: WorkflowBuilderProps) {
  // Local state for this tab - NOT using global store
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [localWorkflowId, setLocalWorkflowId] = useState<string | null>(workflowId)
  const [localWorkflowName, setLocalWorkflowName] = useState<string>('Untitled Workflow')
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [workflowTabs, setWorkflowTabs] = useState<WorkflowTab[]>([])
  const workflowTabsRef = useRef<WorkflowTab[]>([])
  const isLoadingRef = useRef<boolean>(false)
  
  // Keep ref in sync with state
  useEffect(() => {
    workflowTabsRef.current = workflowTabs
  }, [workflowTabs])

  // Track modifications
  const notifyModified = useCallback(() => {
    // Temporarily disabled to isolate UI issues
    // if (onWorkflowModified && !isLoadingRef.current) {
    //   onWorkflowModified()
    // }
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
        
        // Create or activate workflow tab (for console)
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
      }).catch(err => {
        console.error("Failed to load workflow:", err)
        isLoadingRef.current = false
      })
    } else {
      // New workflow - make sure loading flag is off
      isLoadingRef.current = false
    }
  }, [workflowId, onWorkflowLoaded, workflowNodeToNode, setNodes, setEdges])

  // Ensure current workflow has a tab (for console)
  useEffect(() => {
    if (localWorkflowId && localWorkflowName) {
      setWorkflowTabs(prev => {
        const existingTab = prev.find(tab => tab.workflowId === localWorkflowId)
        if (existingTab) {
          // Update name if changed
          return prev.map(tab => 
            tab.workflowId === localWorkflowId 
              ? { ...tab, workflowName: localWorkflowName } 
              : tab
          )
        }
        // Create new tab for current workflow
        return [...prev, {
          workflowId: localWorkflowId,
          workflowName: localWorkflowName,
          executions: [],
          activeExecutionId: null
        }]
      })
    }
  }, [localWorkflowId, localWorkflowName])

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
    const currentWorkflowId = localWorkflowId || `unsaved-${tabId}`
    const currentWorkflowName = localWorkflowName || 'Unsaved Workflow'
    
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
  }, [localWorkflowId, localWorkflowName, tabId, onExecutionStart])

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
      <div className="h-full flex">
        {/* Left Panel - Node Palette */}
        <NodePanel />

        {/* Main Canvas */}
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

