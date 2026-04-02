import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createNewTab } from "../hooks/utils/tabUtils";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkflowTabs } from "../contexts/WorkflowTabsContext";
import WorkflowBuilder from "./WorkflowBuilder";
import { api } from "../api/client";
import { showError } from "../utils/notifications";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { API_CONFIG } from "../config/constants";
import { defaultAdapters } from "../types/adapters";
import { useTabRenaming, useTabOperations, useTabInitialization } from "../hooks/tabs";
import { useExecutionManagement } from "../hooks/execution";
import { useMarketplacePublishing } from "../hooks/marketplace";
import { TabBar } from "./TabBar";
import { PublishModal } from "./PublishModal";
function WorkflowTabs({
  initialWorkflowId,
  workflowLoadKey,
  onExecutionStart,
  // storage is now handled by WorkflowTabsContext, but kept for API compatibility
   
  storage: _storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL
}) {
  const { tabs, setTabs, activeTabId, setActiveTabId, processedKeys } = useWorkflowTabs();
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  const builderRef = useRef(null);
  const { token, isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setTabs((prev) => {
      if (!prev.some((t) => t.workflowId != null)) {
        return prev;
      }
      const newTab = createNewTab();
      tabsRef.current = [newTab];
      queueMicrotask(() => {
        setActiveTabId(newTab.id);
      });
      return [newTab];
    });
  }, [isAuthenticated, setTabs, setActiveTabId, tabsRef]);
  useTabInitialization({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
    tabsRef,
    initialWorkflowId,
    workflowLoadKey,
    processedKeys,
    isAuthenticated
  });
  const tabOperations = useTabOperations({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId
  });
  const {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified
  } = tabOperations;
  const executionManagement = useExecutionManagement({
    tabs,
    activeTabId,
    setTabs,
    tabsRef,
    onExecutionStart
  });
  const {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate
  } = executionManagement;
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const marketplacePublishing = useMarketplacePublishing({
    activeTab: activeTab ? { id: activeTab.id, workflowId: activeTab.workflowId, name: activeTab.name } : void 0,
    token,
    httpClient,
    apiBaseUrl
  });
  const {
    showPublishModal,
    isPublishing,
    publishForm,
    openPublishModal,
    closePublishModal,
    handlePublishFormChange,
    handlePublish
  } = marketplacePublishing;
  const tabRenaming = useTabRenaming({
    tabs,
    onRename: async (tabId, newName, previousName) => {
      setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, name: newName } : t));
      try {
        const tab = tabs.find((t) => t.id === tabId);
        if (tab?.workflowId && isAuthenticated) {
          const currentWorkflow = await api.getWorkflow(tab.workflowId);
          await api.updateWorkflow(tab.workflowId, {
            name: newName,
            description: currentWorkflow.description,
            nodes: currentWorkflow.nodes,
            edges: currentWorkflow.edges,
            variables: currentWorkflow.variables || {}
          });
        }
      } catch (error) {
        const detail = extractApiErrorMessage(error, "Unknown error");
        showError(`Failed to rename workflow: ${detail}`);
        setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, name: previousName } : t));
        throw error;
      }
    }
  });
  const {
    editingTabId,
    editingName,
    editingInputRef,
    setEditingName,
    startEditing: startEditingTabName,
    handleInputBlur,
    handleInputKeyDown
  } = tabRenaming;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx(
      TabBar,
      {
        tabs,
        activeTabId,
        editingTabId,
        editingName,
        editingInputRef,
        setEditingName,
        onTabClick: setActiveTabId,
        onTabDoubleClick: startEditingTabName,
        onCloseTab: handleCloseTab,
        onInputBlur: handleInputBlur,
        onInputKeyDown: handleInputKeyDown,
        onNewWorkflow: handleNewWorkflow,
        onSave: () => void builderRef.current?.saveWorkflow(),
        onClearWorkflow: () => void builderRef.current?.clearWorkflow?.(),
        onExecute: () => builderRef.current?.executeWorkflow(),
        onPublish: openPublishModal,
        onExport: () => builderRef.current?.exportWorkflow()
      }
    ),
    activeTab && /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: /* @__PURE__ */ jsx(
      WorkflowBuilder,
      {
        key: activeTab.id,
        ref: builderRef,
        tabId: activeTab.id,
        workflowId: activeTab.workflowId,
        tabName: activeTab.name,
        tabIsUnsaved: activeTab.isUnsaved,
        workflowTabs: tabs.filter((tab) => tab.workflowId !== null).map((tab) => ({
          workflowId: tab.workflowId,
          workflowName: tab.name,
          executions: tab.executions,
          activeExecutionId: tab.activeExecutionId
        })),
        onExecutionStart: handleExecutionStart,
        onWorkflowSaved: (workflowId, name) => handleWorkflowSaved(activeTab.id, workflowId, name),
        onWorkflowModified: () => handleWorkflowModified(activeTab.id),
        onWorkflowLoaded: (workflowId, name) => handleLoadWorkflow(activeTab.id, workflowId, name),
        onCloseWorkflow: handleCloseWorkflow,
        onClearExecutions: handleClearExecutions,
        onExecutionLogUpdate: handleExecutionLogUpdate,
        onExecutionStatusUpdate: handleExecutionStatusUpdate,
        onExecutionNodeUpdate: handleExecutionNodeUpdate,
        onRemoveExecution: handleRemoveExecution
      }
    ) }),
    tabs.length === 0 && /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-4", children: "No executions" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleNewWorkflow,
          className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "New Workflow"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(
      PublishModal,
      {
        isOpen: showPublishModal,
        form: publishForm,
        isPublishing,
        onClose: closePublishModal,
        onFormChange: handlePublishFormChange,
        onSubmit: handlePublish
      }
    )
  ] });
}
export {
  WorkflowTabs as default
};
