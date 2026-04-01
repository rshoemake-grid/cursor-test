function createNewTab() {
  return {
    id: `workflow-${Date.now()}`,
    name: "Untitled Workflow",
    workflowId: null,
    isUnsaved: true,
    executions: [],
    activeExecutionId: null
  };
}
function createTabWithWorkflow(workflowId, name = "Loading...") {
  return {
    id: `workflow-${Date.now()}`,
    name,
    workflowId,
    isUnsaved: false,
    executions: [],
    activeExecutionId: null
  };
}
function updateTab(tabs, tabId, updates) {
  return tabs.map(
    (tab) => tab.id === tabId ? { ...tab, ...updates } : tab
  );
}
function updateTabByWorkflowId(tabs, workflowId, updates) {
  return tabs.map(
    (tab) => tab.workflowId === workflowId ? { ...tab, ...updates } : tab
  );
}
function findTab(tabs, tabId) {
  return tabs.find((tab) => tab.id === tabId);
}
function findTabByWorkflowId(tabs, workflowId) {
  return tabs.find((tab) => tab.workflowId === workflowId);
}
function removeTab(tabs, tabId) {
  return tabs.filter((tab) => tab.id !== tabId);
}
function handleActiveTabAfterClose(closedTabId, activeTabId, remainingTabs, setActiveTabId) {
  if (closedTabId !== activeTabId) {
    return;
  }
  if (remainingTabs.length > 0) {
    setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
  } else {
    setActiveTabId("");
  }
}
function tabExists(tabs, tabId) {
  return tabs.some((tab) => tab.id === tabId);
}
function getTabIndex(tabs, tabId) {
  return tabs.findIndex((tab) => tab.id === tabId);
}
export {
  createNewTab,
  createTabWithWorkflow,
  findTab,
  findTabByWorkflowId,
  getTabIndex,
  handleActiveTabAfterClose,
  removeTab,
  tabExists,
  updateTab,
  updateTabByWorkflowId
};
