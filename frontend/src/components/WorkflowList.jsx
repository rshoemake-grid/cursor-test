import { useEffect, useState } from "react";
import { api } from "../api/client";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import {
  Play,
  Trash2,
  Calendar,
  CheckSquare,
  Square,
  ArrowLeft,
  Copy,
  Upload,
  X,
} from "lucide-react";
import { showError, showSuccess, showWarning } from "../utils/notifications";
import { showConfirm } from "../utils/confirm";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty,
} from "../config/templateConstants";
import { getDefaultPublishForm, parseTags } from "../utils/publishFormUtils";
import {
  EmptyStateInlineCenter,
  EmptyStateLead,
  EmptyStateHint,
  EmptyStateOutlineCta,
  EmptyStatePrimaryCta,
} from "../styles/contentBlocks.styled";
import {
  WorkflowListScroll,
  WorkflowListInner,
  WorkflowListHeader,
  WorkflowListTitleRow,
  WorkflowBackButton,
  WorkflowListTitle,
  WorkflowBulkToolbar,
  WorkflowBulkCount,
  WorkflowPrimaryButton,
  WorkflowSelectAllRow,
  WorkflowSelectAllButton,
  WorkflowIconPrimary,
  WorkflowIconMuted,
  WorkflowCardGrid,
  WorkflowCard,
  WorkflowCardTop,
  WorkflowCardTopLeft,
  WorkflowCheckboxButton,
  WorkflowCardBody,
  WorkflowCardName,
  WorkflowCardDesc,
  WorkflowCardActions,
  WorkflowIconAction,
  WorkflowCardMeta,
  WorkflowMetaItem,
  WorkflowModalOverlay,
  WorkflowModalForm,
  WorkflowModalHeader,
  WorkflowModalTitle,
  WorkflowModalClose,
  WorkflowFieldLabel,
  WorkflowFieldInput,
  WorkflowFieldSelect,
  WorkflowModalRow,
  WorkflowModalCol,
  WorkflowModalActions,
  WorkflowModalSecondary,
  WorkflowModalSubmit,
  WorkflowLoadingCenter,
  WorkflowLoadingText,
} from "../styles/workflowList.styled";
function WorkflowList({ onSelectWorkflow, onBack }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingWorkflowId, setPublishingWorkflowId] = useState(null);
  const [publishForm, setPublishForm] = useState(getDefaultPublishForm());
  const [isPublishing, setIsPublishing] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      setWorkflows([]);
      setSelectedIds(new Set());
      setLoading(false);
      return;
    }
    loadWorkflows();
  }, [isAuthenticated]);
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      if (error.response?.status === 401) {
        showError("Authentication required. Please log in again.");
      } else {
        showError(
          "Failed to load workflows: " +
            extractApiErrorMessage(error, "Unknown error"),
        );
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "Are you sure you want to delete this workflow?",
      {
        title: "Delete Workflow",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      },
    );
    if (!confirmed) return;
    try {
      await api.deleteWorkflow(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showSuccess("Workflow deleted successfully");
    } catch (error) {
      showError(
        "Failed to delete workflow: " +
          extractApiErrorMessage(error, "Unknown error"),
      );
    }
  };
  const handleBulkDuplicate = async () => {
    if (selectedIds.size === 0) {
      showWarning("Please select at least one workflow to duplicate");
      return;
    }
    const count = selectedIds.size;
    const confirmed = await showConfirm(
      `Duplicate ${count} workflow(s)? Each will be created with "-copy" appended to the name.`,
      {
        title: "Duplicate Workflows",
        confirmText: "Duplicate",
        cancelText: "Cancel",
      },
    );
    if (!confirmed) return;
    try {
      const ids = Array.from(selectedIds);
      const duplicatedNames = [];
      for (const id of ids) {
        try {
          const duplicated = await api.duplicateWorkflow(id);
          duplicatedNames.push(duplicated.name);
        } catch (error) {
          showError(
            `Failed to duplicate workflow ${id}: ${extractApiErrorMessage(error, "Unknown error")}`,
          );
        }
      }
      await loadWorkflows();
      setSelectedIds(new Set());
      if (duplicatedNames.length > 0) {
        showSuccess(
          `Successfully duplicated ${duplicatedNames.length} workflow(s)`,
        );
      }
    } catch (error) {
      showError(
        "Failed to duplicate workflows: " +
          extractApiErrorMessage(error, "Unknown error"),
      );
    }
  };
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const handleSelectAll = () => {
    if (selectedIds.size === workflows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workflows.map((w) => w.id).filter(Boolean)));
    }
  };
  const openPublishModal = (workflowId) => {
    if (!isAuthenticated) {
      showError("Please log in to publish workflows to the marketplace.");
      return;
    }
    setPublishingWorkflowId(workflowId);
    setPublishForm({
      category: "automation",
      tags: "",
      difficulty: "beginner",
      estimated_time: "",
    });
    setShowPublishModal(true);
  };
  const handlePublishFormChange = (field, value) => {
    setPublishForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handlePublish = async (event) => {
    event.preventDefault();
    if (!publishingWorkflowId) {
      showError("No workflow selected for publishing.");
      return;
    }
    setIsPublishing(true);
    try {
      const tagsArray = parseTags(publishForm.tags);
      const published = await api.publishWorkflow(publishingWorkflowId, {
        category: publishForm.category,
        tags: tagsArray,
        difficulty: publishForm.difficulty,
        estimated_time: publishForm.estimated_time || void 0,
      });
      showSuccess(`Published "${published.name}" to the marketplace.`);
      setShowPublishModal(false);
      setPublishingWorkflowId(null);
    } catch (error) {
      const detail = extractApiErrorMessage(error, "Unknown error");
      showError(`Failed to publish workflow: ${detail}`);
    } finally {
      setIsPublishing(false);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      showWarning("Please select at least one workflow to delete");
      return;
    }
    const count = selectedIds.size;
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${count} workflow(s)?`,
      {
        title: "Delete Workflows",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      },
    );
    if (!confirmed) return;
    try {
      const ids = Array.from(selectedIds);
      const result = await api.bulkDeleteWorkflows(ids);
      setWorkflows(workflows.filter((w) => !selectedIds.has(w.id || "")));
      setSelectedIds(new Set());
      if (result.failed_ids && result.failed_ids.length > 0) {
        showError(`${result.message}
Failed IDs: ${result.failed_ids.join(", ")}`);
      } else {
        showSuccess(`Successfully deleted ${result.deleted_count} workflow(s)`);
      }
    } catch (error) {
      showError(
        "Failed to delete workflows: " +
          extractApiErrorMessage(error, "Unknown error"),
      );
    }
  };
  if (loading) {
    return (
      <WorkflowLoadingCenter>
        <WorkflowLoadingText>Loading workflows...</WorkflowLoadingText>
      </WorkflowLoadingCenter>
    );
  }
  if (workflows.length === 0) {
    return (
      <WorkflowLoadingCenter>
        <EmptyStateInlineCenter>
          {!isAuthenticated ? (
            <>
              <EmptyStateLead>
                Your saved workflows are available after you sign in
              </EmptyStateLead>
              <EmptyStateHint>
                Browse templates on the Marketplace, or log in to open workflows
                you own
              </EmptyStateHint>
              <EmptyStateOutlineCta
                type="button"
                onClick={() => navigate("/marketplace")}
              >
                Open Marketplace
              </EmptyStateOutlineCta>
              <EmptyStatePrimaryCta
                type="button"
                onClick={() => navigate("/auth")}
              >
                Log In
              </EmptyStatePrimaryCta>
            </>
          ) : (
            <>
              <EmptyStateLead>No workflows yet</EmptyStateLead>
              <EmptyStateHint $tight>
                Create your first workflow in the Builder
              </EmptyStateHint>
            </>
          )}
        </EmptyStateInlineCenter>
      </WorkflowLoadingCenter>
    );
  }
  return (
    <WorkflowListScroll>
      <WorkflowListInner>
        <WorkflowListHeader>
          <WorkflowListTitleRow>
            {onBack && (
              <WorkflowBackButton
                type="button"
                onClick={onBack}
                title="Back to builder"
              >
                <ArrowLeft aria-hidden />
              </WorkflowBackButton>
            )}
            <div>
              <WorkflowListTitle>My Workflows</WorkflowListTitle>
            </div>
          </WorkflowListTitleRow>
          {selectedIds.size > 0 && (
            <WorkflowBulkToolbar>
              <WorkflowBulkCount>
                {selectedIds.size} selected
              </WorkflowBulkCount>
              <WorkflowPrimaryButton
                type="button"
                onClick={handleBulkDuplicate}
              >
                <Copy aria-hidden />
                Duplicate Selected ({selectedIds.size})
              </WorkflowPrimaryButton>
              <WorkflowPrimaryButton
                type="button"
                $variant="danger"
                onClick={handleBulkDelete}
              >
                <Trash2 aria-hidden />
                Delete Selected ({selectedIds.size})
              </WorkflowPrimaryButton>
            </WorkflowBulkToolbar>
          )}
        </WorkflowListHeader>
        {workflows.length > 0 && (
          <WorkflowSelectAllRow>
            <WorkflowSelectAllButton
              type="button"
              onClick={handleSelectAll}
            >
              {selectedIds.size === workflows.length ? (
                <WorkflowIconPrimary>
                  <CheckSquare aria-hidden />
                </WorkflowIconPrimary>
              ) : (
                <WorkflowIconMuted>
                  <Square aria-hidden />
                </WorkflowIconMuted>
              )}
              <span>
                {selectedIds.size === workflows.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </WorkflowSelectAllButton>
          </WorkflowSelectAllRow>
        )}
        <WorkflowCardGrid>
          {workflows.map((workflow) => {
            const isSelected = workflow.id && selectedIds.has(workflow.id);
            const hasSelection = selectedIds.size > 0;
            return (
              <WorkflowCard
                key={workflow.id}
                $selected={!!isSelected}
                $clickable={!hasSelection}
                onClick={(e) => {
                  if (
                    (!hasSelection && e.target === e.currentTarget) ||
                    e.target.closest("[data-workflow-content]")
                  ) {
                    workflow.id && onSelectWorkflow(workflow.id);
                  }
                }}
              >
                <WorkflowCardTop>
                  <WorkflowCardTopLeft>
                    <WorkflowCheckboxButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        workflow.id && handleToggleSelect(workflow.id);
                      }}
                      title={
                        isSelected ? "Deselect workflow" : "Select workflow"
                      }
                    >
                      {isSelected ? (
                        <WorkflowIconPrimary>
                          <CheckSquare aria-hidden />
                        </WorkflowIconPrimary>
                      ) : (
                        <WorkflowIconMuted>
                          <Square aria-hidden />
                        </WorkflowIconMuted>
                      )}
                    </WorkflowCheckboxButton>
                    <WorkflowCardBody
                      data-workflow-content
                      onClick={(e) => {
                        if (hasSelection) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <WorkflowCardName>{workflow.name}</WorkflowCardName>
                      {workflow.description && (
                        <WorkflowCardDesc>
                          {workflow.description}
                        </WorkflowCardDesc>
                      )}
                    </WorkflowCardBody>
                  </WorkflowCardTopLeft>
                  <WorkflowCardActions>
                    {isAuthenticated && (
                      <WorkflowIconAction
                        type="button"
                        $variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          workflow.id && openPublishModal(workflow.id);
                        }}
                        title="Publish to marketplace"
                      >
                        <Upload aria-hidden />
                      </WorkflowIconAction>
                    )}
                    <WorkflowIconAction
                      type="button"
                      $variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        workflow.id && handleDelete(workflow.id);
                      }}
                      title="Delete workflow"
                    >
                      <Trash2 aria-hidden />
                    </WorkflowIconAction>
                  </WorkflowCardActions>
                </WorkflowCardTop>
                <WorkflowCardMeta
                  data-workflow-content
                  onClick={(e) => {
                    if (hasSelection) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <WorkflowMetaItem>
                    <Play aria-hidden />
                    {workflow.nodes?.length || 0} nodes
                  </WorkflowMetaItem>
                  {workflow.created_at && (
                    <WorkflowMetaItem>
                      <Calendar aria-hidden />
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </WorkflowMetaItem>
                  )}
                </WorkflowCardMeta>
              </WorkflowCard>
            );
          })}
        </WorkflowCardGrid>
      </WorkflowListInner>
      {showPublishModal && (
        <WorkflowModalOverlay>
          <WorkflowModalForm onSubmit={handlePublish}>
            <WorkflowModalHeader>
              <WorkflowModalTitle>Publish to Marketplace</WorkflowModalTitle>
              <WorkflowModalClose
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishingWorkflowId(null);
                }}
                aria-label="Close"
              >
                <X aria-hidden />
              </WorkflowModalClose>
            </WorkflowModalHeader>
            <div>
              <WorkflowFieldLabel>Category</WorkflowFieldLabel>
              <WorkflowFieldSelect
                value={publishForm.category}
                onChange={(e) =>
                  handlePublishFormChange("category", e.target.value)
                }
              >
                {TEMPLATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatCategory(category)}
                  </option>
                ))}
              </WorkflowFieldSelect>
            </div>
            <WorkflowModalRow>
              <WorkflowModalCol>
                <WorkflowFieldLabel>Difficulty</WorkflowFieldLabel>
                <WorkflowFieldSelect
                  value={publishForm.difficulty}
                  onChange={(e) =>
                    handlePublishFormChange("difficulty", e.target.value)
                  }
                >
                  {TEMPLATE_DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {formatDifficulty(diff)}
                    </option>
                  ))}
                </WorkflowFieldSelect>
              </WorkflowModalCol>
              <WorkflowModalCol>
                <WorkflowFieldLabel>Estimated Time</WorkflowFieldLabel>
                <WorkflowFieldInput
                  type="text"
                  value={publishForm.estimated_time}
                  onChange={(e) =>
                    handlePublishFormChange("estimated_time", e.target.value)
                  }
                  placeholder="e.g. 30 minutes"
                />
              </WorkflowModalCol>
            </WorkflowModalRow>
            <div>
              <WorkflowFieldLabel>Tags (comma separated)</WorkflowFieldLabel>
              <WorkflowFieldInput
                type="text"
                value={publishForm.tags}
                onChange={(e) =>
                  handlePublishFormChange("tags", e.target.value)
                }
                placeholder="automation, ai, ..."
              />
            </div>
            <WorkflowModalActions>
              <WorkflowModalSecondary
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishingWorkflowId(null);
                }}
              >
                Cancel
              </WorkflowModalSecondary>
              <WorkflowModalSubmit type="submit" disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Publish"}
              </WorkflowModalSubmit>
            </WorkflowModalActions>
          </WorkflowModalForm>
        </WorkflowModalOverlay>
      )}
    </WorkflowListScroll>
  );
}
export { WorkflowList as default };
