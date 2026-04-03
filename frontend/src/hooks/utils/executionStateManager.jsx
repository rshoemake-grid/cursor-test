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
      if (isRealExecutionId(executionId)) {
        const pendingExecutions = tab.executions
          .map((exec, idx) => ({ exec, idx }))
          .filter(
            ({ exec }) => exec && exec.id && isPendingExecutionId(exec.id),
          );
        if (pendingExecutions.length > 0) {
          const oldestPending = pendingExecutions[pendingExecutions.length - 1];
          return {
            ...tab,
            executions: tab.executions.map((exec, idx) =>
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
      const existingExecution = tab.executions.find(
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
        startedAt: /* @__PURE__ */ new Date(),
        nodes: {},
        logs: [],
      };
      return {
        ...tab,
        executions: [newExecution, ...tab.executions],
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
  handleExecutionStatusUpdate(tabs, workflowId, executionId, status) {
    return updateTabByWorkflowId(tabs, workflowId, {
      executions: logicalOrToEmptyArray(
        tabs
          .find((tab) => tab.workflowId === workflowId)
          ?.executions.map((exec) =>
            exec.id === executionId
              ? {
                  ...exec,
                  status,
                  completedAt:
                    status === "completed" || status === "failed"
                      ? /* @__PURE__ */ new Date()
                      : exec.completedAt,
                }
              : exec,
          ),
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
}
export { ExecutionStateManager };
