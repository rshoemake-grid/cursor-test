import { useMemo } from "react";
function useExecutionAnalytics({ executions, recentLimit = 10 }) {
  return useMemo(() => {
    const totalExecutions = executions.length;
    if (totalExecutions === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        totalDuration: 0,
        statusCounts: {},
        executionsByWorkflow: {},
        recentExecutions: [],
        failedExecutions: [],
      };
    }
    const statusCounts = {};
    executions.forEach((execution) => {
      statusCounts[execution.status] =
        (statusCounts[execution.status] || 0) + 1;
    });
    const completedCount = statusCounts.completed || 0;
    const successRate =
      totalExecutions > 0 ? (completedCount / totalExecutions) * 100 : 0;
    const durations = executions
      .map((execution) => {
        if (execution.completed_at) {
          return (
            new Date(execution.completed_at).getTime() -
            new Date(execution.started_at).getTime()
          );
        }
        return Date.now() - new Date(execution.started_at).getTime();
      })
      .filter((duration) => duration > 0);
    const totalDuration = durations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageDuration =
      durations.length > 0 ? totalDuration / durations.length : 0;
    const executionsByWorkflow = {};
    executions.forEach((execution) => {
      executionsByWorkflow[execution.workflow_id] =
        (executionsByWorkflow[execution.workflow_id] || 0) + 1;
    });
    const recentExecutions = [...executions]
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      )
      .slice(0, recentLimit);
    const failedExecutions = executions.filter(
      (execution) => execution.status === "failed",
    );
    return {
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      // Round to 2 decimal places
      averageDuration: Math.round(averageDuration / 1e3),
      // Convert to seconds
      totalDuration: Math.round(totalDuration / 1e3),
      // Convert to seconds
      statusCounts,
      executionsByWorkflow,
      recentExecutions,
      failedExecutions,
    };
  }, [executions, recentLimit]);
}
export { useExecutionAnalytics };
