/**
 * Node Cache Utilities
 * Extracted for better testability, mutation resistance, and SRP compliance
 * Single Responsibility: Only handles node caching logic
 */ import { nodeExistsAndValid } from './nodeValidation';
/**
 * Update node cache
 * Mutation-resistant: explicit null/undefined checks
 * 
 * @param node The node to cache (can be null/undefined)
 * @param nodeId The node ID to cache
 * @returns Cache update result
 */ export function updateNodeCache(node, nodeId) {
    if (nodeExistsAndValid(node) && node !== null && node !== undefined) {
        // Create a copy to stabilize reference - ensure all required Node properties
        const nodeCopy = {
            ...node,
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data
        };
        return {
            cached: nodeCopy,
            idCached: nodeId
        };
    } else {
        return {
            cached: null,
            idCached: null
        };
    }
}
/**
 * Update cached node data while preserving reference
 * Mutation-resistant: explicit checks
 * 
 * @param cachedNode The cached node reference
 * @param updatedNode The updated node data
 * @returns True if update was successful
 */ export function updateCachedNodeData(cachedNode, updatedNode) {
    if (!nodeExistsAndValid(cachedNode) || cachedNode === null || cachedNode === undefined) {
        return false;
    }
    if (!nodeExistsAndValid(updatedNode) || updatedNode === null || updatedNode === undefined) {
        return false;
    }
    // Update cache with latest data but preserve reference
    // Type assertion needed because Object.assign doesn't preserve exact Node type
    Object.assign(cachedNode, updatedNode);
    return true;
}
/**
 * Clear node cache
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param idRef Reference to cached node ID
 */ export function clearNodeCache(nodeRef, idRef) {
    nodeRef.current = null;
    idRef.current = null;
}
/**
 * Sync cache data while preserving reference
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param updatedNode The updated node data
 */ export function syncCacheData(nodeRef, updatedNode) {
    if (nodeExistsAndValid(nodeRef.current) && nodeExistsAndValid(updatedNode)) {
        Object.assign(nodeRef.current, updatedNode);
    }
}
/**
 * Update node cache (overloaded version for refs)
 * Mutation-resistant: explicit checks
 * 
 * @param nodeRef Reference to cached node
 * @param idRef Reference to cached node ID
 * @param node The node to cache (can be null/undefined)
 * @param nodeId The node ID to cache
 */ export function updateNodeCacheRefs(nodeRef, idRef, node, nodeId) {
    const result = updateNodeCache(node, nodeId);
    nodeRef.current = result.cached;
    idRef.current = result.idCached;
}
