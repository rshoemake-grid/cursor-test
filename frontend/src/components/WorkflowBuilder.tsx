import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
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
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import NodePanel from './NodePanel'
import ExecutionInputDialog from './ExecutionInputDialog'
import PropertyPanel from './PropertyPanel'
import ExecutionConsole from './ExecutionConsole'
import ContextMenu from './NodeContextMenu'
import MarketplaceDialog from './MarketplaceDialog'
import { api } from '../api/client'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useAuth } from '../contexts/AuthContext'
import { getLocalStorageItem, setLocalStorageItem } from '../hooks/useLocalStorage'
import { logger } from '../utils/logger'
import type { StorageAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface Execution {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  nodes: Record<string, any>
  logs: any[]
}

interface WorkflowTab {
  workflowId: string
  workflowName: string
  executions: Execution[]
  activeExecutionId: string | null
}

// Extended WorkflowBuilderProps with additional properties needed by WorkflowTabs
// TODO: Refactor to use split interfaces from types/workflowBuilder.ts (ISP compliance)
interface WorkflowBuilderProps {
  tabId: string
  workflowId: string | null
  tabName: string
  workflowTabs?: WorkflowTab[] // Execution data from parent
  onExecutionStart?: (executionId: string) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
  onWorkflowModified?: () => void
  onWorkflowLoaded?: (workflowId: string, name: string) => void
  onCloseWorkflow?: (workflowId: string) => void
  onClearExecutions?: (workflowId: string) => void
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: any) => void
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void
  onRemoveExecution?: (workflowId: string, executionId: string) => void
  tabIsUnsaved: boolean
  // Dependency injection
  storage?: StorageAdapter | null
}

interface TabDraft {
  nodes: Node[]
  edges: Edge[]
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  isUnsaved: boolean
}

const DRAFT_STORAGE_KEY = 'workflowBuilderDrafts'

// Use utility functions instead of direct localStorage access (DIP compliance)
const loadDraftsFromStorage = (): Record<string, TabDraft> => {
  const drafts = getLocalStorageItem<Record<string, TabDraft>>(DRAFT_STORAGE_KEY, {})
  return typeof drafts === 'object' && drafts !== null ? drafts : {}
}

const saveDraftsToStorage = (drafts: Record<string, TabDraft>) => {
  setLocalStorageItem(DRAFT_STORAGE_KEY, drafts)
}

export interface WorkflowBuilderHandle {
  saveWorkflow: () => Promise<string | null>
  executeWorkflow: () => void
  exportWorkflow: () => void
}

