import { useCallback } from "react";
import {
  showError as defaultShowError,
  showSuccess as defaultShowSuccess,
} from "../../utils/notifications";
import { showConfirm as defaultShowConfirm } from "../../utils/confirm";
import { api as defaultApi } from "../../api/client";
import {
  filterUserOwnedDeletableItems,
  separateOfficialItems,
} from "../utils/ownership";
import { isEmptySelection } from "../../utils/validationUtils";
import { extractApiErrorMessage } from "../utils/apiUtils";
import {
  hasOfficialItems,
  hasNoUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
} from "../utils/deletionValidation";
function useWorkflowDeletion({
  user,
  templates,
  workflowsOfWorkflows,
  activeTab,
  setTemplates,
  setWorkflowsOfWorkflows,
  setSelectedTemplateIds,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
  showConfirm = defaultShowConfirm,
  api = defaultApi,
}) {
  const deleteSelectedWorkflows = useCallback(
    async (selectedTemplateIds) => {
      if (isEmptySelection(selectedTemplateIds)) return;
      const currentTemplates =
        activeTab === "workflows-of-workflows"
          ? workflowsOfWorkflows
          : templates;
      const selectedTemplates = currentTemplates.filter((t) =>
        selectedTemplateIds.has(t.id),
      );
      const { official: officialTemplates, deletable: deletableTemplates } =
        separateOfficialItems(selectedTemplates);
      if (hasOfficialItems(officialTemplates)) {
        showError(
          `Cannot delete ${officialTemplates.length} official workflow(s). Official workflows cannot be deleted.`,
        );
        if (deletableTemplates.length === 0) {
          return;
        }
      }
      const userOwnedTemplates = filterUserOwnedDeletableItems(
        deletableTemplates,
        user,
      );
      if (hasNoUserOwnedItems(userOwnedTemplates)) {
        if (hasOfficialItems(officialTemplates)) {
          showError(
            "You can only delete workflows that you published (official workflows cannot be deleted)",
          );
        } else {
          showError("You can only delete workflows that you published");
        }
        return;
      }
      if (
        ownsPartialItems(userOwnedTemplates.length, deletableTemplates.length)
      ) {
        const confirmed = await showConfirm(
          `You can only delete ${userOwnedTemplates.length} of ${deletableTemplates.length} selected workflow(s). Delete only the ones you own?`,
          {
            title: "Partial Delete",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "warning",
          },
        );
        if (!confirmed) return;
      } else if (
        ownsAllItems(userOwnedTemplates.length, deletableTemplates.length)
      ) {
        const confirmed = await showConfirm(
          `Are you sure you want to delete ${userOwnedTemplates.length} selected workflow(s) from the marketplace?`,
          {
            title: "Delete Workflows",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger",
          },
        );
        if (!confirmed) return;
      }
      try {
        const deletePromises = userOwnedTemplates.map((template) =>
          api.deleteTemplate(template.id),
        );
        await Promise.all(deletePromises);
        const templateIdsToDelete = new Set(
          userOwnedTemplates.map((t) => t.id),
        );
        setTemplates((prevTemplates) =>
          prevTemplates.filter((t) => !templateIdsToDelete.has(t.id)),
        );
        setWorkflowsOfWorkflows((prevWorkflows) =>
          prevWorkflows.filter((t) => !templateIdsToDelete.has(t.id)),
        );
        setSelectedTemplateIds(new Set());
        showSuccess(
          `Successfully deleted ${userOwnedTemplates.length} workflow(s)`,
        );
      } catch (error) {
        const errorMessage = extractApiErrorMessage(error, "Unknown error");
        showError(`Failed to delete workflows: ${errorMessage}`);
      }
    },
    [
      templates,
      workflowsOfWorkflows,
      activeTab,
      user,
      setTemplates,
      setWorkflowsOfWorkflows,
      setSelectedTemplateIds,
      showError,
      showSuccess,
      showConfirm,
      api,
    ],
  );
  return {
    deleteSelectedWorkflows,
  };
}
export { useWorkflowDeletion };
