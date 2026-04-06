import { useEffect } from "react";
import { logger } from "../../utils/logger";
import { setLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
import {
  logicalOr,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray,
} from "../utils/logicalOr";
function useOfficialAgentSeeding({
  storage,
  httpClient,
  apiBaseUrl,
  onAgentsSeeded,
}) {
  useEffect(() => {
    const seedOfficialAgents = async () => {
      if (storage === null || storage === void 0) return;
      const seededKey = STORAGE_KEYS.OFFICIAL_AGENTS_SEEDED;
      try {
        storage.removeItem(seededKey);
      } catch (error) {
        logger.error("Failed to remove seeded key:", error);
      }
      let seeded = false;
      try {
        seeded = !!storage.getItem(seededKey);
      } catch (error) {
        logger.error("Failed to check seeded key:", error);
      }
      if (seeded) {
        return;
      }
      try {
        const response = await httpClient.get(
          `${apiBaseUrl}/templates?sort_by=popular`,
        );
        if (response.ok !== true) {
          logger.error(
            "[Marketplace] Failed to fetch templates:",
            response.statusText,
          );
          return;
        }
        const workflows = await response.json();
        const officialWorkflows = workflows.filter((w) => w.is_official);
        if (officialWorkflows.length === 0) {
          setLocalStorageItem(seededKey, "true");
          return;
        }
        const agentsToAdd = [];
        for (const workflow of officialWorkflows) {
          try {
            const workflowResponse = await httpClient.post(
              `${apiBaseUrl}/templates/${workflow.id}/use`,
              {},
              { "Content-Type": "application/json" },
            );
            if (workflowResponse.ok !== true) {
              logger.error(
                `[Marketplace] Failed to fetch workflow ${workflow.id}: ${workflowResponse.statusText}`,
              );
              continue;
            }
            const workflowDetail = await workflowResponse.json();
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const agentNodes = workflowDetail.nodes.filter((node) => {
                const nodeType = logicalOr(node.type, node.data?.type);
                const hasAgentConfig = logicalOr(
                  node.agent_config,
                  node.data?.agent_config,
                );
                const isAgent = nodeType === "agent" && hasAgentConfig;
                return isAgent;
              });
              for (const agentNode of agentNodes) {
                const nodeId = logicalOr(
                  agentNode.id,
                  logicalOr(agentNode.data?.id, `node_${Date.now()}`),
                );
                const agentId = `official_${workflow.id}_${nodeId}`;
                if (storage === null || storage === void 0) continue;
                const existingAgents = storage.getItem(
                  STORAGE_KEYS.PUBLISHED_AGENTS,
                );
                const agents = existingAgents
                  ? JSON.parse(existingAgents)
                  : logicalOrToEmptyArray([]);
                if (agents.some((a) => a.id === agentId)) {
                  continue;
                }
                const agentConfig = logicalOrToEmptyObject(
                  logicalOr(
                    agentNode.agent_config,
                    agentNode.data?.agent_config,
                  ),
                );
                const nodeName = logicalOr(
                  agentNode.name,
                  logicalOr(
                    agentNode.data?.name,
                    logicalOr(agentNode.data?.label, "Agent"),
                  ),
                );
                const nodeDescription = logicalOr(
                  agentNode.description,
                  logicalOr(
                    agentNode.data?.description,
                    `Agent from ${workflow.name}`,
                  ),
                );
                agentsToAdd.push({
                  id: agentId,
                  name: nodeName,
                  label: nodeName,
                  description: nodeDescription,
                  category: (() => {
                    const cat = logicalOr(workflow.category, "automation");
                    return cat !== null &&
                      cat !== void 0 &&
                      typeof cat === "string"
                      ? cat
                      : "automation";
                  })(),
                  tags: [
                    ...logicalOrToEmptyArray(workflow.tags),
                    "official",
                    (workflow.name || "").toLowerCase().replace(/\s+/g, "-"),
                  ],
                  difficulty: (() => {
                    const diff = logicalOr(workflow.difficulty, "intermediate");
                    return diff !== null &&
                      diff !== void 0 &&
                      typeof diff === "string"
                      ? diff
                      : "intermediate";
                  })(),
                  estimated_time: (() => {
                    const est = logicalOr(workflow.estimated_time, "5 min");
                    return est !== null &&
                      est !== void 0 &&
                      typeof est === "string"
                      ? est
                      : "5 min";
                  })(),
                  agent_config: agentConfig,
                  published_at: logicalOr(
                    workflow.created_at,
                    new Date().toISOString(),
                  ),
                  author_id: logicalOr(workflow.author_id, null),
                  author_name: logicalOr(workflow.author_name, "System"),
                  is_official: true,
                });
              }
            }
          } catch (error) {
            logger.error(
              `[Marketplace] Failed to fetch workflow ${workflow.id}:`,
              error,
            );
          }
        }
        if (agentsToAdd.length > 0 && storage !== null && storage !== void 0) {
          const existingAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS);
          const agents = existingAgents
            ? JSON.parse(existingAgents)
            : logicalOrToEmptyArray([]);
          agents.push(...agentsToAdd);
          storage.setItem(
            STORAGE_KEYS.PUBLISHED_AGENTS,
            JSON.stringify(agents),
          );
          if (onAgentsSeeded !== null && onAgentsSeeded !== void 0) {
            onAgentsSeeded();
          }
        }
        setLocalStorageItem(seededKey, "true");
      } catch (error) {
        logger.error("[Marketplace] Failed to seed official agents:", error);
      }
    };
    seedOfficialAgents();
  }, [storage, httpClient, apiBaseUrl]);
}
export { useOfficialAgentSeeding };
