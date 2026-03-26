/**
 * Tab Utilities
 * Common utilities for tab manipulation operations
 * Extracted to eliminate DRY violations and improve maintainability
 */ /**
 * Create a new workflow tab with default values
 */ export function createNewTab() {
    return {
        id: `workflow-${Date.now()}`,
        name: 'Untitled Workflow',
        workflowId: null,
        isUnsaved: true,
        executions: [],
        activeExecutionId: null
    };
}
/**
 * Create a new tab with a workflow ID (for loading workflows)
 */ export function createTabWithWorkflow(workflowId, name = 'Loading...') {
    return {
        id: `workflow-${Date.now()}`,
        name,
        workflowId,
        isUnsaved: false,
        executions: [],
        activeExecutionId: null
    };
}
/**
 * Update a tab by ID
 */ export function updateTab(tabs, tabId, updates) {
    return tabs.map((tab)=>tab.id === tabId ? {
            ...tab,
            ...updates
        } : tab);
}
/**
 * Update a tab by workflow ID
 */ export function updateTabByWorkflowId(tabs, workflowId, updates) {
    return tabs.map((tab)=>tab.workflowId === workflowId ? {
            ...tab,
            ...updates
        } : tab);
}
/**
 * Find a tab by ID
 */ export function findTab(tabs, tabId) {
    return tabs.find((tab)=>tab.id === tabId);
}
/**
 * Find a tab by workflow ID
 */ export function findTabByWorkflowId(tabs, workflowId) {
    return tabs.find((tab)=>tab.workflowId === workflowId);
}
/**
 * Remove a tab by ID
 */ export function removeTab(tabs, tabId) {
    return tabs.filter((tab)=>tab.id !== tabId);
}
/**
 * Handle active tab switching after closing a tab
 * Switches to the last tab if closing the active tab, or sets to empty string if no tabs remain
 */ export function handleActiveTabAfterClose(closedTabId, activeTabId, remainingTabs, setActiveTabId) {
    if (closedTabId !== activeTabId) {
        return;
    }
    if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
    } else {
        setActiveTabId('');
    }
}
/**
 * Check if a tab exists in the tabs array
 */ export function tabExists(tabs, tabId) {
    return tabs.some((tab)=>tab.id === tabId);
}
/**
 * Get the index of a tab by ID
 */ export function getTabIndex(tabs, tabId) {
    return tabs.findIndex((tab)=>tab.id === tabId);
}
