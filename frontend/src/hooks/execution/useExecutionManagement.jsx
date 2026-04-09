import { useCallback, useMemo } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { useExecutionPolling } from "../utils/useExecutionPolling";
import { ExecutionStateManager } from "../utils/executionStateManager";
import { isRealExecutionId } from "../utils/executionIdValidation";

const TERMINAL_EXECUTION_REFRESH_MS = 400;
function useExecutionManagement({
  tabs,
  activeTabId,
  setTabs,
  tabsRef,
  onExecutionStart,
  apiClient = api,
  logger: injectedLogger = logger,
}) {
  const stateManager = useMemo(
    () => new ExecutionStateManager({ logger: injectedLogger }),
    [injectedLogger],
  );
  const handleExecutionStart = useCallback(
    (executionId) => {
      const updatedTabs = stateManager.handleExecutionStart(
        tabs,
        activeTabId,
        executionId,
      );
      if (updatedTabs !== tabs) {
        setTabs(updatedTabs);
        if (onExecutionStart) {
          onExecutionStart(executionId);
        }
      }
    },
    [tabs, activeTabId, setTabs, onExecutionStart, stateManager],
  );
  const handleClearExecutions = useCallback(
    (workflowId) => {
      setTabs((prev) => stateManager.handleClearExecutions(prev, workflowId));
    },
    [setTabs, stateManager],
  );
  const handleRemoveExecution = useCallback(
    (workflowId, executionId) => {
      setTabs((prev) =>
        stateManager.handleRemoveExecution(prev, workflowId, executionId),
      );
    },
    [setTabs, stateManager],
  );
  const handleExecutionLogUpdate = useCallback(
    (workflowId, executionId, log) => {
      setTabs((prev) =>
        stateManager.handleExecutionLogUpdate(
          prev,
          workflowId,
          executionId,
          log,
        ),
      );
    },
    [setTabs, stateManager],
  );
  const handleExecutionStatusUpdate = useCallback(
    (workflowId, executionId, status, errorMessage) => {
      setTabs((prev) =>
        stateManager.handleExecutionStatusUpdate(
          prev,
          workflowId,
          executionId,
          status,
          errorMessage,
        ),
      );
      if (
        (status === "failed" || status === "completed") &&
        isRealExecutionId(executionId)
      ) {
        void (async () => {
          try {
            await new Promise((r) =>
              setTimeout(r, TERMINAL_EXECUTION_REFRESH_MS),
            );
            const snapshot = await apiClient.getExecution(executionId);
            setTabs((prev) =>
              stateManager.mergeExecutionFromServer(
                prev,
                workflowId,
                executionId,
                snapshot,
              ),
            );
          } catch (err) {
            injectedLogger.debug(
              "[Execution] Could not refresh execution from API:",
              err?.message ?? err,
            );
          }
        })();
      }
    },
    [setTabs, stateManager, apiClient, injectedLogger],
  );
  const handleExecutionNodeUpdate = useCallback(
    (workflowId, executionId, nodeId, nodeState) => {
      setTabs((prev) =>
        stateManager.handleExecutionNodeUpdate(
          prev,
          workflowId,
          executionId,
          nodeId,
          nodeState,
        ),
      );
    },
    [setTabs, stateManager],
  );
  useExecutionPolling({
    tabsRef,
    setTabs,
    apiClient,
    logger: injectedLogger,
    pollInterval: 2e3,
    // Poll every 2 seconds
  });
  return {
    handleExecutionStart,
    handleClearExecutions,
    handleRemoveExecution,
    handleExecutionLogUpdate,
    handleExecutionStatusUpdate,
    handleExecutionNodeUpdate,
  };
}
export { useExecutionManagement };
