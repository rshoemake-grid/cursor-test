/**
 * Tab Workflow Sync Hook
 * Handles synchronization between tabs and workflow state (loading, saving, modification tracking)
 * Extracted from useTabOperations.ts to follow Single Responsibility Principle
 */ import { useCallback } from 'react';
import { updateTab } from '../utils/tabUtils';
/**
 * Hook for synchronizing tab state with workflow operations
 * 
 * @param options Configuration options
 * @returns Workflow sync handlers
 */ export function useTabWorkflowSync({ setTabs }) {
    // Update tab when workflow is loaded
    const handleLoadWorkflow = useCallback((tabId, workflowId, name)=>{
        setTabs((prev)=>updateTab(prev, tabId, {
                workflowId,
                name,
                isUnsaved: false
            }));
    }, [
        setTabs
    ]);
    // Update tab when workflow is saved
    const handleWorkflowSaved = useCallback((tabId, workflowId, name)=>{
        setTabs((prev)=>updateTab(prev, tabId, {
                workflowId,
                name,
                isUnsaved: false
            }));
    }, [
        setTabs
    ]);
    // Mark tab as modified (unsaved)
    const handleWorkflowModified = useCallback((tabId)=>{
        setTabs((prev)=>updateTab(prev, tabId, {
                isUnsaved: true
            }));
    }, [
        setTabs
    ]);
    return {
        handleLoadWorkflow,
        handleWorkflowSaved,
        handleWorkflowModified
    };
}
