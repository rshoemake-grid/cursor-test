import { useCallback } from "react";
import {
  showError as defaultShowError,
  showSuccess as defaultShowSuccess,
} from "../../utils/notifications";
import { showConfirm as defaultShowConfirm } from "../../utils/confirm";
import { logger as defaultLogger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../config/constants";
import {
  filterUserOwnedDeletableItems,
  separateOfficialItems,
} from "../../utils/ownershipUtils";
import { isEmptySelection } from "../../utils/validationUtils";
import {
  deleteAgentsFromStorage,
  extractAgentIds,
  updateStateAfterDeletion,
} from "../utils/agentDeletionService";
import {
  hasOfficialItems,
  hasNoUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
  getItemsWithAuthorIdCount,
} from "../utils/deletionValidation";
function useAgentDeletion({
  user,
  storage,
  agents,
  setAgents,
  setSelectedAgentIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
  logger = defaultLogger,
}) {
  const deleteSelectedAgents = useCallback(
    async (selectedAgentIds) => {
      if (isEmptySelection(selectedAgentIds)) return;
      const selectedAgents = agents.filter((a) => selectedAgentIds.has(a.id));
      const { official: officialAgents, deletable: deletableAgents } =
        separateOfficialItems(selectedAgents);
      if (hasOfficialItems(officialAgents)) {
        showError(
          `Cannot delete ${officialAgents.length} official agent(s). Official agents cannot be deleted.`,
        );
        if (deletableAgents.length === 0) {
          return;
        }
      }
      const userOwnedAgents = filterUserOwnedDeletableItems(
        deletableAgents,
        user,
      );
      if (hasNoUserOwnedItems(userOwnedAgents)) {
        const agentsWithAuthorIdCount =
          getItemsWithAuthorIdCount(deletableAgents);
        if (agentsWithAuthorIdCount === 0) {
          if (hasOfficialItems(officialAgents)) {
            showError(
              "Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.",
            );
          } else {
            showError(
              "Selected agents were published before author tracking was added. Please republish them to enable deletion.",
            );
          }
        } else {
          if (hasOfficialItems(officialAgents)) {
            showError(
              `You can only delete agents that you published (official agents cannot be deleted). ${deletableAgents.length} selected, ${agentsWithAuthorIdCount} have author info, but none match your user ID.`,
            );
          } else {
            showError(
              `You can only delete agents that you published. ${deletableAgents.length} selected, ${agentsWithAuthorIdCount} have author info, but none match your user ID.`,
            );
          }
        }
        return;
      }
      if (ownsPartialItems(userOwnedAgents.length, deletableAgents.length)) {
        const confirmed = await showConfirm(
          `You can only delete ${userOwnedAgents.length} of ${deletableAgents.length} selected agent(s). Delete only the ones you own?`,
          {
            title: "Partial Delete",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "warning",
          },
        );
        if (!confirmed) return;
      } else if (ownsAllItems(userOwnedAgents.length, deletableAgents.length)) {
        const confirmed = await showConfirm(
          `Are you sure you want to delete ${userOwnedAgents.length} selected agent(s) from the marketplace?`,
          {
            title: "Delete Agents",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger",
          },
        );
        if (!confirmed) return;
      }
      const agentIdsToDelete = extractAgentIds(userOwnedAgents);
      if (agentIdsToDelete.size === 0) {
        return;
      }
      const result = deleteAgentsFromStorage(
        storage,
        STORAGE_KEYS.PUBLISHED_AGENTS,
        agentIdsToDelete,
        {
          showError,
          showSuccess,
          errorPrefix: "agents",
        },
      );
      if (result.success) {
        updateStateAfterDeletion(
          agentIdsToDelete,
          setAgents,
          setSelectedAgentIds,
        );
      }
    },
    [
      agents,
      user,
      storage,
      setAgents,
      setSelectedAgentIds,
      showError,
      showSuccess,
      showConfirm,
      logger,
    ],
  );
  return {
    deleteSelectedAgents,
  };
}
function useRepositoryAgentDeletion({
  storage,
  setRepositoryAgents,
  setSelectedRepositoryAgentIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
}) {
  const deleteSelectedRepositoryAgents = useCallback(
    async (selectedRepositoryAgentIds, onRefresh) => {
      if (isEmptySelection(selectedRepositoryAgentIds)) return;
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${selectedRepositoryAgentIds.size} selected agent(s) from your repository?`,
        {
          title: "Delete Repository Agents",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "danger",
        },
      );
      if (!confirmed) return;
      const result = deleteAgentsFromStorage(
        storage,
        STORAGE_KEYS.REPOSITORY_AGENTS,
        selectedRepositoryAgentIds,
        {
          showError,
          showSuccess,
          onComplete: onRefresh,
          errorPrefix: "repository agents",
        },
      );
      if (result.success) {
        updateStateAfterDeletion(
          selectedRepositoryAgentIds,
          setRepositoryAgents,
          setSelectedRepositoryAgentIds,
        );
      }
    },
    [
      storage,
      setRepositoryAgents,
      setSelectedRepositoryAgentIds,
      showError,
      showSuccess,
      showConfirm,
    ],
  );
  return {
    deleteSelectedRepositoryAgents,
  };
}
export { useAgentDeletion, useRepositoryAgentDeletion };
