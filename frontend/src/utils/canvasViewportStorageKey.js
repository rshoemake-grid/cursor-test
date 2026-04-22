/**
 * Stable key for persisting React Flow pan/zoom per logical workflow.
 * Saved workflows share one viewport per {@code workflowId} (including duplicate tabs).
 * Unsaved tabs use {@code tab:${tabId}} so new drafts stay independent.
 */
function canvasViewportStorageKey(tab) {
  if (tab == null || typeof tab !== "object") {
    return "tab:unknown";
  }
  const wid = tab.workflowId;
  if (wid != null && wid !== "") {
    return `wf:${wid}`;
  }
  const tid = tab.id;
  if (tid != null && tid !== "") {
    return `tab:${tid}`;
  }
  return "tab:unknown";
}

export { canvasViewportStorageKey };
