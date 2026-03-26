import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkflowTabs } from '../contexts/WorkflowTabsContext';
import WorkflowBuilder from './WorkflowBuilder';
import { api } from '../api/client';
import { showError } from '../utils/notifications';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
import { API_CONFIG } from '../config/constants';
import { defaultAdapters } from '../types/adapters';
// Domain-based imports - Phase 7
import { useTabRenaming, useTabOperations, useTabInitialization } from '../hooks/tabs';
import { useExecutionManagement } from '../hooks/execution';
import { useMarketplacePublishing } from '../hooks/marketplace';
import { TabBar } from './TabBar';
import { PublishModal } from './PublishModal';
// Storage functions removed - now handled by WorkflowTabsContext
export default function WorkflowTabs({ initialWorkflowId, workflowLoadKey, onExecutionStart, // storage is now handled by WorkflowTabsContext, but kept for API compatibility
storage: _storage = defaultAdapters.createLocalStorageAdapter(), httpClient = defaultAdapters.createHttpClient(), apiBaseUrl = API_CONFIG.BASE_URL }) {
    // Use context for tabs state management (replaces module-level globalTabs)
    const { tabs, setTabs, activeTabId, setActiveTabId, processedKeys } = useWorkflowTabs();
    // Keep ref in sync with tabs state for polling logic
    const tabsRef = useRef(tabs);
    useEffect(()=>{
        tabsRef.current = tabs;
    }, [
        tabs
    ]);
    const builderRef = useRef(null);
    const { token } = useAuth();
    // Tab initialization hook
    useTabInitialization({
        tabs,
        activeTabId,
        setTabs,
        setActiveTabId,
        tabsRef,
        initialWorkflowId,
        workflowLoadKey,
        processedKeys
    });
    // Tab operations hook
    const tabOperations = useTabOperations({
        tabs,
        activeTabId,
        setTabs,
        setActiveTabId
    });
    const { handleNewWorkflow, handleCloseTab, handleCloseWorkflow, handleLoadWorkflow, handleWorkflowSaved, handleWorkflowModified } = tabOperations;
    // Execution management hook
    const executionManagement = useExecutionManagement({
        tabs,
        activeTabId,
        setTabs,
        tabsRef,
        onExecutionStart
    });
    const { handleExecutionStart, handleClearExecutions, handleRemoveExecution, handleExecutionLogUpdate, handleExecutionStatusUpdate, handleExecutionNodeUpdate } = executionManagement;
    const activeTab = tabs.find((t)=>t.id === activeTabId);
    // Marketplace publishing hook
    const marketplacePublishing = useMarketplacePublishing({
        activeTab: activeTab ? {
            id: activeTab.id,
            workflowId: activeTab.workflowId,
            name: activeTab.name
        } : undefined,
        token,
        httpClient,
        apiBaseUrl
    });
    const { showPublishModal, isPublishing, publishForm, openPublishModal, closePublishModal, handlePublishFormChange, handlePublish } = marketplacePublishing;
    // Tab renaming hook
    const tabRenaming = useTabRenaming({
        tabs,
        onRename: async (tabId, newName, previousName)=>{
            setTabs((prev)=>prev.map((t)=>t.id === tabId ? {
                        ...t,
                        name: newName
                    } : t));
            try {
                const tab = tabs.find((t)=>t.id === tabId);
                if (tab?.workflowId) {
                    // Fetch current workflow to get all required fields
                    const currentWorkflow = await api.getWorkflow(tab.workflowId);
                    // Update with new name but keep all existing data
                    await api.updateWorkflow(tab.workflowId, {
                        name: newName,
                        description: currentWorkflow.description,
                        nodes: currentWorkflow.nodes,
                        edges: currentWorkflow.edges,
                        variables: currentWorkflow.variables || {}
                    });
                }
            } catch (error) {
                const detail = extractApiErrorMessage(error, 'Unknown error');
                showError(`Failed to rename workflow: ${detail}`);
                setTabs((prev)=>prev.map((t)=>t.id === tabId ? {
                            ...t,
                            name: previousName
                        } : t));
                throw error // Re-throw so hook can handle it
                ;
            }
        }
    });
    const { editingTabId, editingName, editingInputRef, setEditingName, startEditing: startEditingTabName, handleInputBlur, handleInputKeyDown } = tabRenaming;
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ _jsx(TabBar, {
                tabs: tabs,
                activeTabId: activeTabId,
                editingTabId: editingTabId,
                editingName: editingName,
                editingInputRef: editingInputRef,
                setEditingName: setEditingName,
                onTabClick: setActiveTabId,
                onTabDoubleClick: startEditingTabName,
                onCloseTab: handleCloseTab,
                onInputBlur: handleInputBlur,
                onInputKeyDown: handleInputKeyDown,
                onNewWorkflow: handleNewWorkflow,
                onSave: ()=>void builderRef.current?.saveWorkflow(),
                onExecute: ()=>builderRef.current?.executeWorkflow(),
                onPublish: openPublishModal,
                onExport: ()=>builderRef.current?.exportWorkflow()
            }),
            activeTab && /*#__PURE__*/ _jsx("div", {
                className: "flex-1 flex flex-col overflow-hidden",
                children: /*#__PURE__*/ _jsx(WorkflowBuilder, {
                    ref: builderRef,
                    tabId: activeTab.id,
                    workflowId: activeTab.workflowId,
                    tabName: activeTab.name,
                    tabIsUnsaved: activeTab.isUnsaved,
                    workflowTabs: tabs.filter((tab)=>tab.workflowId !== null).map((tab)=>({
                            workflowId: tab.workflowId,
                            workflowName: tab.name,
                            executions: tab.executions,
                            activeExecutionId: tab.activeExecutionId
                        })),
                    onExecutionStart: handleExecutionStart,
                    onWorkflowSaved: (workflowId, name)=>handleWorkflowSaved(activeTab.id, workflowId, name),
                    onWorkflowModified: ()=>handleWorkflowModified(activeTab.id),
                    onWorkflowLoaded: (workflowId, name)=>handleLoadWorkflow(activeTab.id, workflowId, name),
                    onCloseWorkflow: handleCloseWorkflow,
                    onClearExecutions: handleClearExecutions,
                    onExecutionLogUpdate: handleExecutionLogUpdate,
                    onExecutionStatusUpdate: handleExecutionStatusUpdate,
                    onExecutionNodeUpdate: handleExecutionNodeUpdate,
                    onRemoveExecution: handleRemoveExecution
                })
            }),
            tabs.length === 0 && /*#__PURE__*/ _jsx("div", {
                className: "flex-1 flex items-center justify-center bg-gray-50",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-500 mb-4",
                            children: "No executions"
                        }),
                        /*#__PURE__*/ _jsxs("button", {
                            onClick: handleNewWorkflow,
                            className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto",
                            children: [
                                /*#__PURE__*/ _jsx(Plus, {
                                    className: "w-4 h-4"
                                }),
                                "New Workflow"
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx(PublishModal, {
                isOpen: showPublishModal,
                form: publishForm,
                isPublishing: isPublishing,
                onClose: closePublishModal,
                onFormChange: handlePublishFormChange,
                onSubmit: handlePublish
            })
        ]
    });
}