const WorkflowBuilder = forwardRef<WorkflowBuilderHandle, WorkflowBuilderProps>(function WorkflowBuilder({ 
  tabId,
  workflowId,
  tabName,
  tabIsUnsaved,
  storage = defaultAdapters.createLocalStorageAdapter(),
  workflowTabs = [],
  onExecutionStart,
  onWorkflowSaved,
  onWorkflowModified,
  onWorkflowLoaded,
  onCloseWorkflow,
      onClearExecutions: _onClearExecutions,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution
}: WorkflowBuilderProps, ref) {
  // Local state for this tab - NOT using global store
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([] as Edge[])
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<Set<string>>(new Set())
  const [localWorkflowId, setLocalWorkflowId] = useState<string | null>(workflowId)
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Record<string, { status: string; error?: string }>>({})
  const [clipboardNode, setClipboardNode] = useState<any>(null)
  const [clipboardAction, setClipboardAction] = useState<'copy' | 'cut' | null>(null)
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false)
  const [marketplaceNode, setMarketplaceNode] = useState<any>(null)
  const reactFlowInstanceRef = useRef<any>(null)
  const isAddingAgentsRef = useRef<boolean>(false)
  
  // Component to capture React Flow instance for coordinate conversion
  const ReactFlowInstanceCapture = () => {
    const reactFlowInstance = useReactFlow()
    
    useEffect(() => {
      reactFlowInstanceRef.current = reactFlowInstance
    }, [reactFlowInstance])
    
    return null
  }
  
  // Component to handle keyboard shortcuts (must be inside ReactFlowProvider)
  const KeyboardHandler = () => {
    const { deleteElements, getNodes, getEdges } = useReactFlow()
    
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Don't handle shortcuts if user is typing in an input field
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }

        // Handle Copy (Ctrl/Cmd + C)
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
          const selectedNodes = getNodes().filter(node => node.selected)
          if (selectedNodes.length === 1) {
            event.preventDefault()
            handleCopy(selectedNodes[0])
          }
        }
        
        // Handle Cut (Ctrl/Cmd + X)
        if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
          const selectedNodes = getNodes().filter(node => node.selected)
          if (selectedNodes.length === 1) {
            event.preventDefault()
            handleCut(selectedNodes[0])
          }
        }
        
        // Handle Paste (Ctrl/Cmd + V)
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
          if (clipboardNode) {
            event.preventDefault()
            handlePaste()
          }
        }
        
        // Check if Delete or Backspace is pressed
        if (event.key === 'Delete' || event.key === 'Backspace') {
          // Get selected nodes and edges
          const selectedNodes = getNodes().filter(node => node.selected)
          const selectedEdges = getEdges().filter(edge => edge.selected)
          
          // Delete selected items
          if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            event.preventDefault()
            event.stopPropagation()
            
            deleteElements({
              nodes: selectedNodes,
              edges: selectedEdges
            })
            
            // Clear selection if deleted node was selected
            const currentSelectedId = selectedNodeId
            if (selectedNodes.some(node => node.id === currentSelectedId)) {
              setSelectedNodeId(null)
            }
            
            notifyModified()
          }
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [deleteElements, getNodes, getEdges, selectedNodeId, setSelectedNodeId, notifyModified, clipboardNode, handleCopy, handleCut, handlePaste])
    
    return null
  }
  
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
  const tabNameRef = useRef<string>(tabName)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const isLoadingRef = useRef<boolean>(false)
  const isDraggingRef = useRef<boolean>(false)
  const { isAuthenticated } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showInputs, setShowInputs] = useState(false)
  const [executionInputs, setExecutionInputs] = useState<string>('{}')
  const workflowIdRef = useRef<string | null>(workflowId)
  const tabDraftsRef = useRef<Record<string, TabDraft>>(loadDraftsFromStorage())
  
  useEffect(() => {
    if (tabName !== tabNameRef.current) {
      tabNameRef.current = tabName
      setLocalWorkflowName(tabName)
    }
  }, [tabName])

  const normalizeNodeForStorage = useCallback((node: Node) => ({
    ...node,
    data: {
      ...node.data,
      agent_config: node.data?.agent_config ?? node.agent_config ?? {},
      condition_config: node.data?.condition_config ?? node.condition_config ?? {},
      loop_config: node.data?.loop_config ?? node.loop_config ?? {},
      input_config: node.data?.input_config ?? node.input_config ?? {},
    },
  }), [])

  useEffect(() => {
    // Don't load draft if we're in the middle of adding agents
    if (isAddingAgentsRef.current) {
      logger.debug('[WorkflowBuilder] Skipping draft load - adding agents in progress')
      return
    }
    
    const draft = tabDraftsRef.current[tabId]
    const matchesCurrentWorkflow = draft && (
      (!workflowId && !draft.workflowId) ||
      (workflowId && draft.workflowId === workflowId)
    )

    if (matchesCurrentWorkflow) {
      logger.debug('[WorkflowBuilder] Loading draft nodes:', draft.nodes.length)
      setNodes(draft.nodes.map(normalizeNodeForStorage))
      setEdges(draft.edges)
      setLocalWorkflowId(draft.workflowId)
      setLocalWorkflowName(draft.workflowName)
      setLocalWorkflowDescription(draft.workflowDescription)
    } else if (!workflowId) {
      setNodes([])
      setEdges([])
      setLocalWorkflowId(null)
      setLocalWorkflowName('Untitled Workflow')
      setLocalWorkflowDescription('')
    }
  }, [tabId, workflowId, normalizeNodeForStorage])

  useEffect(() => {
    tabDraftsRef.current[tabId] = {
      nodes: nodes.map(normalizeNodeForStorage),
      edges,
      workflowId: localWorkflowId,
      workflowName: localWorkflowName,
      workflowDescription: localWorkflowDescription,
      isUnsaved: tabIsUnsaved
    }
    saveDraftsToStorage(tabDraftsRef.current)
  }, [tabId, nodes, edges, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, normalizeNodeForStorage])

  useEffect(() => {
    workflowIdRef.current = localWorkflowId
  }, [localWorkflowId])
  
  // Helper to convert nodes to workflow format
  const nodeToWorkflowNode = useCallback((node: any) => ({
    id: node.id,
    type: node.type,
    name: node.data.name || node.data.label,
    description: node.data.description,
        agent_config: (node.data as any).agent_config,
        condition_config: (node.data as any).condition_config,
    loop_config: node.data.loop_config,
    input_config: node.data.input_config,
    inputs: node.data.inputs || [],
    position: node.position,
  }), [])
  
  // Function to save the workflow (can be called from PropertyPanel or toolbar buttons)
  const saveWorkflow = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      showError('Please log in to save workflows.')
      return null
    }

    if (isSaving) {
      return localWorkflowId ?? null
    }

    const workflowDef = {
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes: nodes.map(nodeToWorkflowNode),
      edges: edges,
      variables: variables,
    }

    setIsSaving(true)
    try {
      if (localWorkflowId) {
        await api.updateWorkflow(localWorkflowId, workflowDef)
        showSuccess('Workflow updated successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(localWorkflowId, workflowDef.name)
        }
        return localWorkflowId
      } else {
        const created = await api.createWorkflow(workflowDef)
        setLocalWorkflowId(created.id!)
        showSuccess('Workflow created successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(created.id!, workflowDef.name)
        }
        return created.id!
      }
    } catch (error: any) {
      showError('Failed to save workflow: ' + (error.message || 'Unknown error'))
      logger.error('Failed to save workflow:', error)
      throw new Error('Failed to save workflow: ' + (error.message || 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }, [
    isAuthenticated,
    isSaving,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    nodes,
    edges,
    variables,
    nodeToWorkflowNode,
    onWorkflowSaved,
  ])

  const exportWorkflow = useCallback(() => {
    const workflowDef = {
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes: nodes.map(nodeToWorkflowNode),
      edges: edges,
      variables: variables,
    }
    const filename = (localWorkflowName.trim() || 'workflow').replace(/\s+/g, '-')
    const blob = new Blob([JSON.stringify(workflowDef, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [localWorkflowName, localWorkflowDescription, nodes, edges, variables, nodeToWorkflowNode])
  const lastLoadedWorkflowIdRef = useRef<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ nodeId?: string; edgeId?: string; node?: any; x: number; y: number } | null>(null)

  // Track modifications
  const notifyModified = useCallback(() => {
    if (onWorkflowModified && !isLoadingRef.current) {
      onWorkflowModified()
    }
  }, [onWorkflowModified])

  // Listen for agents to add from marketplace
  useEffect(() => {
    const addAgentsToCanvas = (agentsToAdd: any[]) => {
      logger.debug('[WorkflowBuilder] addAgentsToCanvas called with', agentsToAdd.length, 'agents')
      logger.debug('[WorkflowBuilder] Current tabId:', tabId)
      isAddingAgentsRef.current = true
      
      // Get current state values
      const currentTabId = tabId
      const currentWorkflowId = localWorkflowId
      const currentWorkflowName = localWorkflowName
      const currentWorkflowDescription = localWorkflowDescription
      const currentTabIsUnsaved = tabIsUnsaved
      
      // Add each agent as a node
      // Use functional update to get current nodes for positioning
      setNodes((currentNodes) => {
        logger.debug('[WorkflowBuilder] Current nodes before adding:', currentNodes.length)
        const startX = currentNodes.length > 0 
          ? Math.max(...currentNodes.map(n => n.position.x)) + 200 
          : 250
        let currentY = 250
        
        const newNodes = agentsToAdd.map((agent: any, index: number) => {
          const node = {
            id: `agent-${Date.now()}-${index}`,
            type: 'agent',
            position: {
              x: startX,
              y: currentY + (index * 150)
            },
            draggable: true,
            data: {
              label: agent.name || agent.label || 'Agent Node',
              name: agent.name || agent.label || 'Agent Node',
              description: agent.description || '',
              agent_config: agent.agent_config || {},
              inputs: [],
            },
          }
          return node
        })
        
        const updatedNodes = [...currentNodes, ...newNodes]
        logger.debug('[WorkflowBuilder] Updated nodes after adding:', updatedNodes.length)
        logger.debug('[WorkflowBuilder] New nodes:', newNodes.map(n => ({ id: n.id, label: n.data.label })))
        
        // Update draft storage immediately to persist the change
        // Use a setTimeout to ensure this happens after the state update
        setTimeout(() => {
          const currentDraft = tabDraftsRef.current[currentTabId]
          const updatedDraft = {
            nodes: updatedNodes.map(normalizeNodeForStorage),
            edges: currentDraft?.edges || [],
            workflowId: currentWorkflowId,
            workflowName: currentWorkflowName,
            workflowDescription: currentWorkflowDescription,
            isUnsaved: currentTabIsUnsaved
          }
          tabDraftsRef.current[currentTabId] = updatedDraft
          saveDraftsToStorage(tabDraftsRef.current)
          logger.debug('[WorkflowBuilder] Draft updated with new nodes, total:', updatedNodes.length)
        }, 0)
        
        // Reset flag after a delay to allow state update
        setTimeout(() => {
          isAddingAgentsRef.current = false
          logger.debug('[WorkflowBuilder] Reset isAddingAgentsRef flag')
        }, 1000)
        
        return updatedNodes
      })
      
      notifyModified()
    }

    const handleAddAgentsToWorkflow = (event: CustomEvent) => {
      const { agents: agentsToAdd, tabId: targetTabId } = event.detail
      logger.debug('[WorkflowBuilder] Received addAgentsToWorkflow event:', { 
        targetTabId, 
        currentTabId: tabId, 
        agentCount: agentsToAdd.length 
      })
      
      // Only process if this is the active tab
      if (targetTabId !== tabId) {
        logger.debug('[WorkflowBuilder] Event for different tab, ignoring')
        return
      }
      
      logger.debug('[WorkflowBuilder] Adding agents via event')
      addAgentsToCanvas(agentsToAdd)
    }
    
    // Check storage for pending agents (more reliable than events)
    const checkPendingAgents = () => {
      if (!storage) return
      
      try {
        const pendingData = storage.getItem('pendingAgentsToAdd')
        if (pendingData) {
          const pending = JSON.parse(pendingData)
            logger.debug('[WorkflowBuilder] Found pending agents:', {
            pendingTabId: pending.tabId, 
            currentTabId: tabId, 
            age: Date.now() - pending.timestamp 
          })
          // Only process if it's for this tab and recent (within last 10 seconds)
          if (pending.tabId === tabId && Date.now() - pending.timestamp < 10000) {
              logger.debug('[WorkflowBuilder] Adding agents to canvas:', pending.agents.length)
            addAgentsToCanvas(pending.agents)
            // Clear after processing
            storage.removeItem('pendingAgentsToAdd')
          } else if (pending.tabId !== tabId) {
            // Clear if it's for a different tab
              logger.debug('[WorkflowBuilder] Pending agents for different tab, clearing')
            storage.removeItem('pendingAgentsToAdd')
          } else if (Date.now() - pending.timestamp >= 10000) {
            // Clear if too old
              logger.debug('[WorkflowBuilder] Pending agents too old, clearing')
            storage.removeItem('pendingAgentsToAdd')
          }
        }
      } catch (e) {
        logger.error('Failed to process pending agents:', e)
        if (storage) {
          storage.removeItem('pendingAgentsToAdd')
        }
      }
    }
    
    // Check immediately when tab becomes active
    checkPendingAgents()
    
    // Also listen for events
    if (typeof window !== 'undefined') {
      window.addEventListener('addAgentsToWorkflow', handleAddAgentsToWorkflow as EventListener)
    }
    
    // Check periodically in case we missed the event (check every 1 second for 10 seconds)
    let checkCount = 0
    const maxChecks = 10
    const interval = setInterval(() => {
      checkPendingAgents()
      checkCount++
      if (checkCount >= maxChecks) {
        clearInterval(interval)
      }
    }, 1000)
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('addAgentsToWorkflow', handleAddAgentsToWorkflow as EventListener)
      }
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, setNodes, notifyModified]) // storage is accessed via closure in checkPendingAgents

  const executeWorkflow = useCallback(async () => {
    logger.debug('[WorkflowBuilder] executeWorkflow called')
    logger.debug('[WorkflowBuilder] isAuthenticated:', isAuthenticated)
    logger.debug('[WorkflowBuilder] localWorkflowId:', localWorkflowId)
    if (!isAuthenticated) {
      logger.error('[WorkflowBuilder] User not authenticated')
      showError('Please log in to execute workflows.')
      return
    }

    let currentWorkflowId = localWorkflowId
    logger.debug('[WorkflowBuilder] Current workflow ID:', currentWorkflowId)
    if (!currentWorkflowId) {
      logger.debug('[WorkflowBuilder] No workflow ID, prompting to save')
      const confirmed = await showConfirm(
        'Workflow needs to be saved before execution. Save now?',
        { title: 'Save Workflow', confirmText: 'Save', cancelText: 'Cancel' }
      )
      if (!confirmed) {
        return
      }
      try {
        const savedId = await saveWorkflow()
        if (!savedId) {
          showError('Failed to save workflow. Cannot execute.')
          return
        }
        currentWorkflowId = savedId
      } catch (error: any) {
        showError('Failed to save workflow. Cannot execute.')
        return
      }
    }

    logger.debug('[WorkflowBuilder] Setting execution inputs and showing dialog')
    setShowInputs(true)
  }, [isAuthenticated, localWorkflowId, saveWorkflow])

  // Log when showInputs changes
  useEffect(() => {
    logger.debug('[WorkflowBuilder] showInputs changed to:', showInputs)
  }, [showInputs])

  const handleConfirmExecute = useCallback(async () => {
    logger.debug('[WorkflowBuilder] ===== handleConfirmExecute CALLED =====')
    logger.debug('[WorkflowBuilder] executionInputs:', executionInputs)
    logger.debug('[WorkflowBuilder] workflowIdRef.current:', workflowIdRef.current)
    setIsExecuting(true)
    setTimeout(async () => {
      try {
        logger.debug('[WorkflowBuilder] Parsing execution inputs:', executionInputs)
        const inputs = JSON.parse(executionInputs)
        logger.debug('[WorkflowBuilder] Parsed inputs:', inputs)
        setShowInputs(false)
        setExecutionInputs('{}')
        setIsExecuting(false)

        const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        logger.debug('[WorkflowBuilder] Created temp execution ID:', tempExecutionId)

        if (onExecutionStart) {
          logger.debug('[WorkflowBuilder] Calling onExecutionStart with temp ID')
          onExecutionStart(tempExecutionId)
        }

        showSuccess('✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.', 6000)

        const workflowIdToExecute = workflowIdRef.current
        logger.debug('[WorkflowBuilder] Workflow ID to execute:', workflowIdToExecute)
        if (!workflowIdToExecute) {
          logger.error('[WorkflowBuilder] No workflow ID found - workflow must be saved')
          showError('Workflow must be saved before executing.')
          setIsExecuting(false)
          return
        }

        logger.debug('[WorkflowBuilder] Calling api.executeWorkflow with:', { workflowIdToExecute, inputs })
        api.executeWorkflow(workflowIdToExecute, inputs)
          .then((execution) => {
            logger.debug('[WorkflowBuilder] Execution response received:', execution)
            if (execution.execution_id && execution.execution_id !== tempExecutionId) {
              logger.debug('[WorkflowBuilder] Updating execution ID:', execution.execution_id)
              if (onExecutionStart) {
                onExecutionStart(execution.execution_id)
              }
            }
          })
          .catch((error: any) => {
            logger.error('[WorkflowBuilder] Execution failed:', error)
            logger.error('[WorkflowBuilder] Error details:', {
              message: error.message,
              response: error.response,
              status: error.response?.status,
              data: error.response?.data
            })
            setIsExecuting(false)
            const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
            showError(`Failed to execute workflow: ${errorMessage}`)
          })
      } catch (error: any) {
        logger.error('Execution setup failed:', error)
        setIsExecuting(false)
        const errorMessage = error?.message || 'Unknown error'
        showError(`Failed to execute workflow: ${errorMessage}`)
      }
    }, 0)
  }, [localWorkflowId, onExecutionStart])

  useImperativeHandle(ref, () => ({
    saveWorkflow,
    executeWorkflow,
    exportWorkflow,
  }), [saveWorkflow, executeWorkflow, exportWorkflow])

  // Wrap React Flow change handlers to notify modifications
  const onNodesChange = useCallback((changes: any) => {
    // Pass all changes to base handler - this handles position changes, etc.
    onNodesChangeBase(changes)
    
    // Track selection changes and update selectedNodeIds
    const reactFlowInstance = reactFlowInstanceRef.current
    if (reactFlowInstance) {
      const allSelectedNodes = reactFlowInstance.getNodes().filter((n: Node) => n.selected)
      const allSelectedIds = new Set(allSelectedNodes.map((n: Node) => n.id))
      setSelectedNodeIds(allSelectedIds)
      
      // Update selectedNodeId based on selection count
      if (allSelectedIds.size === 0) {
        setSelectedNodeId(null)
      } else if (allSelectedIds.size === 1) {
        // Single selection - set the selected node ID
        const singleId = Array.from(allSelectedIds)[0]
        setSelectedNodeId(singleId)
      } else {
        // Multiple selection - clear selectedNodeId to disable properties panel
        setSelectedNodeId(null)
      }
    }
    
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
  // Handles both flattened (top-level) and nested (data object) structures
  const workflowNodeToNode = useCallback((wfNode: any) => {
    const data = wfNode.data || {}
    const nodeExecutionState = nodeExecutionStates[wfNode.id]
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
        // Add execution state for visual feedback
        executionStatus: nodeExecutionState?.status,
        executionError: nodeExecutionState?.error,
      },
    }
  }, [nodeExecutionStates])

  // Load workflow if ID provided and create/activate tab
  useEffect(() => {
    // Don't reload if we already have this workflow loaded (prevents reload after save)
    if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) {
      return
    }
    
    if (workflowId) {
      if (tabIsUnsaved) {
        return
      }
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
        logger.debug('Loaded nodes:', initializedNodes.map(n => ({ id: n.id, type: n.type, position: n.position })))
        logger.debug('Looking for agent-generate:', initializedNodes.find(n => n.id === 'agent-generate'))
        
        // Debug: log raw edges from API
        const conditionEdgesRaw = (workflow.edges || []).filter((e: any) => e.source === 'condition-1')
        logger.debug('Raw condition edges from API:', JSON.stringify(conditionEdgesRaw, null, 2))
        conditionEdgesRaw.forEach((e: any) => {
          logger.debug(`  Edge ${e.id}:`, JSON.stringify({
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
        logger.debug('Formatted condition edges:', JSON.stringify(conditionEdges, null, 2))
        logger.debug('Edge details (formatted):', conditionEdges.map(e => ({
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
        logger.error("Failed to load workflow:", err)
        isLoadingRef.current = false
      })
    } else {
      // New workflow - reset tracking and make sure loading flag is off
      lastLoadedWorkflowIdRef.current = null
      isLoadingRef.current = false
    }
  }, [workflowId, onWorkflowLoaded, workflowNodeToNode, setNodes, setEdges, tabIsUnsaved])

  // Handle execution start - just call parent callback
  const handleExecutionStart = useCallback((executionId: string) => {
    // Parent (WorkflowTabs) handles execution tracking
    if (onExecutionStart) {
      onExecutionStart(executionId)
    }
  }, [onExecutionStart])

  // Helper function to apply workflow changes locally
  const applyLocalChanges = useCallback((changes: any) => {

    // Apply node additions first (edges need nodes to exist)
    if (changes.nodes_to_add && changes.nodes_to_add.length > 0) {
      logger.debug('Adding nodes:', changes.nodes_to_add)
      setNodes((nds) => {
        // Convert backend node format to React Flow format
        const convertedNodes = changes.nodes_to_add.map((n: any) => {
          const converted = workflowNodeToNode(n)
          return {
            ...converted,
            draggable: true,
            selected: false
          }
        })
        const newNodes = [...nds, ...convertedNodes]
        logger.debug('New nodes after addition:', newNodes.map(n => ({ id: n.id, type: n.type })))
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
      logger.debug('Deleting nodes:', changes.nodes_to_delete)
      setNodes((nds) => {
        logger.debug('Current node IDs before deletion:', nds.map(n => n.id))
        const filtered = nds.filter((node) => !changes.nodes_to_delete.includes(node.id))
        logger.debug('Nodes after deletion:', filtered.map(n => n.id))
        return filtered
      })
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
        
        logger.debug('Adding edges:', changes.edges_to_add)
        logger.debug('Current nodes:', Array.from(nodeIds))
        logger.debug('Current edges:', currentEdges.map(e => `${e.source} -> ${e.target}`))
        
        let updatedEdges = [...currentEdges]
        
        for (const edgeToAdd of changes.edges_to_add) {
          // Validate that both source and target nodes exist
          if (!nodeIds.has(edgeToAdd.source)) {
            logger.warn(`Cannot connect edge: source node "${edgeToAdd.source}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          if (!nodeIds.has(edgeToAdd.target)) {
            logger.warn(`Cannot connect edge: target node "${edgeToAdd.target}" does not exist. Available nodes:`, Array.from(nodeIds))
            continue
          }
          
          // Check if edge already exists
          const edgeExists = updatedEdges.some(
            e => e.source === edgeToAdd.source && e.target === edgeToAdd.target
          )
          if (edgeExists) {
            logger.warn(`Edge from "${edgeToAdd.source}" to "${edgeToAdd.target}" already exists`)
            continue
          }
          
          // Convert to React Flow Connection format and use addEdge helper
          const connection: Connection = {
            source: edgeToAdd.source,
            target: edgeToAdd.target,
            sourceHandle: edgeToAdd.sourceHandle || null,
            targetHandle: edgeToAdd.targetHandle || null,
          }
          logger.debug('Adding connection:', connection)
          // Use addEdge to properly format the edge - it returns the updated array
          updatedEdges = addEdge(connection, updatedEdges)
          logger.debug('Updated edges count:', updatedEdges.length)
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
  }, [setNodes, setEdges, notifyModified, workflowNodeToNode])

  // Handle workflow updates from chat
  const handleWorkflowUpdate = useCallback((changes: any) => {
    if (!changes) return

    logger.debug('Received workflow changes:', changes)
    
    // If there are deletions and we have a workflowId, reload from database
    // The chat agent saves deletions to the database, so we need to reload to ensure UI matches
    const hasDeletions = changes.nodes_to_delete && changes.nodes_to_delete.length > 0
    
    if (hasDeletions && localWorkflowId) {
      // Reload workflow from database to ensure UI matches saved state
      logger.debug('Reloading workflow from database after deletions:', changes.nodes_to_delete)
      // Small delay to ensure backend has finished saving
      setTimeout(() => {
        api.getWorkflow(localWorkflowId).then((workflow) => {
          const convertedNodes = workflow.nodes.map(workflowNodeToNode)
          const initializedNodes = convertedNodes.map(node => ({
            ...node,
            draggable: true,
            selected: false,
            data: {
              ...node.data,
              agent_config: node.data.agent_config || {},
              condition_config: node.data.condition_config || {},
              loop_config: node.data.loop_config || {},
              input_config: node.data.input_config || {},
              inputs: node.data.inputs || [],
            }
          }))
          setNodes(initializedNodes)
          setEdges(workflow.edges || [])
          logger.debug('Reloaded workflow after deletion, nodes:', initializedNodes.map(n => n.id))
          logger.debug('Expected deleted nodes:', changes.nodes_to_delete)
        }).catch(err => {
          logger.error('Failed to reload workflow after deletion:', err)
          // Fall back to applying changes locally
          applyLocalChanges(changes)
        })
      }, 200) // Small delay to ensure backend save is complete
      return
    }
    
    applyLocalChanges(changes)
  }, [localWorkflowId, workflowNodeToNode, setNodes, setEdges, applyLocalChanges])

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

      // Use React Flow's screenToFlowPosition to convert mouse coordinates
      // This accounts for zoom, pan, and viewport position
      let position
      if (reactFlowInstanceRef.current?.screenToFlowPosition) {
        position = reactFlowInstanceRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
      } else {
        // Fallback: calculate relative to React Flow container
        const reactFlowWrapper = (event.currentTarget as HTMLElement).closest('.react-flow')
        if (!reactFlowWrapper) return
        
        const reactFlowBounds = reactFlowWrapper.getBoundingClientRect()
        position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        }
      }

      // Check for custom agent node data
      const customAgentData = event.dataTransfer.getData('application/custom-agent')
      let customData = null
      if (customAgentData) {
        try {
          customData = JSON.parse(customAgentData)
        } catch (e) {
          logger.error('Failed to parse custom agent data:', e)
        }
      }

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        draggable: true,
        data: customData ? {
          label: customData.label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          name: customData.label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          description: customData.description || '',
          agent_config: customData.agent_config || {},
          inputs: [],
        } : {
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
      
      // Don't prevent default - let React Flow handle dragging and multi-select
      // Only stop propagation to prevent pane click
      event.stopPropagation()
      
      // Check if shift/cmd/ctrl is held for multi-select
      const isMultiSelect = event.shiftKey || event.metaKey || event.ctrlKey
      
      if (isMultiSelect) {
        // Toggle selection for this node
        setNodes((nds) => 
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id ? !n.selected : n.selected
          }))
        )
      } else {
        // Single select - clear all others and select this one
        setNodes((nds) => 
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id
          }))
        )
        setSelectedNodeId(node.id)
      }
    },
    [setNodes]
  )

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    setSelectedNodeId(null)
    setContextMenu(null) // Close context menu when clicking on pane
    
    // Handle paste on pane click with Ctrl/Cmd+V
    if ((event.ctrlKey || event.metaKey) && event.button === 0 && clipboardNode) {
      handlePaste(event.clientX, event.clientY)
    }
  }, [clipboardNode])

  const handleCopy = useCallback((node: any) => {
    setClipboardNode(node)
    setClipboardAction('copy')
    showSuccess('Node copied to clipboard')
  }, [])

  const handleCut = useCallback((node: any) => {
    setClipboardNode(node)
    setClipboardAction('cut')
    showSuccess('Node cut to clipboard')
  }, [])

  const handlePaste = useCallback((x?: number, y?: number) => {
    if (!clipboardNode) return

    const { getNodes, screenToFlowPosition, addNodes, deleteElements } = reactFlowInstanceRef.current || {}
    if (!getNodes || !screenToFlowPosition || !addNodes) return

    const position = x !== undefined && y !== undefined 
      ? screenToFlowPosition({ x, y })
      : { x: clipboardNode.position.x + 50, y: clipboardNode.position.y + 50 }

    const newNode = {
      ...clipboardNode,
      id: `${clipboardNode.type}_${Date.now()}`,
      position,
      selected: false,
    }

    addNodes(newNode)
    
    if (clipboardAction === 'cut' && deleteElements) {
      deleteElements({ nodes: [{ id: clipboardNode.id }] })
      setClipboardNode(null)
      setClipboardAction(null)
    }
    
    notifyModified()
    showSuccess('Node pasted')
  }, [clipboardNode, clipboardAction, notifyModified])

  const handleSendToMarketplace = useCallback((node: any) => {
    setMarketplaceNode(node)
    setShowMarketplaceDialog(true)
  }, [])

  const handleAddToAgentNodes = useCallback((node: any) => {
    if (node.type !== 'agent') return
    if (!storage) {
      showError('Storage not available')
      return
    }

    try {
      // Get existing agent nodes from storage
      const savedAgentNodes = storage.getItem('customAgentNodes')
      const agentNodes = savedAgentNodes ? JSON.parse(savedAgentNodes) : []
      
      // Create a template from the node
      const agentTemplate = {
        id: `agent_${Date.now()}`,
        label: node.data.label || node.data.name || 'Custom Agent',
        description: node.data.description || '',
        agent_config: node.data.agent_config || {},
        type: 'agent'
      }
      
      // Add to list (avoid duplicates)
      const exists = agentNodes.some((n: any) => 
        n.label === agentTemplate.label && 
        JSON.stringify(n.agent_config) === JSON.stringify(agentTemplate.agent_config)
      )
      
      if (!exists) {
        agentNodes.push(agentTemplate)
        storage.setItem('customAgentNodes', JSON.stringify(agentNodes))
        // Dispatch custom event to update NodePanel in same window
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('customAgentNodesUpdated'))
        }
        showSuccess('Agent node added to palette')
      } else {
        showError('This agent node already exists in the palette')
      }
    } catch (error) {
      logger.error('Failed to save agent node:', error)
      showError('Failed to add agent node to palette')
    }
  }, [storage])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the position relative to the viewport
      setContextMenu({
        nodeId: node.id,
        node: node,
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
            <div className="absolute inset-0">
              <KeyboardHandler />
              <ReactFlowInstanceCapture />
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
                onPaneClick={onPaneClick}
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
          </div>

          {/* Bottom: Chat Console */}
          <ExecutionConsole 
            activeWorkflowId={localWorkflowId || null}
            executions={workflowTabs?.find(t => t.workflowId === localWorkflowId)?.executions || []}
            activeExecutionId={workflowTabs?.find(t => t.workflowId === localWorkflowId)?.activeExecutionId || null}
            onWorkflowUpdate={handleWorkflowUpdate}
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
          onSaveWorkflow={saveWorkflow}
        />
      </div>
      
      {/* Execution Input Dialog - Using extracted component (SRP compliance) */}
      <ExecutionInputDialog
        isOpen={showInputs}
        onClose={() => {
          setShowInputs(false)
        }}
        onSubmit={(inputs) => {
          handleConfirmExecute(inputs)
        }}
        nodes={nodes}
        workflowName={localWorkflowName}
      />

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
            node={contextMenu.node}
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
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onAddToAgentNodes={handleAddToAgentNodes}
            onSendToMarketplace={handleSendToMarketplace}
            canPaste={!!clipboardNode}
          />
        </>
      )}

      {/* Marketplace Dialog */}
      <MarketplaceDialog
        isOpen={showMarketplaceDialog}
        onClose={() => {
          setShowMarketplaceDialog(false)
          setMarketplaceNode(null)
        }}
        node={marketplaceNode}
        workflowId={localWorkflowId}
        workflowName={localWorkflowName}
      />
    </ReactFlowProvider>
  )
})

export default WorkflowBuilder
