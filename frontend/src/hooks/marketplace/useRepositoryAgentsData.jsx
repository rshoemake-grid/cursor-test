import { useCallback } from "react";
import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../config/constants";
import { applyFilters, sortItems } from "./useMarketplaceData.utils";
import { isStorageAvailable } from "../utils/storageValidation";
function useRepositoryAgentsData({
  storage,
  category,
  searchQuery,
  sortBy
}) {
  const fetchRepositoryAgents = useCallback(async () => {
    if (!isStorageAvailable(storage)) {
      return [];
    }
    let agentsData = [];
    try {
      const savedAgents = storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS);
      agentsData = savedAgents ? JSON.parse(savedAgents) : [];
    } catch (error) {
      logger.error("Failed to load repository agents from storage:", error);
      agentsData = [];
    }
    agentsData = applyFilters(agentsData, category, searchQuery);
    agentsData = sortItems(agentsData, sortBy);
    return agentsData;
  }, [storage, category, searchQuery, sortBy]);
  return {
    fetchRepositoryAgents
  };
}
export {
  useRepositoryAgentsData
};
