import { useCallback } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { nullishCoalesce } from "../utils/nullishCoalescing";
function useWorkflowAPI(options) {
  const { apiClient = api, logger: injectedLogger = logger } = nullishCoalesce(
    options,
    {},
  );
  const getWorkflows = useCallback(async () => {
    try {
      return await apiClient.getWorkflows();
    } catch (error) {
      injectedLogger.error("Failed to fetch workflows:", error);
      throw error;
    }
  }, [apiClient, injectedLogger]);
  const getWorkflow = useCallback(
    async (id) => {
      try {
        return await apiClient.getWorkflow(id);
      } catch (error) {
        injectedLogger.error(`Failed to fetch workflow ${id}:`, error);
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  const createWorkflow = useCallback(
    async (workflow) => {
      try {
        return await apiClient.createWorkflow(workflow);
      } catch (error) {
        injectedLogger.error("Failed to create workflow:", error);
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  const updateWorkflow = useCallback(
    async (id, workflow) => {
      try {
        return await apiClient.updateWorkflow(id, workflow);
      } catch (error) {
        injectedLogger.error(`Failed to update workflow ${id}:`, error);
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  const deleteWorkflow = useCallback(
    async (id) => {
      try {
        await apiClient.deleteWorkflow(id);
      } catch (error) {
        injectedLogger.error(`Failed to delete workflow ${id}:`, error);
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  const executeWorkflow = useCallback(
    async (workflowId, inputs) => {
      try {
        return await apiClient.executeWorkflow(workflowId, inputs);
      } catch (error) {
        injectedLogger.error(
          `Failed to execute workflow ${workflowId}:`,
          error,
        );
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  const getExecution = useCallback(
    async (executionId) => {
      try {
        return await apiClient.getExecution(executionId);
      } catch (error) {
        injectedLogger.error(
          `Failed to fetch execution ${executionId}:`,
          error,
        );
        throw error;
      }
    },
    [apiClient, injectedLogger],
  );
  return {
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getExecution,
  };
}
export { useWorkflowAPI };
