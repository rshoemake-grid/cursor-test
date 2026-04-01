import { useState, useCallback, useRef } from "react";
import { showSuccess as defaultShowSuccess, showError as defaultShowError } from "../../utils/notifications";
import { showConfirm as defaultShowConfirm } from "../../utils/confirm";
import { api as defaultApi } from "../../api/client";
import { logger as defaultLogger } from "../../utils/logger";
import { WorkflowExecutionService } from "../utils/workflowExecutionService";
import {
  isUserAuthenticated,
  hasWorkflowId,
  isConfirmed,
  isWorkflowSaved,
  canExecuteWorkflow
} from "../utils/workflowExecutionValidation";
import { extractApiErrorMessage } from "../utils/apiUtils";
function useWorkflowExecution({
  isAuthenticated,
  localWorkflowId,
  workflowIdRef,
  saveWorkflow,
  onExecutionStart,
  showSuccess = defaultShowSuccess,
  showError = defaultShowError,
  showConfirm = defaultShowConfirm,
  api = defaultApi,
  logger = defaultLogger
}) {
  const [showInputs, setShowInputs] = useState(false);
  const [executionInputs, setExecutionInputsState] = useState("{}");
  const executionInputsRef = useRef("{}");
  const setExecutionInputs = useCallback((value) => {
    const next =
      typeof value === "function" ? value(executionInputsRef.current) : value;
    executionInputsRef.current = next;
    setExecutionInputsState(next);
  }, []);
  const [isExecuting, setIsExecuting] = useState(false);
  const executeWorkflow = useCallback(async () => {
    logger.debug("[WorkflowBuilder] executeWorkflow called");
    logger.debug("[WorkflowBuilder] isAuthenticated:", isAuthenticated);
    logger.debug("[WorkflowBuilder] localWorkflowId:", localWorkflowId);
    if (!isUserAuthenticated(isAuthenticated)) {
      logger.error("[WorkflowBuilder] User not authenticated");
      showError("Please log in to execute workflows.");
      return;
    }
    let currentWorkflowId = localWorkflowId;
    logger.debug("[WorkflowBuilder] Current workflow ID:", currentWorkflowId);
    if (!hasWorkflowId(currentWorkflowId)) {
      logger.debug("[WorkflowBuilder] No workflow ID, prompting to save");
      const confirmed = await showConfirm(
        "Workflow needs to be saved before execution. Save now?",
        { title: "Save Workflow", confirmText: "Save", cancelText: "Cancel" }
      );
      if (!isConfirmed(confirmed)) {
        return;
      }
      try {
        const savedId = await saveWorkflow();
        if (!isWorkflowSaved(savedId)) {
          showError("Failed to save workflow. Cannot execute.");
          return;
        }
        currentWorkflowId = savedId;
      } catch (error) {
        showError("Failed to save workflow. Cannot execute.");
        return;
      }
    }
    logger.debug("[WorkflowBuilder] Setting execution inputs and showing dialog");
    setShowInputs(true);
  }, [isAuthenticated, localWorkflowId, saveWorkflow]);
  const handleConfirmExecute = useCallback(async () => {
    logger.debug("[WorkflowBuilder] handleConfirmExecute called");
    logger.debug("[WorkflowBuilder] executionInputs:", executionInputs);
    logger.debug("[WorkflowBuilder] workflowIdRef.current:", workflowIdRef.current);
    setIsExecuting(true);
    try {
      const executionService = new WorkflowExecutionService({
        api,
        logger
      });
      const inputs = executionService.parseExecutionInputs(
        executionInputsRef.current
      );
      logger.debug("[WorkflowBuilder] Parsed inputs:", inputs);
      setShowInputs(false);
      setExecutionInputs("{}");
      const tempExecutionId = executionService.createTempExecutionId();
      logger.debug("[WorkflowBuilder] Created temp execution ID:", tempExecutionId);
      showSuccess("\u2705 Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.", 6e3);
      const workflowIdToExecute = workflowIdRef.current;
      logger.debug("[WorkflowBuilder] Workflow ID to execute:", workflowIdToExecute);
      if (!canExecuteWorkflow(workflowIdToExecute)) {
        logger.error("[WorkflowBuilder] No workflow ID found - workflow must be saved");
        showError("Workflow must be saved before executing.");
        return;
      }
      logger.debug("[WorkflowBuilder] Calling execution service");
      if (!workflowIdToExecute) {
        throw new Error("Workflow ID is required for execution");
      }
      await executionService.executeWorkflow({
        workflowId: workflowIdToExecute,
        inputs,
        tempExecutionId,
        onExecutionStart
      });
    } catch (error) {
      logger.error("[WorkflowBuilder] Execution failed:", error);
      const errorMessage = extractApiErrorMessage(error, "Unknown error");
      showError(`Failed to execute workflow: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [executionInputs, workflowIdRef, onExecutionStart, api, logger, showSuccess, showError]);
  return {
    showInputs,
    setShowInputs,
    executionInputs,
    setExecutionInputs,
    isExecuting,
    executeWorkflow,
    handleConfirmExecute
  };
}
export {
  useWorkflowExecution
};
