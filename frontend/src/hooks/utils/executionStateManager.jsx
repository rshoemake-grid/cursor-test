var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value);
var __publicField = (obj, key, value) =>
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { logger } from "../../utils/logger";
import { updateTabByWorkflowId } from "./tabUtils";
import {
  isRealExecutionId,
  isPendingExecutionId,
} from "./executionIdValidation";
import { logicalOrToEmptyArray } from "./logicalOr";
import { isValidExecutionStatus } from "../../constants/stringLiterals";
import { mapApiStatusToExecutionUiStatus } from "./apiExecutionStatus";
class ExecutionStateManager {
  constructor({ logger: injectedLogger = logger } = {}) {
    __publicField(this, "logger");
    this.logger = injectedLogger;
  }
  /**
   * Handle execution start - add to active tab's executions
   * Single Responsibility: Only handles execution start logic
   */
  handleExecutionStart(tabs, activeTabId, executionId) {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return tabs;
    return tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      const execList = tab.executions ?? [];
      if (isRealExecutionId(executionId)) {
        const pendingExecutions = execList
          .map((exec, idx) => ({ exec, idx }))
          .filter(
            ({ exec }) => exec && exec.id && isPendingExecutionId(exec.id),
          );
        if (pendingExecutions.length > 0) {
          const oldestPending = pendingExecutions[pendingExecutions.length - 1];
          return {
            ...tab,
            executions: execList.map((exec, idx) =>
              idx === oldestPending.idx
                ? {
                    ...exec,
                    id: executionId,
                  }
                : exec,
            ),
            activeExecutionId: executionId,
          };
        }
      }
      const existingExecution = execList.find(
        (exec) => exec.id === executionId,
      );
      if (existingExecution) {
        return {
          ...tab,
          activeExecutionId: executionId,
        };
      }
      const newExecution = {
        id: executionId,
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      return {
        ...tab,
        executions: [newExecution, ...execList],
        activeExecutionId: executionId,
      };
    });
  }
  /**
   * Handle clearing executions for a workflow
   * Single Responsibility: Only handles clearing logic
   */
  handleClearExecutions(tabs, workflowId) {
    this.logger.debug(
      "handleClearExecutions called for workflowId:",
      workflowId,
    );
    const updated = updateTabByWorkflowId(tabs, workflowId, {
      executions: [],
      activeExecutionId: null,
    });
    this.logger.debug("Updated tabs:", updated);
    return updated;
  }
  /**
   * Handle removing a single execution
   * Single Responsibility: Only handles removal logic
   */
  handleRemoveExecution(tabs, workflowId, executionId) {
    this.logger.debug(
      "handleRemoveExecution called for workflowId:",
      workflowId,
      "executionId:",
      executionId,
    );
    const tab = tabs.find((t) => t.workflowId === workflowId);
    if (!tab) return tabs;
    const updatedExecutions = tab.executions.filter(
      (exec) => exec.id !== executionId,
    );
    const newActiveExecutionId =
      tab.activeExecutionId === executionId
        ? updatedExecutions.length > 0
          ? updatedExecutions[0].id
          : null
        : tab.activeExecutionId;
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: updatedExecutions,
      activeExecutionId: newActiveExecutionId,
    });
  }
  /**
   * Handle real-time log updates from WebSocket
   * Single Responsibility: Only handles log update logic
   */
  handleExecutionLogUpdate(tabs, workflowId, executionId, log) {
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: logicalOrToEmptyArray(
        tabs
          .find((tab) => tab.workflowId === workflowId)
          ?.executions.map((exec) =>
            exec.id === executionId
              ? { ...exec, logs: [...exec.logs, log] }
              : exec,
          ),
      ),
    });
  }
  /**
   * Handle execution status updates from WebSocket
   * Single Responsibility: Only handles status update logic
   */
  handleExecutionStatusUpdate(tabs, workflowId, executionId, status, errorMessage) {
    const normalized =
      typeof status === "string" ? status.toLowerCase().trim() : "";
    const workflowStatus =
      normalized === "canceled" ? "cancelled" : normalized;
    if (!isValidExecutionStatus(workflowStatus)) {
      return tabs;
    }
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: logicalOrToEmptyArray(
        tabs
          .find((tab) => tab.workflowId === workflowId)
          ?.executions.map((exec) => {
            if (exec.id !== executionId) {
              return exec;
            }
            let nextError = exec.error;
            if (workflowStatus === "completed") {
              nextError = undefined;
            } else if (workflowStatus === "failed") {
              nextError =
                errorMessage != null && String(errorMessage).trim() !== ""
                  ? String(errorMessage)
                  : exec.error;
            }
            return {
              ...exec,
              status: workflowStatus,
              error: nextError,
              completedAt:
                workflowStatus === "completed" || workflowStatus === "failed"
                  ? new Date()
                  : exec.completedAt,
            };
          }),
      ),
    });
  }
  /**
   * Handle node state updates from WebSocket
   * Single Responsibility: Only handles node update logic
   */
  handleExecutionNodeUpdate(tabs, workflowId, executionId, nodeId, nodeState) {
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: logicalOrToEmptyArray(
        tabs
          .find((tab) => tab.workflowId === workflowId)
          ?.executions.map((exec) =>
            exec.id === executionId
              ? {
                  ...exec,
                  nodes: {
                    ...exec.nodes,
                    [nodeId]: nodeState,
                  },
                }
              : exec,
          ),
      ),
    });
  }

  /**
   * Merge GET /executions/{id} snapshot after a terminal WebSocket update.
   * API may persist more logs than streamed live; ExecutionResponse has no node_states,
   * so we keep existing nodes unless the payload includes them.
   */
  mergeExecutionFromServer(tabs, workflowId, executionId, api) {
    const apiLogs = Array.isArray(api?.logs) ? api.logs : [];
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: logicalOrToEmptyArray(
        tabs
          .find((tab) => tab.workflowId === workflowId)
          ?.executions.map((exec) => {
            if (exec.id !== executionId) {
              return exec;
            }
            const clientLogs = exec.logs ?? [];
            const mergedLogs =
              apiLogs.length >= clientLogs.length ? apiLogs : clientLogs;

            const mappedStatus = mapApiStatusToExecutionUiStatus(api);
            const execIsTerminal =
              exec.status === "completed" ||
              exec.status === "failed" ||
              exec.status === "cancelled";
            const apiLooksStillRunning = mappedStatus === "running";
            const nextStatus =
              execIsTerminal === true && apiLooksStillRunning === true
                ? exec.status
                : mappedStatus !== null && mappedStatus !== void 0
                  ? mappedStatus
                  : exec.status;
            const apiError =
              api?.error != null && String(api.error).trim() !== ""
                ? String(api.error)
                : undefined;

            const hasApiNodes =
              api?.node_states != null &&
              typeof api.node_states === "object" &&
              Object.keys(api.node_states).length > 0;
            const nextNodes = hasApiNodes ? api.node_states : (exec.nodes ?? {});

            const hasCompletedAt =
              api?.completed_at != null && api?.completed_at !== "";
            const nextCompletedAt = hasCompletedAt
              ? new Date(api.completed_at)
              : exec.completedAt;

            return {
              ...exec,
              status: nextStatus,
              logs: mergedLogs,
              nodes: nextNodes,
              completedAt: nextCompletedAt,
              error:
                nextStatus === "completed" || nextStatus === "cancelled"
                  ? undefined
                  : nextStatus === "failed"
                    ? apiError !== undefined
                      ? apiError
                      : exec.error
                    : exec.error,
            };
          }),
      ),
    });
  }
}
export { ExecutionStateManager };
