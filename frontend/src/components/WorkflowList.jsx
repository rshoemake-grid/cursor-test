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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    );
  }
  if (workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          {!isAuthenticated ? (
            <>
              <p className="text-gray-500 mb-2">
                Your saved workflows are available after you sign in
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Browse templates on the Marketplace, or log in to open workflows
                you own
              </p>
              <button
                onClick={() => navigate("/marketplace")}
                className="px-4 py-2 mb-3 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors block mx-auto"
              >
                Open Marketplace
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No workflows yet</p>
              <p className="text-sm text-gray-400">
                Create your first workflow in the Builder
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to builder"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Workflows</h2>
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkDuplicate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate Selected ({selectedIds.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
        {workflows.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {selectedIds.size === workflows.length ? (
                <CheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span>
                {selectedIds.size === workflows.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {workflows.map((workflow) => {
            const isSelected = workflow.id && selectedIds.has(workflow.id);
            const hasSelection = selectedIds.size > 0;
            return (
              <div
                key={workflow.id}
                className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${isSelected ? "border-primary-500 bg-primary-50" : "border-transparent"} ${hasSelection ? "" : "cursor-pointer"}`}
                onClick={(e) => {
                  if (
                    (!hasSelection && e.target === e.currentTarget) ||
                    e.target.closest(".workflow-content")
                  ) {
                    workflow.id && onSelectWorkflow(workflow.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        workflow.id && handleToggleSelect(workflow.id);
                      }}
                      className="mt-1 flex-shrink-0"
                      title={
                        isSelected ? "Deselect workflow" : "Select workflow"
                      }
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div
                      className="flex-1 workflow-content"
                      onClick={(e) => {
                        if (hasSelection) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <h3 className="font-semibold text-gray-900">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          workflow.id && openPublishModal(workflow.id);
                        }}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        title="Publish to marketplace"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        workflow.id && handleDelete(workflow.id);
                      }}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className="flex items-center gap-4 text-sm text-gray-500 workflow-content"
                  onClick={(e) => {
                    if (hasSelection) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    {workflow.nodes?.length || 0} nodes
                  </div>
                  {workflow.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form
            onSubmit={handlePublish}
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Publish to Marketplace
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishingWorkflowId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={publishForm.category}
                onChange={(e) =>
                  handlePublishFormChange("category", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {TEMPLATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatCategory(category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={publishForm.difficulty}
                  onChange={(e) =>
                    handlePublishFormChange("difficulty", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {TEMPLATE_DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {formatDifficulty(diff)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={publishForm.estimated_time}
                  onChange={(e) =>
                    handlePublishFormChange("estimated_time", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 30 minutes"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={publishForm.tags}
                onChange={(e) =>
                  handlePublishFormChange("tags", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="automation, ai, ..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishingWorkflowId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export { WorkflowList as default };
