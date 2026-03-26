import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Domain-based imports - Phase 7
import { getLocalStorageItem } from '../hooks/storage';
import { showSuccess } from '../utils/notifications';
import { STORAGE_KEYS } from '../config/constants';
const emptyTabState = {
    id: 'workflow-1',
    name: 'Untitled Workflow',
    workflowId: null,
    isUnsaved: true,
    executions: [],
    activeExecutionId: null
};
const WorkflowTabsContext = /*#__PURE__*/ createContext(null);
export function WorkflowTabsProvider({ children, storage, initialTabs, initialActiveTabId }) {
    // Initialize tabs from storage or provided initial value
    const [tabs, setTabsState] = useState(()=>{
        if (initialTabs) {
            return initialTabs;
        }
        const stored = getLocalStorageItem(STORAGE_KEYS.WORKFLOW_TABS, []);
        return Array.isArray(stored) && stored.length > 0 ? stored : [
            emptyTabState
        ];
    });
    // Initialize activeTabId from storage or provided initial value
    const [activeTabId, setActiveTabIdState] = useState(()=>{
        if (initialActiveTabId !== undefined) {
            return initialActiveTabId || tabs[0]?.id || 'workflow-1';
        }
        const saved = getLocalStorageItem(STORAGE_KEYS.ACTIVE_TAB, null);
        return saved && tabs.some((tab)=>tab.id === saved) ? saved : tabs[0]?.id || 'workflow-1';
    });
    // Track processed workflowId+loadKey combinations (for preventing duplicate tabs)
    const processedKeys = useRef(new Set());
    // Persist tabs to storage whenever they change
    useEffect(()=>{
        if (storage) {
            try {
                storage.setItem(STORAGE_KEYS.WORKFLOW_TABS, JSON.stringify(tabs));
            } catch  {
            // ignore quota errors
            }
        } else if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(STORAGE_KEYS.WORKFLOW_TABS, JSON.stringify(tabs));
            } catch  {
            // ignore quota errors
            }
        }
    }, [
        tabs,
        storage
    ]);
    // Persist activeTabId to storage whenever it changes
    useEffect(()=>{
        if (activeTabId) {
            if (storage) {
                try {
                    storage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
                } catch  {
                // ignore quota errors
                }
            } else if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
                } catch  {
                // ignore quota errors
                }
            }
        } else {
            if (storage) {
                try {
                    storage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
                } catch  {
                // ignore
                }
            } else if (typeof window !== 'undefined') {
                try {
                    window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
                } catch  {
                // ignore
                }
            }
        }
    }, [
        activeTabId,
        storage
    ]);
    // Show success message when restoring tabs from storage (only once)
    const [storageToastShown, setStorageToastShown] = useState(false);
    const isInitialStoragePresent = useMemo(()=>{
        if (initialTabs) return false;
        const stored = getLocalStorageItem(STORAGE_KEYS.WORKFLOW_TABS, []);
        return Array.isArray(stored) && stored.length > 0;
    }, [
        initialTabs
    ]);
    useEffect(()=>{
        if (isInitialStoragePresent && !storageToastShown) {
            showSuccess('Restored open workflow tabs from your previous session.');
            setStorageToastShown(true);
        }
    }, [
        isInitialStoragePresent,
        storageToastShown
    ]);
    // Wrapper for setTabs that supports both direct value and updater function
    const setTabs = useCallback((updater)=>{
        if (typeof updater === 'function') {
            setTabsState(updater);
        } else {
            setTabsState(updater);
        }
    }, []);
    const setActiveTabId = useCallback((id)=>{
        setActiveTabIdState(id);
    }, []);
    const value = {
        tabs,
        setTabs,
        activeTabId,
        setActiveTabId,
        processedKeys
    };
    return /*#__PURE__*/ _jsx(WorkflowTabsContext.Provider, {
        value: value,
        children: children
    });
}
// eslint-disable-next-line react-refresh/only-export-components -- context hook
export function useWorkflowTabs() {
    const context = useContext(WorkflowTabsContext);
    if (!context) {
        throw new Error('useWorkflowTabs must be used within WorkflowTabsProvider');
    }
    return context;
}
// eslint-disable-next-line react-refresh/only-export-components -- test helper
export function resetWorkflowTabsContext() {
    // This is a no-op in the context, but can be used in tests
    // The actual reset happens when creating a new provider instance
}
