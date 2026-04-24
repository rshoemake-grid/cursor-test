/**
 * Stable key for persisting React Flow pan/zoom per editor tab.
 * Each tab keeps its own pan/zoom even when multiple tabs edit the same {@code workflowId}.
 */
function canvasViewportStorageKey(tab) {
  if (tab == null || typeof tab !== "object") {
    return "tab:unknown";
  }
  const tid = tab.id;
  if (tid != null && tid !== "") {
    return `tab:${tid}`;
  }
  const wid = tab.workflowId;
  if (wid != null && wid !== "") {
    return `wf:${wid}`;
  }
  return "tab:unknown";
}

export { canvasViewportStorageKey };
