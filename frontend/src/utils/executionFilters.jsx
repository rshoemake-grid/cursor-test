import {
  mapApiStatusToExecutionUiStatus,
  normalizeApiExecutionStatusToken,
} from "../hooks/utils/apiExecutionStatus";

function filterByStatus(executions, statuses) {
  if (!statuses || statuses.length === 0) {
    return executions;
  }
  return executions.filter((execution) => {
    const ui = mapApiStatusToExecutionUiStatus(execution);
    const raw = execution?.status;
    const token =
      ui ??
      (typeof raw === "string"
        ? raw.trim().toLowerCase()
        : normalizeApiExecutionStatusToken(raw));
    return token !== "" && token != null && statuses.includes(token);
  });
}
function filterByWorkflowId(executions, workflowId) {
  if (!workflowId) {
    return executions;
  }
  return executions.filter((execution) => execution.workflow_id === workflowId);
}
function filterBySearchQuery(executions, searchQuery) {
  if (!searchQuery || searchQuery.trim() === "") {
    return executions;
  }
  const query = searchQuery.toLowerCase().trim();
  return executions.filter((execution) => {
    if (execution.execution_id.toLowerCase().includes(query)) {
      return true;
    }
    if (execution.workflow_id.toLowerCase().includes(query)) {
      return true;
    }
    if (execution.error && execution.error.toLowerCase().includes(query)) {
      return true;
    }
    if (
      execution.current_node &&
      execution.current_node.toLowerCase().includes(query)
    ) {
      return true;
    }
    return false;
  });
}
function sortExecutions(executions, sortBy = "started_at", sortOrder = "desc") {
  const sorted = [...executions].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "started_at":
        comparison =
          new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
        break;
      case "completed_at":
        const aCompleted = a.completed_at
          ? new Date(a.completed_at).getTime()
          : 0;
        const bCompleted = b.completed_at
          ? new Date(b.completed_at).getTime()
          : 0;
        comparison = aCompleted - bCompleted;
        break;
      case "duration":
        const aDuration = a.completed_at
          ? new Date(a.completed_at).getTime() -
            new Date(a.started_at).getTime()
          : Date.now() - new Date(a.started_at).getTime();
        const bDuration = b.completed_at
          ? new Date(b.completed_at).getTime() -
            new Date(b.started_at).getTime()
          : Date.now() - new Date(b.started_at).getTime();
        comparison = aDuration - bDuration;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
  return sorted;
}
function applyExecutionFilters(executions, filters) {
  let filtered = executions;
  filtered = filterByStatus(filtered, filters.status);
  filtered = filterByWorkflowId(filtered, filters.workflowId);
  filtered = filterBySearchQuery(filtered, filters.searchQuery);
  filtered = sortExecutions(filtered, filters.sortBy, filters.sortOrder);
  return filtered;
}
export {
  applyExecutionFilters,
  filterBySearchQuery,
  filterByStatus,
  filterByWorkflowId,
  sortExecutions,
};
