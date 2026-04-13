/**
 * Resolves execution list + active id for the builder console.
 * Unsaved tabs have workflowId null; match by tabId first, then by saved workflowId.
 */
function selectExecutionStateForBuilderTab(
  workflowTabs,
  tabId,
  localWorkflowId,
) {
  const byTabId = workflowTabs?.find((t) => t.tabId === tabId);
  if (byTabId) {
    return {
      executions: byTabId.executions ?? [],
      activeExecutionId: byTabId.activeExecutionId ?? null,
    };
  }
  if (localWorkflowId != null && localWorkflowId !== "") {
    const byWorkflowId = workflowTabs?.find(
      (t) => t.workflowId === localWorkflowId,
    );
    if (byWorkflowId) {
      return {
        executions: byWorkflowId.executions ?? [],
        activeExecutionId: byWorkflowId.activeExecutionId ?? null,
      };
    }
  }
  return { executions: [], activeExecutionId: null };
}

export { selectExecutionStateForBuilderTab };
