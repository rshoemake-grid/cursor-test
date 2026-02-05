/**
 * Canvas Events Hook
 * Handles canvas interaction events (drop, click, context menu)
 */

import { useCallback, useRef } from 'react'
import { addEdge, type Connection } from '@xyflow/react'
import { logger } from '../../utils/logger'
import { showSuccess, showError } from '../../utils/notifications'
import { STORAGE_KEYS } from '../../config/constants'
import type { Node, Edge } from '@xyflow/react'
import type { StorageAdapter } from '../../types/adapters'

interface UseCanvasEventsOptions {
  reactFlowInstanceRef: React.MutableRefObject<any>
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setSelectedNodeId: (id: string | null) => void
  notifyModified: () => void
  clipboard: { clipboardNode: Node | null; paste: (x?: number, y?: number) => void }
  storage?: StorageAdapter | null
}

export function useCanvasEvents({
  reactFlowInstanceRef,
  setNodes,
  setEdges,
  setSelectedNodeId,
  notifyModified,
  clipboard,
  storage,
}: UseCanvasEventsOptions) {
  const isDraggingRef = useRef<boolean>(false)

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
    [reactFlowInstanceRef, setNodes, notifyModified]
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
    [setNodes, setSelectedNodeId]
  )

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    setSelectedNodeId(null)
    
    // Handle paste on pane click with Ctrl/Cmd+V
    if ((event.ctrlKey || event.metaKey) && event.button === 0 && clipboard?.clipboardNode) {
      clipboard.paste(event.clientX, event.clientY)
    }
  }, [clipboard, setSelectedNodeId])

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
        storage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(agentNodes))
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

  return {
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onPaneClick,
    handleAddToAgentNodes,
    isDraggingRef,
  }
}
