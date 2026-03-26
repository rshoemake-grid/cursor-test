/**
 * Execution Management Hook
 * Manages execution state updates, polling, and handlers for workflow tabs
 */ import { useCallback, useMemo } from 'react';
import { api } from '../../api/client';
import { logger } from '../../utils/logger';
import { useExecutionPolling } from '../utils/useExecutionPolling';
import { ExecutionStateManager } from '../utils/executionStateManager';
/**
 * Hook for managing execution state and updates
 * 
 * @param options Configuration options
 * @returns Execution management handlers
 */ export function useExecutionManagement({ tabs, activeTabId, setTabs, tabsRef, onExecutionStart, apiClient = api, logger: injectedLogger = logger }) {
    // Create state manager instance
    const stateManager = useMemo(()=>new ExecutionStateManager({
            logger: injectedLogger
        }), [
        injectedLogger
    ]);
    // Handle execution start - add to active tab's executions
    const handleExecutionStart = useCallback((executionId)=>{
        // Early return if no active tab - state manager will return tabs unchanged
        const updatedTabs = stateManager.handleExecutionStart(tabs, activeTabId, executionId);
        // Only call setTabs if tabs actually changed (active tab was found)
        if (updatedTabs !== tabs) {
            setTabs(updatedTabs);
            // Also call parent callback if provided
            if (onExecutionStart) {
                onExecutionStart(executionId);
            }
        }
    }, [
        tabs,
        activeTabId,
        setTabs,
        onExecutionStart,
        stateManager
    ]);
    // Handle clearing executions for a workflow
    const handleClearExecutions = useCallback((workflowId)=>{
        setTabs((prev)=>stateManager.handleClearExecutions(prev, workflowId));
    }, [
        setTabs,
        stateManager
    ]);
    // Handle removing a single execution
    const handleRemoveExecution = useCallback((workflowId, executionId)=>{
        setTabs((prev)=>stateManager.handleRemoveExecution(prev, workflowId, executionId));
    }, [
        setTabs,
        stateManager
    ]);
    // Handle real-time log updates from WebSocket
    const handleExecutionLogUpdate = useCallback((workflowId, executionId, log)=>{
        setTabs((prev)=>stateManager.handleExecutionLogUpdate(prev, workflowId, executionId, log));
    }, [
        setTabs,
        stateManager
    ]);
    // Handle execution status updates from WebSocket
    const handleExecutionStatusUpdate = useCallback((workflowId, executionId, status)=>{
        setTabs((prev)=>stateManager.handleExecutionStatusUpdate(prev, workflowId, executionId, status));
    }, [
        setTabs,
        stateManager
    ]);
    // Handle node state updates from WebSocket
    const handleExecutionNodeUpdate = useCallback((workflowId, executionId, nodeId, nodeState)=>{
        setTabs((prev)=>stateManager.handleExecutionNodeUpdate(prev, workflowId, executionId, nodeId, nodeState));
    }, [
        setTabs,
        stateManager
    ]);
    // Use polling hook for execution updates (fallback when WebSocket not available)
    useExecutionPolling({
        tabsRef,
        setTabs,
        apiClient,
        logger: injectedLogger,
        pollInterval: 2000
    });
    return {
        handleExecutionStart,
        handleClearExecutions,
        handleRemoveExecution,
        handleExecutionLogUpdate,
        handleExecutionStatusUpdate,
        handleExecutionNodeUpdate
    };
}
