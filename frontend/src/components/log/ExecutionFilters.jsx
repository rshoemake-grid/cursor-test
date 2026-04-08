import PropTypes from "prop-types";
import { Filter } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import {
  LogFiltersCard,
  LogFiltersHeader,
  LogFiltersTitle,
  LogFiltersClear,
  LogFiltersStack,
  LogFieldLabel,
  LogFiltersGrid,
  LogStatusStack,
  LogCheckboxLabel,
  LogCheckbox,
  LogCheckboxText,
  LogFilterSelect,
} from "../../styles/logComponents.styled";
const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "running",
    label: "Running",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "paused",
    label: "Paused",
  },
];
const SORT_OPTIONS = [
  {
    value: "started_at",
    label: "Start Time",
  },
  {
    value: "completed_at",
    label: "Completion Time",
  },
  {
    value: "duration",
    label: "Duration",
  },
  {
    value: "status",
    label: "Status",
  },
];
function ExecutionFilters({
  filters,
  onFiltersChange,
  availableWorkflows = [],
}) {
  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };
  const toggleStatus = (status) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    updateFilter("status", newStatuses.length > 0 ? newStatuses : void 0);
  };
  const clearFilters = () => {
    onFiltersChange({
      searchQuery: filters.searchQuery,
      // Keep search query
    });
  };
  const hasActiveFilters = Boolean(
    filters.status?.length || filters.workflowId,
  );
  return (
    <LogFiltersCard>
      <LogFiltersHeader>
        <Filter aria-hidden />
        <LogFiltersTitle>Filters</LogFiltersTitle>
        {hasActiveFilters && (
          <LogFiltersClear type="button" onClick={clearFilters}>
            Clear Filters
          </LogFiltersClear>
        )}
      </LogFiltersHeader>
      <LogFiltersStack>
        <div>
          <LogFieldLabel>Search</LogFieldLabel>
          <SearchBar
            value={filters.searchQuery || ""}
            placeholder="Search by execution ID, workflow ID, or error message..."
            onChange={(value) => updateFilter("searchQuery", value || void 0)}
          />
        </div>
        <LogFiltersGrid>
          <div>
            <LogFieldLabel>Status</LogFieldLabel>
            <LogStatusStack>
              {STATUS_OPTIONS.map((option) => (
                <LogCheckboxLabel key={option.value}>
                  <LogCheckbox
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={() => toggleStatus(option.value)}
                  />
                  <LogCheckboxText>{option.label}</LogCheckboxText>
                </LogCheckboxLabel>
              ))}
            </LogStatusStack>
          </div>
          {availableWorkflows.length > 0 && (
            <div>
              <LogFieldLabel htmlFor="workflow-select">Workflow</LogFieldLabel>
              <LogFilterSelect
                id="workflow-select"
                value={filters.workflowId || ""}
                onChange={(e) =>
                  updateFilter("workflowId", e.target.value || void 0)
                }
              >
                <option value="">All Workflows</option>
                {availableWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </LogFilterSelect>
            </div>
          )}
          <div>
            <LogFieldLabel htmlFor="sort-by-select">Sort By</LogFieldLabel>
            <LogFilterSelect
              id="sort-by-select"
              value={filters.sortBy || "started_at"}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LogFilterSelect>
          </div>
          <div>
            <LogFieldLabel htmlFor="sort-order-select">Order</LogFieldLabel>
            <LogFilterSelect
              id="sort-order-select"
              value={filters.sortOrder || "desc"}
              onChange={(e) => updateFilter("sortOrder", e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </LogFilterSelect>
          </div>
        </LogFiltersGrid>
      </LogFiltersStack>
    </LogFiltersCard>
  );
}

ExecutionFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  availableWorkflows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
};

export { ExecutionFilters as default };
