/**
 * Node Selection Hook
 * Manages node selection state and syncs with React Flow selection
 * Used by WorkflowBuilder for managing selection state
 */ import { useState, useCallback } from 'react';
export function useNodeSelection({ reactFlowInstanceRef, notifyModified }) {
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState(new Set());
    const handleNodesChange = useCallback((changes, onNodesChangeBase)=>{
        // Pass all changes to base handler - this handles position changes, etc.
        onNodesChangeBase(changes);
        // Track selection changes and update selectedNodeIds
        const reactFlowInstance = reactFlowInstanceRef.current;
        if (reactFlowInstance) {
            const allSelectedNodes = reactFlowInstance.getNodes().filter((n)=>n.selected);
            const allSelectedIds = new Set(allSelectedNodes.map((n)=>n.id));
            setSelectedNodeIds(allSelectedIds);
            // Update selectedNodeId based on selection count
            if (allSelectedIds.size === 0) {
                setSelectedNodeId(null);
            } else if (allSelectedIds.size === 1) {
                // Single selection - set the selected node ID
                const singleId = Array.from(allSelectedIds)[0];
                setSelectedNodeId(singleId);
            } else {
                // Multiple selection - clear selectedNodeId to disable properties panel
                setSelectedNodeId(null);
            }
        }
        // Notify on actual modifications (position changes, add, remove, etc.)
        const hasActualChange = changes.some((change)=>change.type === 'position' || change.type === 'dimensions' || change.type === 'add' || change.type === 'remove' || change.type === 'reset');
        if (hasActualChange) {
            notifyModified();
        }
    }, [
        reactFlowInstanceRef,
        notifyModified
    ]);
    return {
        selectedNodeId,
        setSelectedNodeId,
        selectedNodeIds,
        setSelectedNodeIds,
        handleNodesChange
    };
}
