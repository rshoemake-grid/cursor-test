import { useCallback } from "react";
import { api as defaultApi } from "../../api/client";
import {
  showSuccess as defaultShowSuccess,
  showError as defaultShowError,
} from "../../utils/notifications";
import { logger as defaultLogger } from "../../utils/logger";
import { createWorkflowDefinition } from "../../utils/workflowFormat";
import { nullishCoalesce } from "../utils/nullishCoalescing";
import { logicalOr } from "../utils/logicalOr";
import {
  extractApiErrorMessage,
  isUnauthorizedApiError,
} from "../utils/apiUtils";
function useWorkflowPersistence({
  isAuthenticated,
  localWorkflowId,
  localWorkflowName,
  localWorkflowDescription,
  nodes,
  edges,
  variables,
  setLocalWorkflowId,
  onWorkflowSaved,
  isSaving,
  setIsSaving,
  api = defaultApi,
  showSuccess = defaultShowSuccess,
  showError = defaultShowError,
  logger = defaultLogger,
}) {
  const saveWorkflow = useCallback(async () => {
    if (!isAuthenticated) {
      showError("Please log in to save workflows.");
      return null;
    }
    if (isSaving) {
      return nullishCoalesce(localWorkflowId, null);
    }
    const workflowDef = createWorkflowDefinition({
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes,
      edges,
      variables,
    });
    setIsSaving(true);
    try {
      if (localWorkflowId) {
        await api.updateWorkflow(localWorkflowId, workflowDef);
        showSuccess("Workflow updated successfully!");
        if (onWorkflowSaved) {
          onWorkflowSaved(localWorkflowId, workflowDef.name);
        }
        return localWorkflowId;
      } else {
        const created = await api.createWorkflow(workflowDef);
        setLocalWorkflowId(created.id);
        showSuccess("Workflow created successfully!");
        if (onWorkflowSaved) {
          onWorkflowSaved(created.id, workflowDef.name);
        }
        return created.id;
      }
    } catch (error) {
      const detail = extractApiErrorMessage(error, "Unknown error");
      const message = isUnauthorizedApiError(error)
        ? "Your session has expired. Please log in again to save your work."
        : "Failed to save workflow: " + detail;
      showError(message);
      logger.error("Failed to save workflow:", error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [
    isAuthenticated,
    isSaving,
    localWorkflowId,
    localWorkflowName,
    localWorkflowDescription,
    nodes,
    edges,
    variables,
    setLocalWorkflowId,
    onWorkflowSaved,
    setIsSaving,
    api,
    showSuccess,
    showError,
    logger,
  ]);
  const exportWorkflow = useCallback(() => {
    const workflowDef = createWorkflowDefinition({
      name: localWorkflowName,
      description: localWorkflowDescription,
      nodes,
      edges,
      variables,
    });
    const workflowName = (localWorkflowName || "").trim();
    const filename = (
      logicalOr(workflowName, "workflow") || "workflow"
    ).replace(/\s+/g, "-");
    const blob = new Blob([JSON.stringify(workflowDef, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [localWorkflowName, localWorkflowDescription, nodes, edges, variables]);
  return {
    saveWorkflow,
    exportWorkflow,
  };
}
export { useWorkflowPersistence };
