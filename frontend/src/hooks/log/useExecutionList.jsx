import { useState, useEffect, useCallback } from "react";
import { logger } from "../../utils/logger";
import { extractApiErrorMessage } from "../utils/apiUtils";
function useExecutionList(options = {}) {
  const { apiClient, pollInterval = 5e3, limit = 100, filters } = options;
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadExecutions = useCallback(async () => {
    if (!apiClient) {
      setError("API client not provided");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const params = {
        limit,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.workflow_id && { workflow_id: filters.workflow_id }),
        ...(filters?.offset && { offset: filters.offset }),
      };
      const data = await apiClient.listExecutions(params);
      setExecutions(data);
    } catch (err) {
      logger.error("Failed to load executions:", err);
      setError(extractApiErrorMessage(err, "Failed to load executions"));
    } finally {
      setLoading(false);
    }
  }, [apiClient, limit, filters]);
  useEffect(() => {
    loadExecutions();
    if (pollInterval > 0) {
      const interval = setInterval(() => {
        loadExecutions();
      }, pollInterval);
      return () => clearInterval(interval);
    }
  }, [loadExecutions, pollInterval]);
  return {
    executions,
    loading,
    error,
    refresh: loadExecutions,
  };
}
export { useExecutionList };
