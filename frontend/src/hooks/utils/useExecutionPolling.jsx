import { useEffect } from "react";
import { logger } from "../../utils/logger";
import {
  isRealExecutionId,
  shouldLogExecutionError,
} from "./executionIdValidation";
import { safeGetTabsRefCurrent } from "./safeRefs";
import { mapApiStatusToExecutionUiStatus } from "./apiExecutionStatus";
function useExecutionPolling({
  tabsRef,
  setTabs,
  apiClient,
  logger: injectedLogger = logger,
  pollInterval = 2e3,
}) {
  useEffect(() => {
    const isPositive = pollInterval > 0;
    const isWithinLimit = pollInterval < 6e4;
    const isValidInterval = isPositive === true && isWithinLimit === true;
    const safePollInterval = isValidInterval === true ? pollInterval : 2e3;
    let iterationCount = 0;
    const MAX_ITERATIONS = 1e3;
    const interval = setInterval(async () => {
      iterationCount++;
      const exceedsMaxIterations = iterationCount > MAX_ITERATIONS;
      if (exceedsMaxIterations === true) {
        injectedLogger.warn(
          `[WorkflowTabs] Max polling iterations (${MAX_ITERATIONS}) reached, stopping polling`,
        );
        clearInterval(interval);
        return;
      }
      const currentTabs = safeGetTabsRefCurrent(tabsRef);
      if (currentTabs === null) {
        return;
      }
      const isArray = Array.isArray(currentTabs) === true;
      if (isArray === false) return;
      const runningExecutions = currentTabs.flatMap((tab) => {
        const hasTab = tab !== null && tab !== void 0;
        const hasExecutions =
          hasTab === true &&
          tab.executions !== null &&
          tab.executions !== void 0;
        const isExecutionsArray =
          hasExecutions === true && Array.isArray(tab.executions) === true;
        if (
          hasTab === false ||
          hasExecutions === false ||
          isExecutionsArray === false
        )
          return [];
        return tab.executions.filter((e) => {
          const hasExecution = e !== null && e !== void 0;
          const hasId =
            hasExecution === true && e.id !== null && e.id !== void 0;
          const isRunning = hasId === true && e.status === "running";
          const isValidId =
            isRunning === true && isRealExecutionId(e.id) === true;
          return (
            hasExecution === true &&
            hasId === true &&
            isRunning === true &&
            isValidId === true
          );
        });
      });
      const hasRunningExecutions = runningExecutions.length > 0;
      if (hasRunningExecutions === false) return;
      const exceedsLimit = runningExecutions.length > 50;
      if (exceedsLimit === true) {
        injectedLogger.warn(
          `[WorkflowTabs] Too many running executions (${runningExecutions.length}), limiting to 50`,
        );
        runningExecutions.splice(50);
      }
      const updates = await Promise.all(
        runningExecutions.map(async (exec) => {
          try {
            const execution = await apiClient.getExecution(exec.id);
            const mapped = mapApiStatusToExecutionUiStatus(execution);
            const newStatus =
              mapped !== null && mapped !== void 0 ? mapped : exec.status;
            const statusChanged = exec.status !== newStatus;
            if (statusChanged === true) {
              injectedLogger.debug(
                `[WorkflowTabs] Execution ${exec.id} status changed: ${exec.status} \u2192 ${newStatus}`,
              );
            }
            const hasCompletedAt =
              execution.completed_at !== null &&
              execution.completed_at !== void 0;
            const completedAt =
              hasCompletedAt === true
                ? new Date(execution.completed_at)
                : void 0;
            const hasNodeStates =
              execution.node_states !== null &&
              execution.node_states !== void 0 &&
              typeof execution.node_states === "object" &&
              Object.keys(execution.node_states).length > 0;
            const nodes = hasNodeStates === true ? execution.node_states : (exec.nodes ?? {});
            const hasLogs =
              execution.logs !== null &&
              execution.logs !== void 0 &&
              Array.isArray(execution.logs) === true;
            const apiLogs = hasLogs === true ? execution.logs : [];
            const clientLogs = exec.logs ?? [];
            const logs =
              apiLogs.length >= clientLogs.length ? apiLogs : clientLogs;
            const apiError =
              execution.error != null && String(execution.error).trim() !== ""
                ? String(execution.error)
                : undefined;
            return {
              id: exec.id,
              status: newStatus,
              startedAt: exec.startedAt,
              completedAt,
              nodes,
              logs,
              error:
                newStatus === "completed"
                  ? undefined
                  : apiError !== undefined
                    ? apiError
                    : exec.error,
            };
          } catch (error) {
            const shouldLog = shouldLogExecutionError(exec) === true;
            if (shouldLog === true) {
              injectedLogger.error(
                `[WorkflowTabs] Failed to fetch execution ${exec.id}:`,
                error,
              );
            }
            return null;
          }
        }),
      );
      setTabs((prev) => {
        return prev.map((tab) => ({
          ...tab,
          executions: (() => {
            const hasExecutions =
              tab.executions !== null && tab.executions !== void 0;
            const isExecutionsArray =
              hasExecutions === true && Array.isArray(tab.executions) === true;
            if (hasExecutions === false || isExecutionsArray === false)
              return [];
            return tab.executions.map((exec) => {
              const update = updates.find((u) => {
                const hasUpdate2 = u !== null && u !== void 0;
                const hasUpdateId =
                  hasUpdate2 === true && u.id !== null && u.id !== void 0;
                const matchesExec = hasUpdateId === true && u.id === exec.id;
                return (
                  hasUpdate2 === true &&
                  hasUpdateId === true &&
                  matchesExec === true
                );
              });
              const hasUpdate = update !== null && update !== void 0;
              return hasUpdate === true ? update : exec;
            });
          })(),
        }));
      });
    }, safePollInterval);
    return () => {
      const hasInterval = interval !== null && interval !== void 0;
      if (hasInterval === true) {
        clearInterval(interval);
      }
    };
  }, [tabsRef, setTabs, apiClient, injectedLogger, pollInterval]);
}
export { useExecutionPolling };
