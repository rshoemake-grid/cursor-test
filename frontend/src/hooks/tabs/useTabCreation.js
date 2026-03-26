/**
 * Tab Creation Hook
 * Handles creation of new workflow tabs
 * Extracted from useTabOperations.ts to follow Single Responsibility Principle
 */ import { useCallback } from 'react';
import { createNewTab } from '../utils/tabUtils';
/**
 * Hook for creating new workflow tabs
 * 
 * @param options Configuration options
 * @returns Tab creation handler
 */ export function useTabCreation({ setTabs, setActiveTabId }) {
    // Create a new workflow tab
    const handleNewWorkflow = useCallback(()=>{
        const newTab = createNewTab();
        setTabs((prev)=>[
                ...prev,
                newTab
            ]);
        setActiveTabId(newTab.id);
    }, [
        setTabs,
        setActiveTabId
    ]);
    return {
        handleNewWorkflow
    };
}
