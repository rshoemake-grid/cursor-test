import { useCallback } from "react";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
import { applyFilters, sortItems } from "./useMarketplaceData.utils";
function useToolsData({
  storage,
  category,
  searchQuery,
  sortBy
}) {
  const fetchTools = useCallback(async () => {
    const toolsData = getLocalStorageItem(STORAGE_KEYS.PUBLISHED_TOOLS, []);
    const filtered = applyFilters(toolsData, category, searchQuery);
    return sortItems(filtered, sortBy, true);
  }, [category, searchQuery, sortBy, storage]);
  return {
    fetchTools
  };
}
export {
  useToolsData
};
