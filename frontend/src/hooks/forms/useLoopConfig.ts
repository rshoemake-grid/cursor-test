/**
 * Loop Config Hook
 * Manages loop_config initialization for Loop nodes
 */

import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { logicalOrToEmptyObject } from '../utils/logicalOr'

interface UseLoopConfigOptions {
  selectedNode: any | null
}

/**
 * Hook for initializing loop_config defaults for Loop nodes
 * 
 * @param options Configuration options
 */
export function useLoopConfig({ selectedNode }: UseLoopConfigOptions) {
  const { setNodes } = useReactFlow()

  useEffect(() => {
    if (!selectedNode || selectedNode.type !== 'loop') return
    
    const nodeData = logicalOrToEmptyObject(selectedNode.data)
    if (!nodeData.loop_config || Object.keys(nodeData.loop_config).length === 0) {
      const defaultLoopConfig = {
        loop_type: 'for_each',
        max_iterations: 0,
      }
      // Update the node with default config
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  loop_config: defaultLoopConfig,
                },
              }
            : n
        )
      )
    }
  }, [selectedNode, setNodes])
}
