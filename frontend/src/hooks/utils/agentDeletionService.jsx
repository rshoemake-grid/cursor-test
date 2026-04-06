import { isStorageAvailable, setStorageItem } from "./storageValidation";
import { hasArrayItems } from "./arrayValidation";
import { extractApiErrorMessage } from "./apiUtils";
import {
  safeShowError,
  safeShowSuccess,
  safeOnComplete,
} from "./safeCallbacks";
function deleteAgentsFromStorage(
  storage,
  storageKey,
  agentIdsToDelete,
  callbacks,
) {
  if (!isStorageAvailable(storage)) {
    const error = "Storage not available";
    safeShowError(callbacks, error);
    return { success: false, error, deletedCount: 0 };
  }
  try {
    const storedAgentsJson = storage.getItem(storageKey);
    if (!storedAgentsJson) {
      const error = "No agents found in storage";
      safeShowError(callbacks, error);
      return { success: false, error, deletedCount: 0 };
    }
    const allAgents = JSON.parse(storedAgentsJson);
    const remainingAgents = allAgents.filter(
      (a) => !agentIdsToDelete.has(a.id),
    );
    const deletedCount = allAgents.length - remainingAgents.length;
    if (setStorageItem(storage, storageKey, remainingAgents)) {
      safeShowSuccess(
        callbacks,
        `Successfully deleted ${deletedCount} agent(s)`,
      );
      safeOnComplete(callbacks);
      return { success: true, deletedCount };
    } else {
      const error = "Failed to save to storage";
      safeShowError(callbacks, error);
      return { success: false, error, deletedCount: 0 };
    }
  } catch (error) {
    const errorMessage = extractApiErrorMessage(error, "Unknown error");
    const hasCallbacks = callbacks !== null && callbacks !== void 0;
    const hasErrorPrefix =
      hasCallbacks === true &&
      callbacks.errorPrefix !== null &&
      callbacks.errorPrefix !== void 0;
    const itemType = hasErrorPrefix === true ? callbacks.errorPrefix : "agents";
    const fullError = `Failed to delete ${itemType}: ${errorMessage}`;
    safeShowError(callbacks, fullError);
    return { success: false, error: fullError, deletedCount: 0 };
  }
}
function extractAgentIds(agents) {
  if (!hasArrayItems(agents)) {
    return new Set();
  }
  return new Set(
    agents
      .map((a) => (a && a.id ? a.id : null))
      .filter((id) => id !== null && id !== void 0),
  );
}
function updateStateAfterDeletion(agentIdsToDelete, setAgents, setSelectedIds) {
  setAgents((prevAgents) =>
    prevAgents.filter((a) => !agentIdsToDelete.has(a.id)),
  );
  setSelectedIds(new Set());
}
export { deleteAgentsFromStorage, extractAgentIds, updateStateAfterDeletion };
