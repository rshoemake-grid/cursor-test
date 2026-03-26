/**
 * Context Menu Hook
 * Manages context menu state and handlers for nodes and edges
 */ import { useState, useCallback } from 'react';
export function useContextMenu() {
    const [contextMenu, setContextMenu] = useState(null);
    const onNodeContextMenu = useCallback((event, node)=>{
        event.preventDefault();
        event.stopPropagation();
        // Get the position relative to the viewport
        setContextMenu({
            nodeId: node.id,
            node: node,
            x: event.clientX,
            y: event.clientY
        });
    }, []);
    const onEdgeContextMenu = useCallback((event, edge)=>{
        event.preventDefault();
        event.stopPropagation();
        // Get the position relative to the viewport
        setContextMenu({
            edgeId: edge.id,
            x: event.clientX,
            y: event.clientY
        });
    }, []);
    const closeContextMenu = useCallback(()=>{
        setContextMenu(null);
    }, []);
    return {
        contextMenu,
        setContextMenu,
        onNodeContextMenu,
        onEdgeContextMenu,
        closeContextMenu
    };
}
