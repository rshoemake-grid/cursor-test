/**
 * React Flow Instance Capture Component
 * Captures the React Flow instance and stores it in a ref for coordinate conversion
 * Must be rendered inside ReactFlowProvider
 */

import { useEffect } from 'react'
import { useReactFlow, type ReactFlowInstance } from '@xyflow/react'

interface ReactFlowInstanceCaptureProps {
  instanceRef: React.MutableRefObject<ReactFlowInstance | null>
}

export function ReactFlowInstanceCapture({ instanceRef }: ReactFlowInstanceCaptureProps) {
  const reactFlowInstance = useReactFlow()
  
  useEffect(() => {
    instanceRef.current = reactFlowInstance
  }, [reactFlowInstance, instanceRef])
  
  return null
}
