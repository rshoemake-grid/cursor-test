import { useMemo } from "react";
function useAdvancedFilters({ executions, filters }) {
  const filteredExecutions = useMemo(() => {
    let result = [...executions];
    if (filters.dateRange?.start || filters.dateRange?.end) {
      result = result.filter((execution) => {
        const startDate = new Date(execution.started_at);
        const startMatch =
          !filters.dateRange?.start || startDate >= filters.dateRange.start;
        const endMatch =
          !filters.dateRange?.end || startDate <= filters.dateRange.end;
        return startMatch && endMatch;
      });
    }
    if (filters.minDuration !== void 0 || filters.maxDuration !== void 0) {
      result = result.filter((execution) => {
        const duration = execution.completed_at
          ? Math.floor(
              (new Date(execution.completed_at).getTime() -
                new Date(execution.started_at).getTime()) /
                1e3,
            )
          : Math.floor(
              (Date.now() - new Date(execution.started_at).getTime()) / 1e3,
            );
        const minMatch =
          filters.minDuration === void 0 || duration >= filters.minDuration;
        const maxMatch =
          filters.maxDuration === void 0 || duration <= filters.maxDuration;
        return minMatch && maxMatch;
      });
    }
    if (filters.hasError !== void 0) {
      result = result.filter((execution) => {
        if (filters.hasError) {
          return !!execution.error;
        } else {
          return !execution.error;
        }
      });
    }
    if (filters.workflowIds && filters.workflowIds.length > 0) {
      result = result.filter((execution) =>
        filters.workflowIds.includes(execution.workflow_id),
      );
    }
    if (filters.nodeIds && filters.nodeIds.length > 0) {
      result = result.filter((execution) => {
        if (!execution.node_states) {
          return false;
        }
        return filters.nodeIds.some(
          (nodeId) => nodeId in execution.node_states,
        );
      });
    }
    return result;
  }, [executions, filters]);
  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.minDuration !== void 0) count++;
    if (filters.maxDuration !== void 0) count++;
    if (filters.hasError !== void 0) count++;
    if (filters.workflowIds && filters.workflowIds.length > 0) count++;
    if (filters.nodeIds && filters.nodeIds.length > 0) count++;
    return count;
  }, [filters]);
  return {
    filteredExecutions,
    filterCount,
  };
}
export { useAdvancedFilters };
