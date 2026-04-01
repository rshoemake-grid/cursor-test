import { useQuery } from "@tanstack/react-query";
import { logger } from "../../utils/logger";
function useExecutionListQuery({
  apiClient,
  filters,
  enabled = true,
  refetchInterval = 5e3
} = {}) {
  return useQuery({
    queryKey: ["executions", filters],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error("API client not provided");
      }
      const params = {
        limit: filters?.limit || 100,
        ...filters?.status && { status: filters.status },
        ...filters?.workflow_id && { workflow_id: filters.workflow_id },
        ...filters?.offset && { offset: filters.offset }
      };
      try {
        const data = await apiClient.listExecutions(params);
        return data;
      } catch (err) {
        logger.error("Failed to load executions:", err);
        throw err;
      }
    },
    enabled: enabled && !!apiClient,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    staleTime: 3 * 1e3
    // 3 seconds - data is fresh for 3 seconds
  });
}
export {
  useExecutionListQuery
};
