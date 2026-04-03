import { useCallback } from "react";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
import { applyFilters, sortItems } from "./useMarketplaceData.utils";
import {
  canMigrateUserData,
  getUserDisplayName,
} from "../utils/userValidation";
import { canSaveToStorage } from "../utils/storageValidation";
function normalizeAgent(agent) {
  return {
    id: String(agent.id ?? ""),
    name: String(agent.name ?? ""),
    label: String(agent.name ?? agent.label ?? ""),
    description: String(agent.description ?? ""),
    category: String(agent.category ?? ""),
    tags: Array.isArray(agent.tags) ? agent.tags.map(String) : [],
    difficulty: String(agent.difficulty ?? "beginner"),
    estimated_time: String(agent.estimated_time ?? ""),
    agent_config: agent.agent_config ?? {},
    published_at:
      agent.published_at != null ? String(agent.published_at) : void 0,
    author_id: agent.author_id != null ? String(agent.author_id) : null,
    author_name: agent.author_name != null ? String(agent.author_name) : null,
    is_official: Boolean(agent.is_official),
  };
}
function useAgentsData({
  storage,
  httpClient,
  apiBaseUrl,
  category,
  searchQuery,
  sortBy,
  user,
}) {
  const fetchAgents = useCallback(async () => {
    try {
      const base = apiBaseUrl.replace(/\/$/, "");
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (searchQuery) params.set("search", searchQuery);
      const qs = params.toString();
      const url = `${base}/marketplace/agents${qs ? `?${qs}` : ""}`;
      const response = await httpClient.get(url);
      const data = await response.json();
      const raw = Array.isArray(data)
        ? data
        : (data?.items ?? data?.data ?? []);
      const agentsData2 = raw.map((a) => normalizeAgent(a));
      return applyFilters(
        sortItems(agentsData2, sortBy, true),
        category,
        searchQuery,
      );
    } catch {}
    let agentsData = getLocalStorageItem(STORAGE_KEYS.PUBLISHED_AGENTS, []);
    if (canMigrateUserData(user, agentsData)) {
      let updated = false;
      agentsData = agentsData.map((agent) => {
        if (!agent.author_id) {
          updated = true;
          return {
            ...agent,
            author_id: user.id,
            author_name: getUserDisplayName(user),
          };
        }
        return agent;
      });
      if (canSaveToStorage(storage, updated)) {
        storage.setItem(
          STORAGE_KEYS.PUBLISHED_AGENTS,
          JSON.stringify(agentsData),
        );
      }
    }
    agentsData = applyFilters(agentsData, category, searchQuery);
    agentsData = sortItems(agentsData, sortBy, true);
    return agentsData;
  }, [
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
    user?.id,
    user?.username,
    user?.email,
    storage,
  ]);
  return {
    fetchAgents,
  };
}
export { useAgentsData };
