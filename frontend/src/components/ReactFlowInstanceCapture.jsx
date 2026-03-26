/**
 * React Flow Instance Capture Component
 * Captures the React Flow instance and stores it in a ref for coordinate conversion
 * Must be rendered inside ReactFlowProvider
 */ import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
export function ReactFlowInstanceCapture({ instanceRef }) {
    const reactFlowInstance = useReactFlow();
    useEffect(()=>{
        instanceRef.current = reactFlowInstance;
    }, [
        reactFlowInstance,
        instanceRef
    ]);
    return null;
}
