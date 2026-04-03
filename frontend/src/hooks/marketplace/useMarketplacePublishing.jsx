import { useState, useCallback } from "react";
import {
  showError as defaultShowError,
  showSuccess as defaultShowSuccess,
} from "../../utils/notifications";
import { usePublishForm } from "../forms";
import { logicalOrToUndefined } from "../utils/logicalOr";
import { extractApiErrorMessage } from "../utils/apiUtils";
function useMarketplacePublishing({
  activeTab,
  token,
  httpClient,
  apiBaseUrl,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
}) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const publishFormHook = usePublishForm();
  const openPublishModal = useCallback(() => {
    if (activeTab === null || activeTab === void 0) {
      showError("Select a workflow tab before publishing.");
      return;
    }
    publishFormHook.updateForm({
      name: activeTab.name,
      description: "",
      category: "automation",
      tags: "",
      difficulty: "beginner",
      estimated_time: "",
    });
    setShowPublishModal(true);
  }, [activeTab, publishFormHook]);
  const closePublishModal = useCallback(() => {
    setShowPublishModal(false);
  }, []);
  const handlePublishFormChange = useCallback(
    (field, value) => {
      publishFormHook.updateField(field, value);
    },
    [publishFormHook],
  );
  const handlePublish = useCallback(
    async (event) => {
      event.preventDefault();
      if (
        activeTab === null ||
        activeTab === void 0 ||
        activeTab.workflowId === null ||
        activeTab.workflowId === void 0 ||
        activeTab.workflowId === ""
      ) {
        showError("Save the workflow before publishing to the marketplace.");
        return;
      }
      setIsPublishing(true);
      try {
        const tagsArray = publishFormHook.form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        const headers = {
          "Content-Type": "application/json",
          ...(token !== null && token !== void 0 && token !== ""
            ? { Authorization: `Bearer ${token}` }
            : {}),
        };
        const response = await httpClient.post(
          `${apiBaseUrl}/workflows/${activeTab.workflowId}/publish`,
          {
            category: publishFormHook.form.category,
            tags: tagsArray,
            difficulty: publishFormHook.form.difficulty,
            estimated_time: logicalOrToUndefined(
              publishFormHook.form.estimated_time,
            ),
          },
          headers,
        );
        if (response.ok) {
          const published = await response.json();
          showSuccess(`Published "${published.name}" to the marketplace.`);
          setShowPublishModal(false);
        } else {
          const errorText = await response.text();
          showError(`Failed to publish: ${errorText}`);
        }
      } catch (error) {
        showError(
          "Failed to publish workflow: " +
            extractApiErrorMessage(error, "Unknown error"),
        );
      } finally {
        setIsPublishing(false);
      }
    },
    [activeTab, token, httpClient, apiBaseUrl, publishFormHook],
  );
  return {
    showPublishModal,
    isPublishing,
    publishForm: publishFormHook.form,
    openPublishModal,
    closePublishModal,
    handlePublishFormChange,
    handlePublish,
  };
}
export { useMarketplacePublishing };
