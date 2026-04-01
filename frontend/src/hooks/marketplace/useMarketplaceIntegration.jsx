import { useEffect, useRef, useCallback } from "react";
import { logger as defaultLogger } from "../../utils/logger";
import { calculateMultipleNodePositions } from "../utils/nodePositioning";
import {
  convertAgentsToNodes
} from "../utils/agentNodeConversion";
import {
  convertToolsToNodes
} from "../utils/toolNodeConversion";
import {
  isValidPendingAgents,
  isPendingAgentsValid,
  isPendingAgentsForDifferentTab,
  isPendingAgentsTooOld
} from "../utils/pendingAgentsValidation";
import {
  PENDING_AGENTS_STORAGE_KEY,
  PENDING_TOOLS_STORAGE_KEY,
  PENDING_AGENTS
} from "../utils/marketplaceConstants";
import { MARKETPLACE_EVENTS } from "../utils/marketplaceEventConstants";
import {
  updateDraftStorage,
  resetFlagAfterDelay
} from "../utils/draftUpdateService";
import { createPendingAgentsPolling } from "../utils/pendingAgentsPolling";
import { clearPendingAgents } from "../utils/pendingAgentsStorage";
function useMarketplaceIntegration({
  tabId,
  storage,
  setNodes,
  notifyModified,
  localWorkflowId,
  localWorkflowName,
  localWorkflowDescription,
  tabIsUnsaved,
  tabDraftsRef,
  saveDraftsToStorage,
  logger: injectedLogger = defaultLogger
}) {
  const isAddingAgentsRef = useRef(false);
  const addToolsToCanvas = useCallback((toolsToAdd) => {
    injectedLogger.debug("[useMarketplaceIntegration] addToolsToCanvas called with", toolsToAdd.length, "tools");
    isAddingAgentsRef.current = true;
    const currentTabId = tabId;
    const currentWorkflowId = localWorkflowId;
    const currentWorkflowName = localWorkflowName;
    const currentWorkflowDescription = localWorkflowDescription;
    const currentTabIsUnsaved = tabIsUnsaved;
    setNodes((currentNodes) => {
      const positions = calculateMultipleNodePositions(currentNodes, toolsToAdd.length);
      const xyPositions = positions.map((p) => ({ x: p.x, y: p.y }));
      const newNodes = convertToolsToNodes(toolsToAdd, xyPositions);
      const updatedNodes = [...currentNodes, ...newNodes];
      updateDraftStorage(
        tabDraftsRef,
        currentTabId,
        updatedNodes,
        currentWorkflowId,
        currentWorkflowName,
        currentWorkflowDescription,
        currentTabIsUnsaved,
        saveDraftsToStorage,
        injectedLogger
      );
      resetFlagAfterDelay(isAddingAgentsRef, injectedLogger);
      return updatedNodes;
    });
    notifyModified();
  }, [tabId, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, setNodes, notifyModified, tabDraftsRef, saveDraftsToStorage, injectedLogger]);
  const addAgentsToCanvas = useCallback((agentsToAdd) => {
    injectedLogger.debug("[useMarketplaceIntegration] addAgentsToCanvas called with", agentsToAdd.length, "agents");
    injectedLogger.debug("[useMarketplaceIntegration] Current tabId:", tabId);
    isAddingAgentsRef.current = true;
    const currentTabId = tabId;
    const currentWorkflowId = localWorkflowId;
    const currentWorkflowName = localWorkflowName;
    const currentWorkflowDescription = localWorkflowDescription;
    const currentTabIsUnsaved = tabIsUnsaved;
    setNodes((currentNodes) => {
      injectedLogger.debug("[useMarketplaceIntegration] Current nodes before adding:", currentNodes.length);
      const positions = calculateMultipleNodePositions(currentNodes, agentsToAdd.length);
      const xyPositions = positions.map((p) => ({ x: p.x, y: p.y }));
      const newNodes = convertAgentsToNodes(agentsToAdd, xyPositions);
      const updatedNodes = [...currentNodes, ...newNodes];
      injectedLogger.debug("[useMarketplaceIntegration] Total nodes after adding:", updatedNodes.length);
      updateDraftStorage(
        tabDraftsRef,
        currentTabId,
        updatedNodes,
        currentWorkflowId,
        currentWorkflowName,
        currentWorkflowDescription,
        currentTabIsUnsaved,
        saveDraftsToStorage,
        injectedLogger
      );
      resetFlagAfterDelay(isAddingAgentsRef, injectedLogger);
      return updatedNodes;
    });
    notifyModified();
  }, [tabId, localWorkflowId, localWorkflowName, localWorkflowDescription, tabIsUnsaved, setNodes, notifyModified, tabDraftsRef, saveDraftsToStorage, injectedLogger]);
  useEffect(() => {
    const handleAddAgentsToWorkflow = (event) => {
      const { agents: agentsToAdd, tabId: targetTabId } = event.detail;
      injectedLogger.debug(`[useMarketplaceIntegration] Received ${MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW} event:`, {
        targetTabId,
        currentTabId: tabId,
        agentCount: agentsToAdd.length
      });
      const isDifferentTab = targetTabId !== tabId;
      if (isDifferentTab === true) {
        injectedLogger.debug("[useMarketplaceIntegration] Event for different tab, ignoring");
        return;
      }
      injectedLogger.debug("[useMarketplaceIntegration] Adding agents via event");
      addAgentsToCanvas(agentsToAdd);
    };
    const handleAddToolsToWorkflow = (event) => {
      const { tools: toolsToAdd, tabId: targetTabId } = event.detail;
      if (targetTabId !== tabId) return;
      addToolsToCanvas(toolsToAdd);
    };
    const checkPendingTools = () => {
      if (!storage) return;
      try {
        const pendingData = storage.getItem(PENDING_TOOLS_STORAGE_KEY);
        if (pendingData) {
          const parsed = JSON.parse(pendingData);
          if (parsed?.tabId === tabId && Array.isArray(parsed?.tools) && parsed.tools.length > 0) {
            const age = Date.now() - (parsed.timestamp || 0);
            if (age < PENDING_AGENTS.MAX_AGE) {
              addToolsToCanvas(parsed.tools);
              storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
            } else {
              storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
            }
          }
        }
      } catch (e) {
        injectedLogger.error("Failed to process pending tools:", e);
        storage.removeItem(PENDING_TOOLS_STORAGE_KEY);
      }
    };
    const checkPendingAgents = () => {
      const hasStorage = storage !== null && storage !== void 0;
      if (hasStorage === false) return;
      try {
        const pendingData = storage.getItem(PENDING_AGENTS_STORAGE_KEY);
        const hasPendingData = pendingData !== null && pendingData !== void 0 && pendingData !== "";
        if (hasPendingData === true) {
          const parsed = JSON.parse(pendingData);
          const isValid = isValidPendingAgents(parsed) === true;
          if (isValid === false) {
            injectedLogger.debug("[useMarketplaceIntegration] Invalid pending agents data, clearing");
            clearPendingAgents(storage);
            return;
          }
          const pending = parsed;
          injectedLogger.debug("[useMarketplaceIntegration] Found pending agents:", {
            pendingTabId: pending.tabId,
            currentTabId: tabId,
            age: Date.now() - pending.timestamp
          });
          const isPendingValid = isPendingAgentsValid(pending, tabId, PENDING_AGENTS.MAX_AGE) === true;
          if (isPendingValid === true) {
            injectedLogger.debug("[useMarketplaceIntegration] Adding agents to canvas:", pending.agents.length);
            addAgentsToCanvas(pending.agents);
            clearPendingAgents(storage);
          } else {
            const isDifferentTab = isPendingAgentsForDifferentTab(pending, tabId) === true;
            const isTooOld = isPendingAgentsTooOld(pending, PENDING_AGENTS.MAX_AGE) === true;
            if (isDifferentTab === true) {
              injectedLogger.debug("[useMarketplaceIntegration] Pending agents for different tab, clearing");
              clearPendingAgents(storage);
            } else if (isTooOld === true) {
              injectedLogger.debug("[useMarketplaceIntegration] Pending agents too old, clearing");
              clearPendingAgents(storage);
            }
          }
        }
      } catch (e) {
        injectedLogger.error("Failed to process pending agents:", e);
        const hasStorage2 = storage !== null && storage !== void 0;
        if (hasStorage2 === true) {
          clearPendingAgents(storage);
        }
      }
    };
    checkPendingAgents();
    checkPendingTools();
    const isBrowser = typeof window !== "undefined";
    if (isBrowser === true) {
      window.addEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow);
      window.addEventListener(MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW, handleAddToolsToWorkflow);
    }
    const { cleanup: cleanupPolling } = createPendingAgentsPolling(
      () => {
        checkPendingAgents();
        checkPendingTools();
      },
      injectedLogger
    );
    return () => {
      if (isBrowser === true) {
        window.removeEventListener(MARKETPLACE_EVENTS.ADD_AGENTS_TO_WORKFLOW, handleAddAgentsToWorkflow);
        window.removeEventListener(MARKETPLACE_EVENTS.ADD_TOOLS_TO_WORKFLOW, handleAddToolsToWorkflow);
      }
      cleanupPolling();
    };
  }, [tabId, storage, addAgentsToCanvas, addToolsToCanvas, injectedLogger]);
  return {
    isAddingAgentsRef,
    addAgentsToCanvas
  };
}
export {
  useMarketplaceIntegration
};
