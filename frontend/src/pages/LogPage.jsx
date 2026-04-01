import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Download } from "lucide-react";
import ExecutionListItem from "../components/log/ExecutionListItem";
import ExecutionFilters from "../components/log/ExecutionFilters";
import BulkActionsBar from "../components/log/BulkActionsBar";
import ExecutionDetailsModal from "../components/log/ExecutionDetailsModal";
import AdvancedSearch from "../components/log/AdvancedSearch";
import AdvancedFiltersPanel from "../components/log/AdvancedFiltersPanel";
import VirtualizedList from "../components/ui/VirtualizedList";
import Pagination from "../components/ui/Pagination";
import ToastContainer from "../components/ui/ToastContainer";
import { useKeyboardShortcuts } from "../hooks/utils/useKeyboardShortcuts";
import { useAdvancedFilters } from "../hooks/log/useAdvancedFilters";
import { useExecutionListQuery } from "../hooks/log/useExecutionListQuery";
import { useExecutionPagination } from "../hooks/log/useExecutionPagination";
import { useBulkOperations } from "../hooks/log/useBulkOperations";
import { useExecutionNotifications } from "../hooks/log/useExecutionNotifications";
import { useToast } from "../hooks/utils/useToast";
import { applyExecutionFilters } from "../utils/executionFilters";
import { exportExecutionsToJSON, exportExecutionsToCSV } from "../utils/exportFormatters";
import { api } from "../api/client";
import { showConfirm } from "../utils/confirm";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
function LogPage({ apiClient: injectedApiClient } = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    sortBy: "started_at",
    sortOrder: "desc"
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const { data: executions = [], isLoading: loading, error, refetch } = useExecutionListQuery({
    apiClient: injectedApiClient || api,
    refetchInterval: 5e3,
    filters: filters.status ? {
      status: filters.status.join(","),
      workflow_id: filters.workflowId,
      limit: 100
    } : filters.workflowId ? { workflow_id: filters.workflowId, limit: 100 } : { limit: 100 }
  });
  const handleExecutionClick = (executionId) => {
    if (bulkMode) {
      bulkOperations.toggleSelection(executionId);
    } else {
      const execution = executions.find((e) => e.execution_id === executionId);
      if (execution) {
        setSelectedExecution(execution);
        setIsDetailsModalOpen(true);
      } else {
        navigate(`/?execution=${executionId}`);
      }
    }
  };
  const baseFilteredExecutions = useMemo(() => {
    return applyExecutionFilters(executions, filters);
  }, [executions, filters]);
  const { filteredExecutions: advancedFilteredExecutions, filterCount } = useAdvancedFilters({
    executions: baseFilteredExecutions,
    filters: advancedFilters
  });
  const finalFilteredExecutions = useMemo(() => {
    if (!searchQuery.trim()) {
      return advancedFilteredExecutions;
    }
    const query = searchQuery.toLowerCase();
    return advancedFilteredExecutions.filter((execution) => {
      return execution.execution_id.toLowerCase().includes(query) || execution.workflow_id.toLowerCase().includes(query) || execution.status.toLowerCase().includes(query) || execution.current_node && execution.current_node.toLowerCase().includes(query) || execution.error && execution.error.toLowerCase().includes(query);
    });
  }, [advancedFilteredExecutions, searchQuery]);
  const {
    currentPage,
    totalPages,
    paginatedExecutions,
    setCurrentPage,
    setItemsPerPage,
    itemsPerPage,
    totalItems
  } = useExecutionPagination({
    executions: finalFilteredExecutions,
    itemsPerPage: 25
  });
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "f",
        ctrlKey: true,
        handler: () => {
          const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
          searchInput?.focus();
        },
        description: "Focus search"
      },
      {
        key: "b",
        ctrlKey: true,
        handler: () => {
          setBulkMode(!bulkMode);
        },
        description: "Toggle bulk mode"
      },
      {
        key: "Escape",
        handler: () => {
          if (isDetailsModalOpen) {
            setIsDetailsModalOpen(false);
            setSelectedExecution(null);
          }
          if (showAdvancedFilters) {
            setShowAdvancedFilters(false);
          }
          if (bulkMode) {
            setBulkMode(false);
            bulkOperations.clearSelection();
          }
        },
        description: "Close modals/clear selections"
      }
    ],
    enabled: true
  });
  const handleExportJSON = () => {
    exportExecutionsToJSON(finalFilteredExecutions);
    toast.success("Executions exported to JSON");
  };
  const handleExportCSV = () => {
    exportExecutionsToCSV(finalFilteredExecutions);
    toast.success("Executions exported to CSV");
  };
  const handleBulkDelete = async (executionIds) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${executionIds.length} execution(s)? This action cannot be undone.`,
      {
        title: "Delete Executions",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger"
      }
    );
    if (!confirmed) {
      return;
    }
    try {
      toast.info(`Cancelling ${executionIds.length} execution(s)...`);
      let succeeded = 0;
      let failed = 0;
      for (const id of executionIds) {
        try {
          await api.cancelExecution(id);
          succeeded++;
        } catch (err) {
          failed++;
          toast.error(`Failed to cancel ${id.slice(0, 8)}...: ${extractApiErrorMessage(err, "Unknown error")}`);
        }
      }
      if (succeeded > 0) {
        toast.success(`Cancelled ${succeeded} execution(s)${failed > 0 ? ` (${failed} failed)` : ""}`);
        refetch();
      }
    } catch (error2) {
      toast.error(`Failed to cancel executions: ${extractApiErrorMessage(error2, "Unknown error")}`);
      throw error2;
    }
  };
  const bulkOperations = useBulkOperations({
    executions: paginatedExecutions,
    onDelete: handleBulkDelete
  });
  useExecutionNotifications({
    executions,
    onSuccess: (execution) => {
      toast.success(`Execution ${execution.execution_id.slice(0, 8)}... completed successfully`);
    },
    onError: (execution) => {
      toast.error(
        `Execution ${execution.execution_id.slice(0, 8)}... failed${execution.error ? `: ${execution.error}` : ""}`
      );
    },
    enabled: !bulkMode
    // Only show notifications when not in bulk mode
  });
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading executions..." }) }) }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error: ",
      extractApiErrorMessage(error, "Unknown error")
    ] }) }) }) });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ToastContainer, { toasts: toast.toasts, onRemoveToast: toast.removeToast }),
    /* @__PURE__ */ jsx(
      ExecutionDetailsModal,
      {
        execution: selectedExecution,
        isOpen: isDetailsModalOpen,
        onClose: () => {
          setIsDetailsModalOpen(false);
          setSelectedExecution(null);
        },
        apiClient: injectedApiClient || api
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Execution Log" }),
          /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
            totalItems,
            " execution",
            totalItems !== 1 ? "s" : "",
            totalItems !== finalFilteredExecutions.length && ` of ${finalFilteredExecutions.length} filtered`,
            finalFilteredExecutions.length !== executions.length && ` (${executions.length} total)`
          ] })
        ] }),
        finalFilteredExecutions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setBulkMode(!bulkMode),
              className: `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${bulkMode ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
              children: bulkMode ? "Cancel Selection" : "Select Multiple"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleExportJSON,
              className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                "Export JSON"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleExportCSV,
              className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                "Export CSV"
              ]
            }
          )
        ] })
      ] }),
      bulkMode && /* @__PURE__ */ jsx(
        BulkActionsBar,
        {
          selectedCount: bulkOperations.selectedCount,
          onDelete: bulkOperations.deleteSelected,
          onClearSelection: () => {
            bulkOperations.clearSelection();
            setBulkMode(false);
          },
          isDeleting: bulkOperations.isDeleting
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx(
          AdvancedSearch,
          {
            value: searchQuery,
            onSearch: setSearchQuery,
            onClear: () => setSearchQuery(""),
            placeholder: "Search by ID, workflow, status, node, or error...",
            showAdvanced: showAdvancedFilters,
            onToggleAdvanced: () => setShowAdvancedFilters(!showAdvancedFilters)
          }
        ),
        showAdvancedFilters && /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
          AdvancedFiltersPanel,
          {
            filters: advancedFilters,
            onFiltersChange: setAdvancedFilters,
            onClose: () => setShowAdvancedFilters(false)
          }
        ) }),
        filterCount > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-gray-600", children: [
          filterCount,
          " active filter",
          filterCount !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ExecutionFilters,
        {
          filters,
          onFiltersChange: setFilters
        }
      ),
      finalFilteredExecutions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-gray-900 mb-2", children: "No executions yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Execute a workflow to see execution logs here" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-6", children: [
          bulkMode && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 px-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: bulkOperations.isAllSelected,
                onChange: bulkOperations.toggleSelectAll,
                className: "w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500",
                "aria-label": "Select all executions"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: bulkOperations.isAllSelected ? "Deselect all" : "Select all" })
          ] }),
          paginatedExecutions.length > 50 ? /* @__PURE__ */ jsx(
            VirtualizedList,
            {
              items: paginatedExecutions,
              itemHeight: 120,
              containerHeight: 600,
              renderItem: (execution) => /* @__PURE__ */ jsx("div", { className: "mb-3", children: /* @__PURE__ */ jsx(
                ExecutionListItem,
                {
                  execution,
                  onExecutionClick: handleExecutionClick,
                  isSelected: bulkOperations.selectedIds.has(execution.execution_id),
                  onSelect: bulkOperations.toggleSelection,
                  showCheckbox: bulkMode
                },
                execution.execution_id
              ) })
            }
          ) : paginatedExecutions.map((execution) => /* @__PURE__ */ jsx(
            ExecutionListItem,
            {
              execution,
              onExecutionClick: handleExecutionClick,
              isSelected: bulkOperations.selectedIds.has(execution.execution_id),
              onSelect: bulkOperations.toggleSelection,
              showCheckbox: bulkMode
            },
            execution.execution_id
          ))
        ] }),
        /* @__PURE__ */ jsx(
          Pagination,
          {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: setItemsPerPage
          }
        )
      ] })
    ] }) })
  ] });
}

LogPage.propTypes = {
  apiClient: PropTypes.shape({
    listExecutions: PropTypes.func,
    cancelExecution: PropTypes.func,
    getExecutionLogs: PropTypes.func,
    downloadExecutionLogs: PropTypes.func,
  }),
};

export {
  LogPage as default
};
