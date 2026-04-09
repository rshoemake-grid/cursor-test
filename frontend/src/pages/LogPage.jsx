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
import {
  exportExecutionsToJSON,
  exportExecutionsToCSV,
} from "../utils/exportFormatters";
import { api } from "../api/client";
import { showConfirm } from "../utils/confirm";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import {
  PanelEmptyCard,
  PanelEmptyIconWrap,
  PanelEmptyTitle,
  PanelEmptySubtitle,
} from "../styles/contentBlocks.styled";
import {
  InsightsScrollShell,
  InsightsInnerNarrow,
  InsightsCenteredPane,
  InsightsMutedText,
  InsightsErrorText,
  InsightsPageTitle,
  InsightsPageSubtitle,
  LogPageHeaderRow,
  LogToolbar,
  LogToolbarButton,
  LogSearchBlock,
  LogAdvancedFiltersMount,
  LogFilterCountHint,
  LogListSection,
  LogVirtualizedItemWrap,
  LogBulkSelectRow,
  LogBulkCheckbox,
  LogBulkSelectLabel,
} from "../styles/analyticsLogPages.styled";
function LogPage({ apiClient: injectedApiClient } = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    sortBy: "started_at",
    sortOrder: "desc",
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const {
    data: executions = [],
    isLoading: loading,
    error,
    refetch,
  } = useExecutionListQuery({
    apiClient: injectedApiClient || api,
    refetchInterval: 12e3,
    filters: filters.status
      ? {
          status: filters.status.join(","),
          workflow_id: filters.workflowId,
          limit: 100,
        }
      : filters.workflowId
        ? {
            workflow_id: filters.workflowId,
            limit: 100,
          }
        : {
            limit: 100,
          },
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
  const { filteredExecutions: advancedFilteredExecutions, filterCount } =
    useAdvancedFilters({
      executions: baseFilteredExecutions,
      filters: advancedFilters,
    });
  const finalFilteredExecutions = useMemo(() => {
    if (!searchQuery.trim()) {
      return advancedFilteredExecutions;
    }
    const query = searchQuery.toLowerCase();
    return advancedFilteredExecutions.filter((execution) => {
      return (
        execution.execution_id.toLowerCase().includes(query) ||
        execution.workflow_id.toLowerCase().includes(query) ||
        execution.status.toLowerCase().includes(query) ||
        (execution.current_node &&
          execution.current_node.toLowerCase().includes(query)) ||
        (execution.error && execution.error.toLowerCase().includes(query))
      );
    });
  }, [advancedFilteredExecutions, searchQuery]);
  const {
    currentPage,
    totalPages,
    paginatedExecutions,
    setCurrentPage,
    setItemsPerPage,
    itemsPerPage,
    totalItems,
  } = useExecutionPagination({
    executions: finalFilteredExecutions,
    itemsPerPage: 25,
  });
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "f",
        ctrlKey: true,
        handler: () => {
          const searchInput = document.querySelector(
            'input[type="text"][placeholder*="Search"]',
          );
          searchInput?.focus();
        },
        description: "Focus search",
      },
      {
        key: "b",
        ctrlKey: true,
        handler: () => {
          setBulkMode(!bulkMode);
        },
        description: "Toggle bulk mode",
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
        description: "Close modals/clear selections",
      },
    ],
    enabled: true,
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
        type: "danger",
      },
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
          toast.error(
            `Failed to cancel ${id.slice(0, 8)}...: ${extractApiErrorMessage(err, "Unknown error")}`,
          );
        }
      }
      if (succeeded > 0) {
        toast.success(
          `Cancelled ${succeeded} execution(s)${failed > 0 ? ` (${failed} failed)` : ""}`,
        );
        refetch();
      }
    } catch (error2) {
      toast.error(
        `Failed to cancel executions: ${extractApiErrorMessage(error2, "Unknown error")}`,
      );
      throw error2;
    }
  };
  const bulkOperations = useBulkOperations({
    executions: paginatedExecutions,
    onDelete: handleBulkDelete,
  });
  useExecutionNotifications({
    executions,
    onSuccess: (execution) => {
      toast.success(
        `Execution ${execution.execution_id.slice(0, 8)}... completed successfully`,
      );
    },
    onError: (execution) => {
      toast.error(
        `Execution ${execution.execution_id.slice(0, 8)}... failed${execution.error ? `: ${execution.error}` : ""}`,
      );
    },
    enabled: !bulkMode,
    // Only show notifications when not in bulk mode
  });
  if (loading) {
    return (
      <InsightsScrollShell>
        <InsightsInnerNarrow>
          <InsightsCenteredPane>
            <InsightsMutedText>Loading executions...</InsightsMutedText>
          </InsightsCenteredPane>
        </InsightsInnerNarrow>
      </InsightsScrollShell>
    );
  }
  if (error) {
    return (
      <InsightsScrollShell>
        <InsightsInnerNarrow>
          <InsightsCenteredPane>
            <InsightsErrorText>
              Error: {extractApiErrorMessage(error, "Unknown error")}
            </InsightsErrorText>
          </InsightsCenteredPane>
        </InsightsInnerNarrow>
      </InsightsScrollShell>
    );
  }
  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      <ExecutionDetailsModal
        execution={selectedExecution}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedExecution(null);
        }}
        apiClient={injectedApiClient || api}
      />
      <InsightsScrollShell>
        <InsightsInnerNarrow>
          <LogPageHeaderRow>
            <div>
              <InsightsPageTitle>Execution Log</InsightsPageTitle>
              <InsightsPageSubtitle>
                {totalItems} execution{totalItems !== 1 ? "s" : ""}
                {totalItems !== finalFilteredExecutions.length &&
                  ` of ${finalFilteredExecutions.length} filtered`}
                {finalFilteredExecutions.length !== executions.length &&
                  ` (${executions.length} total)`}
              </InsightsPageSubtitle>
            </div>
            {finalFilteredExecutions.length > 0 && (
              <LogToolbar>
                <LogToolbarButton
                  type="button"
                  $variant={bulkMode ? "primary" : "secondary"}
                  onClick={() => setBulkMode(!bulkMode)}
                >
                  {bulkMode ? "Cancel Selection" : "Select Multiple"}
                </LogToolbarButton>
                <LogToolbarButton
                  type="button"
                  $variant="secondary"
                  onClick={handleExportJSON}
                >
                  <Download aria-hidden />
                  Export JSON
                </LogToolbarButton>
                <LogToolbarButton
                  type="button"
                  $variant="secondary"
                  onClick={handleExportCSV}
                >
                  <Download aria-hidden />
                  Export CSV
                </LogToolbarButton>
              </LogToolbar>
            )}
          </LogPageHeaderRow>
          {bulkMode && (
            <BulkActionsBar
              selectedCount={bulkOperations.selectedCount}
              onDelete={bulkOperations.deleteSelected}
              onClearSelection={() => {
                bulkOperations.clearSelection();
                setBulkMode(false);
              }}
              isDeleting={bulkOperations.isDeleting}
            />
          )}
          <LogSearchBlock>
            <AdvancedSearch
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="Search by ID, workflow, status, node, or error..."
              showAdvanced={showAdvancedFilters}
              onToggleAdvanced={() =>
                setShowAdvancedFilters(!showAdvancedFilters)
              }
            />
            {showAdvancedFilters && (
              <LogAdvancedFiltersMount>
                <AdvancedFiltersPanel
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onClose={() => setShowAdvancedFilters(false)}
                />
              </LogAdvancedFiltersMount>
            )}
            {filterCount > 0 && (
              <LogFilterCountHint>
                {filterCount} active filter{filterCount !== 1 ? "s" : ""}
              </LogFilterCountHint>
            )}
          </LogSearchBlock>
          <ExecutionFilters filters={filters} onFiltersChange={setFilters} />
          {finalFilteredExecutions.length === 0 ? (
            <PanelEmptyCard>
              <PanelEmptyIconWrap>
                <AlertCircle aria-hidden />
              </PanelEmptyIconWrap>
              <PanelEmptyTitle>No executions yet</PanelEmptyTitle>
              <PanelEmptySubtitle>
                Execute a workflow to see execution logs here
              </PanelEmptySubtitle>
            </PanelEmptyCard>
          ) : (
            <>
              <LogListSection>
                {bulkMode && (
                  <LogBulkSelectRow>
                    <LogBulkCheckbox
                      type="checkbox"
                      checked={bulkOperations.isAllSelected}
                      onChange={bulkOperations.toggleSelectAll}
                      aria-label="Select all executions"
                    />
                    <LogBulkSelectLabel>
                      {bulkOperations.isAllSelected
                        ? "Deselect all"
                        : "Select all"}
                    </LogBulkSelectLabel>
                  </LogBulkSelectRow>
                )}
                {paginatedExecutions.length > 50 ? (
                  <VirtualizedList
                    items={paginatedExecutions}
                    itemHeight={120}
                    containerHeight={600}
                    renderItem={(execution) => (
                      <LogVirtualizedItemWrap key={execution.execution_id}>
                        <ExecutionListItem
                          execution={execution}
                          onExecutionClick={handleExecutionClick}
                          isSelected={bulkOperations.selectedIds.has(
                            execution.execution_id,
                          )}
                          onSelect={bulkOperations.toggleSelection}
                          showCheckbox={bulkMode}
                        />
                      </LogVirtualizedItemWrap>
                    )}
                  />
                ) : (
                  paginatedExecutions.map((execution) => (
                    <ExecutionListItem
                      key={execution.execution_id}
                      execution={execution}
                      onExecutionClick={handleExecutionClick}
                      isSelected={bulkOperations.selectedIds.has(
                        execution.execution_id,
                      )}
                      onSelect={bulkOperations.toggleSelection}
                      showCheckbox={bulkMode}
                    />
                  ))
                )}
              </LogListSection>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          )}
        </InsightsInnerNarrow>
      </InsightsScrollShell>
    </>
  );
}
LogPage.propTypes = {
  apiClient: PropTypes.shape({
    listExecutions: PropTypes.func,
    cancelExecution: PropTypes.func,
    getExecutionLogs: PropTypes.func,
    downloadExecutionLogs: PropTypes.func,
  }),
};
export { LogPage as default };
