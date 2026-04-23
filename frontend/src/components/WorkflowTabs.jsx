import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
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
import {
  useTabRenaming,
  useTabOperations,
  useTabInitialization,
} from "../hooks/tabs";
import { useExecutionManagement } from "../hooks/execution";
import { useMarketplacePublishing } from "../hooks/marketplace";
import { TabBar } from "./TabBar";
import { PublishModal } from "./PublishModal";
import {
  EmptyStateInlineCenter,
  EmptyStateLead,
  EmptyStatePrimaryCta,
} from "../styles/contentBlocks.styled";
import {
  WorkflowTabsRoot,
  WorkflowBuilderMain,
  WorkflowEmptyMain,
  Icon16,
} from "../styles/workflowBuilderShell.styled";
import { canvasViewportStorageKey } from "../utils/canvasViewportStorageKey";
function WorkflowTabs({
  initialWorkflowId,
  workflowLoadKey,
  onExecutionStart,
  // storage is now handled by WorkflowTabsContext, but kept for API compatibility

  storage: _storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL,
}) {
  const {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId: setActiveTabIdFromContext,
    processedKeys,
  } = useWorkflowTabs();
  /** Toolbar / TabBar actions target the active tab's imperative API. */
  const builderRef = useRef(null);
  /** One WorkflowBuilder instance per tab — kept mounted so canvas state survives tab switches. */
  const builderApisRef = useRef(new Map());
  useLayoutEffect(() => {
    builderRef.current = builderApisRef.current.get(activeTabId) ?? null;
  }, [activeTabId, tabs]);
  /** Stable callback per tabId so React does not detach refs every parent render. */
  const builderRefCallbacksRef = useRef(new Map());
  const getBuilderRefCallback = useCallback((tabId) => {
    let cb = builderRefCallbacksRef.current.get(tabId);
    if (!cb) {
      cb = (instance) => {
        if (instance) {
          builderApisRef.current.set(tabId, instance);
        } else {
          builderApisRef.current.delete(tabId);
        }
      };
      builderRefCallbacksRef.current.set(tabId, cb);
    }
    return cb;
  }, []);
  useEffect(() => {
    const ids = new Set(tabs.map((t) => t.id));
    for (const id of builderRefCallbacksRef.current.keys()) {
      if (!ids.has(id)) {
        builderRefCallbacksRef.current.delete(id);
      }
    }
  }, [tabs]);
  /** Per-workflow (or per-unsaved-tab) React Flow viewport; same workflowId shares one pan/zoom. */
  const canvasViewportsRef = useRef(new Map());
  const setActiveTabId = useCallback(
    (nextId) => {
      if (nextId !== activeTabId) {
        const api = builderApisRef.current.get(activeTabId);
        const vp = api?.getViewport?.();
        if (vp && activeTabId) {
          const prevTab = tabsRef.current.find((t) => t.id === activeTabId);
          if (prevTab) {
            canvasViewportsRef.current.set(canvasViewportStorageKey(prevTab), {
              x: vp.x,
              y: vp.y,
              zoom: vp.zoom,
            });
          }
        }
      }
      setActiveTabIdFromContext(nextId);
    },
    [activeTabId, setActiveTabIdFromContext],
  );
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const { token, isAuthenticated } = useAuth();
  const resetTabsForLoggedOutPrivacy = useCallback(() => {
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
  }, [setTabs, setActiveTabId]);
  useEffect(() => {
    const onLoggedOut = () => {
      resetTabsForLoggedOutPrivacy();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth:logged-out", onLoggedOut);
      return () => {
        window.removeEventListener("auth:logged-out", onLoggedOut);
      };
    }
    return void 0;
  }, [resetTabsForLoggedOutPrivacy]);
  useTabInitialization({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
    tabsRef,
    initialWorkflowId,
    workflowLoadKey,
    processedKeys,
    isAuthenticated,
  });
  useEffect(() => {
    const map = canvasViewportsRef.current;
    for (const tab of tabs) {
      const wf = tab.workflowId;
      if (wf != null && wf !== "") {
        const fromTab = canvasViewportStorageKey({
          id: tab.id,
          workflowId: null,
        });
        const toWf = canvasViewportStorageKey(tab);
        if (map.has(fromTab) && fromTab !== toWf) {
          map.set(toWf, map.get(fromTab));
          map.delete(fromTab);
        }
      }
    }
    const validKeys = new Set(tabs.map((t) => canvasViewportStorageKey(t)));
    for (const k of [...map.keys()]) {
      if (!validKeys.has(k)) {
        map.delete(k);
      }
    }
  }, [tabs]);
  const tabOperations = useTabOperations({
    tabs,
    activeTabId,
    setTabs,
    setActiveTabId,
  });
  const {
    handleNewWorkflow,
    handleCloseTab,
    handleCloseWorkflow,
    handleLoadWorkflow,
    handleWorkflowSaved,
    handleWorkflowModified,
  } = tabOperations;
  const executionManagement = useExecutionManagement({
    tabs,
    activeTabId,
    setTabs,
    tabsRef,
    onExecutionStart,
  });
  const {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate,
  } = executionManagement;
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const marketplacePublishing = useMarketplacePublishing({
    activeTab: activeTab
      ? {
          id: activeTab.id,
          workflowId: activeTab.workflowId,
          name: activeTab.name,
        }
      : void 0,
    token,
    httpClient,
    apiBaseUrl,
  });
  const {
    showPublishModal,
    isPublishing,
    publishForm,
    openPublishModal,
    closePublishModal,
    handlePublishFormChange,
    handlePublish,
  } = marketplacePublishing;
  const tabRenaming = useTabRenaming({
    tabs,
    onRename: async (tabId, newName, previousName) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? {
                ...t,
                name: newName,
              }
            : t,
        ),
      );
      try {
        const tab = tabs.find((t) => t.id === tabId);
        if (tab?.workflowId && isAuthenticated) {
          const currentWorkflow = await api.getWorkflow(tab.workflowId);
          await api.updateWorkflow(tab.workflowId, {
            name: newName,
            description: currentWorkflow.description,
            nodes: currentWorkflow.nodes,
            edges: currentWorkflow.edges,
            variables: currentWorkflow.variables || {},
          });
        }
      } catch (error) {
        const detail = extractApiErrorMessage(error, "Unknown error");
        showError(`Failed to rename workflow: ${detail}`);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  name: previousName,
                }
              : t,
          ),
        );
        throw error;
      }
    },
  });
  const {
    editingTabId,
    editingName,
    editingInputRef,
    setEditingName,
    startEditing: startEditingTabName,
    handleInputBlur,
    handleInputKeyDown,
  } = tabRenaming;
  return (
    <WorkflowTabsRoot>
      <TabBar
        tabs={tabs}
        tabState={{
          activeTabId,
          editingTabId,
          editingName,
        }}
        tabActions={{
          setActiveTabId,
          setEditingName,
          startEditingTabName,
          handleCloseTab,
        }}
        inputProps={{
          editingInputRef,
          onBlur: handleInputBlur,
          onKeyDown: handleInputKeyDown,
        }}
        workflowActions={{
          onNew: handleNewWorkflow,
          onSave: () => void builderRef.current?.saveWorkflow(),
          onClear: () => void builderRef.current?.clearWorkflow?.(),
          onExecute: () => builderRef.current?.executeWorkflow(),
          onPublish: openPublishModal,
          onExport: () => builderRef.current?.exportWorkflow(),
        }}
      />
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const initialVp =
          canvasViewportsRef.current.get(canvasViewportStorageKey(tab)) ??
          null;
        return (
          <WorkflowBuilderMain
            key={tab.id}
            style={{
              display: isActive ? "flex" : "none",
              flexDirection: "column",
            }}
            aria-hidden={!isActive}
          >
            <WorkflowBuilder
              ref={getBuilderRefCallback(tab.id)}
              initialViewport={initialVp}
              tab={{
                tabId: tab.id,
                workflowId: tab.workflowId,
                tabName: tab.name,
                tabIsUnsaved: tab.isUnsaved,
              }}
              workflowTabs={tabs.map((t) => ({
                tabId: t.id,
                workflowId: t.workflowId,
                workflowName: t.name,
                executions: t.executions,
                activeExecutionId: t.activeExecutionId,
              }))}
              callbacks={{
                onExecutionStart: handleExecutionStart,
                onWorkflowSaved: (workflowId, name) => {
                  const tabId = tab.id;
                  const tabOnlyKey = canvasViewportStorageKey({
                    id: tabId,
                    workflowId: null,
                  });
                  const savedKey = canvasViewportStorageKey({
                    id: tabId,
                    workflowId,
                  });
                  const api = builderApisRef.current.get(tabId);
                  const vp =
                    api?.getViewport?.() ??
                    canvasViewportsRef.current.get(tabOnlyKey);
                  if (
                    vp != null &&
                    Number.isFinite(vp.x) &&
                    Number.isFinite(vp.y) &&
                    Number.isFinite(vp.zoom)
                  ) {
                    canvasViewportsRef.current.set(savedKey, {
                      x: vp.x,
                      y: vp.y,
                      zoom: vp.zoom,
                    });
                    canvasViewportsRef.current.delete(tabOnlyKey);
                  }
                  handleWorkflowSaved(tabId, workflowId, name);
                },
                onWorkflowModified: () => handleWorkflowModified(tab.id),
                onWorkflowLoaded: (workflowId, name) =>
                  handleLoadWorkflow(tab.id, workflowId, name),
                onCloseWorkflow: handleCloseWorkflow,
                onClearExecutions: handleClearExecutions,
                onExecutionLogUpdate: handleExecutionLogUpdate,
                onExecutionStatusUpdate: handleExecutionStatusUpdate,
                onExecutionNodeUpdate: handleExecutionNodeUpdate,
                onRemoveExecution: handleRemoveExecution,
                onActiveExecutionChange: (executionId) => {
                  setTabs((prev) =>
                    prev.map((t) =>
                      t.id === tab.id
                        ? { ...t, activeExecutionId: executionId }
                        : t,
                    ),
                  );
                },
              }}
            />
          </WorkflowBuilderMain>
        );
      })}
      {tabs.length === 0 && (
        <WorkflowEmptyMain>
          <EmptyStateInlineCenter>
            <EmptyStateLead>No executions</EmptyStateLead>
            <EmptyStatePrimaryCta type="button" onClick={handleNewWorkflow}>
              <Icon16>
                <Plus aria-hidden />
              </Icon16>
              New Workflow
            </EmptyStatePrimaryCta>
          </EmptyStateInlineCenter>
        </WorkflowEmptyMain>
      )}
      <PublishModal
        dialog={{
          isOpen: showPublishModal,
          isPublishing,
        }}
        form={publishForm}
        handlers={{
          onClose: closePublishModal,
          onFormChange: handlePublishFormChange,
          onSubmit: handlePublish,
        }}
      />
    </WorkflowTabsRoot>
  );
}

WorkflowTabs.propTypes = {
  initialWorkflowId: PropTypes.string,
  workflowLoadKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onExecutionStart: PropTypes.func,
  storage: PropTypes.shape({
    getItem: PropTypes.func,
    setItem: PropTypes.func,
    removeItem: PropTypes.func,
  }),
  httpClient: PropTypes.object,
  apiBaseUrl: PropTypes.string,
};

export { WorkflowTabs as default };
