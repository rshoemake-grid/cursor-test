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
  applyNodeChanges,
  type Connection,
  type NodeChange,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import NodePanel from './NodePanel'
import PropertyPanel from './PropertyPanel'
import Toolbar from './Toolbar'
import ExecutionConsole from './ExecutionConsole'
import ContextMenu from './NodeContextMenu'
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
  
  // Refs to access current nodes/edges in callbacks
  const nodesRef = React.useRef(nodes)
  const edgesRef = React.useRef(edges)
  
  // Keep refs in sync with state
  React.useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])
  
  React.useEffect(() => {
    edgesRef.current = edges
  }, [edges])
  const [localWorkflowName, setLocalWorkflowName] = useState<string>('Untitled Workflow')
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, any>>({})
  const isLoadingRef = useRef<boolean>(false)
  const isDraggingRef = useRef<boolean>(false)
  const lastLoadedWorkflowIdRef = useRef<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ nodeId?: string; edgeId?: string; x: number; y: number } | null>(null)

  // Track modifications
  const notifyModified = useCallback(() => {
    if (onWorkflowModified && !isLoadingRef.current) {
      onWorkflowModified()
    }
  }, [onWorkflowModified])

  // Wrap React Flow change handlers to notify modifications
  const onNodesChange = useCallback((changes: any) => {
    // Handle selection changes - sync our state with React Flow's selection
    const selectChange = changes.find((c: any) => c.type === 'select')
    if (selectChange) {
      if (selectChange.selected) {
        setSelectedNodeId(selectChange.id)
      } else {
        // Check if any node is still selected by looking at current nodes
        const stillSelected = nodes.find((n: any) => n.selected && n.id !== selectChange.id)
        if (!stillSelected) {
          setSelectedNodeId(null)
        }
      }
    }
    
    // Pass all changes to base handler - this handles position changes, etc.
    onNodesChangeBase(changes)
    
    // Notify on actual modifications (position changes, add, remove, etc.)
    const hasActualChange = changes.some((change: any) => 
      change.type === 'position' || 
      change.type === 'dimensions' ||
      change.type === 'add' || 
      change.type === 'remove' || 
      change.type === 'reset'
    )
    if (hasActualChange) {
      notifyModified()
    }
  }, [onNodesChangeBase, notifyModified, nodes])

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
  // Handles both flattened (top-level) and nested (data object) structures
  const workflowNodeToNode = useCallback((wfNode: any) => {
    const data = wfNode.data || {}
    // Merge top-level fields with data object fields, preferring data object
    return {
      id: wfNode.id,
      type: wfNode.type,
      position: wfNode.position || { x: 0, y: 0 },
      draggable: true,
      selected: false, // Explicitly set selected state
      data: {
        label: data.label || data.name || wfNode.name || wfNode.type,
        name: data.name || wfNode.name || wfNode.type,
        description: data.description ?? wfNode.description ?? '',
        // Merge configs - prefer data object, fallback to top-level
        agent_config: data.agent_config || wfNode.agent_config || {},
        condition_config: data.condition_config || wfNode.condition_config || {},
        loop_config: data.loop_config || wfNode.loop_config || {},
        input_config: data.input_config || wfNode.input_config || {},
        inputs: data.inputs || wfNode.inputs || [],
      },
    }
  }, [])

  // Load workflow if ID provided and create/activate tab
  useEffect(() => {
    // Don't reload if we already have this workflow loaded (prevents reload after save)
    if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) {
      return
    }
    
    if (workflowId) {
      isLoadingRef.current = true // Prevent marking as modified during load
      api.getWorkflow(workflowId).then((workflow) => {
        // Set local state for this tab
        setLocalWorkflowId(workflow.id!)
        setLocalWorkflowName(workflow.name)
        setLocalWorkflowDescription(workflow.description || '')
        setVariables(workflow.variables || {})
        const convertedNodes = workflow.nodes.map(workflowNodeToNode)
        // Ensure all nodes have required React Flow properties
        const initializedNodes = convertedNodes.map(node => ({
          ...node,
          draggable: true,
          selected: false,
          // Ensure data object exists and has all fields
          data: {
            ...node.data,
            // Ensure configs are objects, not null/undefined
            agent_config: node.data.agent_config || {},
            condition_config: node.data.condition_config || {},
            loop_config: node.data.loop_config || {},
            input_config: node.data.input_config || {},
            inputs: node.data.inputs || [],
          }
        }))
        console.log('Loaded nodes:', initializedNodes.map(n => ({ id: n.id, type: n.type, position: n.position })))
        console.log('Looking for agent-generate:', initializedNodes.find(n => n.id === 'agent-generate'))
        
        // Debug: log raw edges from API
        const conditionEdgesRaw = (workflow.edges || []).filter((e: any) => e.source === 'condition-1')
        console.log('Raw condition edges from API:', JSON.stringify(conditionEdgesRaw, null, 2))
        conditionEdgesRaw.forEach((e: any) => {
          console.log(`  Edge ${e.id}:`, JSON.stringify({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            source_handle: e.source_handle,
            allKeys: Object.keys(e),
            fullEdge: e
          }, null, 2))
        })
        
        // Ensure edges preserve sourceHandle and targetHandle properties
        const formattedEdges = (workflow.edges || []).map((edge: any) => {
          // Get sourceHandle from either camelCase or snake_case - ensure it's a string, not boolean
          let sourceHandle = edge.sourceHandle || edge.source_handle || null
          let targetHandle = edge.targetHandle || edge.target_handle || null
          
          // Convert boolean to string if needed (React Flow expects strings)
          if (sourceHandle === true) sourceHandle = "true"
          if (sourceHandle === false) sourceHandle = "false"
          if (targetHandle === true) targetHandle = "true"
          if (targetHandle === false) targetHandle = "false"
          
          // Generate unique ID that includes sourceHandle to differentiate edges from same source
          const edgeId = edge.id || (sourceHandle 
            ? `${edge.source}-${sourceHandle}-${edge.target}` 
            : `${edge.source}-${edge.target}`)
          
          // Create edge object with sourceHandle/targetHandle set explicitly
          const formattedEdge: any = {
            id: edgeId,
            source: edge.source,
            target: edge.target,
          }
          
          // Only add sourceHandle/targetHandle if they have values
          if (sourceHandle) {
            formattedEdge.sourceHandle = String(sourceHandle)
          }
          if (targetHandle) {
            formattedEdge.targetHandle = String(targetHandle)
          }
          
          // Preserve other edge properties (but don't overwrite sourceHandle/targetHandle)
          Object.keys(edge).forEach(key => {
            if (key !== 'sourceHandle' && key !== 'source_handle' && key !== 'targetHandle' && key !== 'target_handle') {
              formattedEdge[key] = edge[key]
            }
          })
          
          return formattedEdge
        })
        
        const conditionEdges = formattedEdges.filter(e => e.source === 'condition-1')
        console.log('Formatted condition edges:', JSON.stringify(conditionEdges, null, 2))
        console.log('Edge details (formatted):', conditionEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          hasSourceHandle: 'sourceHandle' in e,
          sourceHandleType: typeof e.sourceHandle,
          fullEdge: e
        })))
        
        // Set nodes first, then edges after a brief delay to ensure nodes are rendered
        setNodes(initializedNodes)
        setTimeout(() => {
          setEdges(formattedEdges)
        }, 50)
        
        // Track that we've loaded this workflow
        lastLoadedWorkflowIdRef.current = workflowId
        
        // Clear any selected node when loading new workflow
        setSelectedNodeId(null)
        
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
      // New workflow - reset tracking and make sure loading flag is off
      lastLoadedWorkflowIdRef.current = null
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

  // Handle workflow updates from chat
  const handleWorkflowUpdate = useCallback((changes: any) => {
    if (!changes) return

    // Apply node additions first (edges need nodes to exist)
    if (changes.nodes_to_add && changes.nodes_to_add.length > 0) {
      setNodes((nds) => {
        const newNodes = [...nds, ...changes.nodes_to_add.map((n: any) => ({
          ...n,
          draggable: true,
          selected: false
        }))]
        return newNodes
      })
      notifyModified()
    }

    // Apply node updates
    if (changes.nodes_to_update && changes.nodes_to_update.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          const update = changes.nodes_to_update.find((u: any) => u.node_id === node.id)
          if (update) {
            return {
              ...node,
              data: {
                ...node.data,
                ...update.updates,
              },
            }
          }
          return node
        })
      )
      notifyModified()
    }

    // Apply node deletions
    if (changes.nodes_to_delete && changes.nodes_to_delete.length > 0) {
      setNodes((nds) => nds.filter((node) => !changes.nodes_to_delete.includes(node.id)))
      // Also remove edges connected to deleted nodes
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !changes.nodes_to_delete.includes(edge.source) &&
            !changes.nodes_to_delete.includes(edge.target)
        )
      )
      notifyModified()
    }

    // Apply edge additions - use refs to access current state
    if (changes.edges_to_add && changes.edges_to_add.length > 0) {
      // Process edges after a brief delay to ensure nodes are updated
      setTimeout(() => {
        const currentNodes = nodesRef.current
        const currentEdges = edgesRef.current
        const nodeIds = new Set(currentNodes.map(n => n.id))
        
        console.log('Adding edges:', changes.edges_to_add)
        console.log('Current nodes:', Array.from(nodeIds))
        console.log('Current edges:', currentEdges.map(e => `${e.source} -> ${e.target}`))
        
        let updatedEdges = [...currentEdges]
        
        for (const edgeToAdd of changes.edges_to_add) {
          // Validate that both source and target nodes exist
          if (!nodeIds.has(edgeToAdd.source)) {
            console.warn(`Cannot connect edge: source node "${edgeToAdd.source}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          if (!nodeIds.has(edgeToAdd.target)) {
            console.warn(`Cannot connect edge: target node "${edgeToAdd.target}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          
          // Check if edge already exists
          const edgeExists = updatedEdges.some(
            e => e.source === edgeToAdd.source && e.target === edgeToAdd.target
          )
          if (edgeExists) {
            console.warn(`Edge from "${edgeToAdd.source}" to "${edgeToAdd.target}" already exists`)
            continue
          }
          
          // Convert to React Flow Connection format and use addEdge helper
          const connection: Connection = {
            source: edgeToAdd.source,
            target: edgeToAdd.target,
            sourceHandle: edgeToAdd.sourceHandle || null,
            targetHandle: edgeToAdd.targetHandle || null,
          }
          console.log('Adding connection:', connection)
          // Use addEdge to properly format the edge - it returns the updated array
          updatedEdges = addEdge(connection, updatedEdges)
          console.log('Updated edges count:', updatedEdges.length)
        }
        
        setEdges(updatedEdges)
        notifyModified()
      }, 50) // Small delay to ensure nodes are updated
    }

    // Apply edge deletions
    if (changes.edges_to_delete && changes.edges_to_delete.length > 0) {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !changes.edges_to_delete.some(
              (del: any) => del.source === edge.source && del.target === edge.target
            )
        )
      )
      notifyModified()
    }
  }, [setNodes, setEdges, notifyModified])


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
        draggable: true,
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
    (event: React.MouseEvent, node: any) => {
      // Don't handle clicks during drag operations
      if (isDraggingRef.current) {
        return
      }
      
      // Don't prevent default - let React Flow handle dragging
      // Only stop propagation to prevent pane click
      event.stopPropagation()
      
      // Set our local selectedNodeId state
      setSelectedNodeId(node.id)
      
      // Update node selection - but preserve all node properties including position
      setNodes((nds) => 
        nds.map((n) => ({
          ...n, // Preserve all properties including position
          selected: n.id === node.id
        }))
      )
    },
    [setNodes]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setContextMenu(null) // Close context menu when clicking on pane
  }, [])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the position relative to the viewport
      setContextMenu({
        nodeId: node.id,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the position relative to the viewport
      setContextMenu({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY,
      })
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
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                nodesDraggable={true}
                nodesConnectable={true}
                panOnDrag={true} // Allow panning - React Flow will prioritize node dragging when clicking on nodes
                panOnScroll={true}
                zoomOnScroll={true}
                zoomOnPinch={true}
                selectionOnDrag={false}
                fitView
                className="bg-gray-50"
                defaultEdgeOptions={{
                  style: { strokeWidth: 3 },
                }}
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
          </div>

          {/* Bottom: Execution Console (Only under workflow canvas) */}
          <ExecutionConsole 
            workflowTabs={workflowTabs}
            activeWorkflowId={localWorkflowId || null}
            onCloseWorkflow={onCloseWorkflow || (() => {})}
            onClearExecutions={onClearExecutions || (() => {})}
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        </div>

        {/* Right Panel - Properties (Full Height) */}
        <PropertyPanel 
          selectedNodeId={selectedNodeId} 
          setSelectedNodeId={setSelectedNodeId}
          nodes={nodes}
        />
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <ContextMenu
            nodeId={contextMenu.nodeId}
            edgeId={contextMenu.edgeId}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onDelete={() => {
              // Clear selection if deleted node was selected
              if (contextMenu.nodeId && selectedNodeId === contextMenu.nodeId) {
                setSelectedNodeId(null)
              }
              notifyModified()
            }}
          />
        </>
      )}
    </ReactFlowProvider>
  )
}

