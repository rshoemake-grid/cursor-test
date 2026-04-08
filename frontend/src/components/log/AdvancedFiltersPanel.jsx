import { useCallback } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import {
  LogFieldLabel,
  LogFilterSelect,
  LogAdvPanelRoot,
  LogAdvPanelHeader,
  LogAdvPanelTitle,
  LogAdvPanelCloseBtn,
  LogAdvPanelStack,
  LogAdvTwoColGrid,
  LogAdvSubLabel,
  LogAdvControlInput,
  LogAdvClearLink,
} from "../../styles/logComponents.styled";

function AdvancedFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
  availableWorkflows = [],
}) {
  const updateFilter = useCallback(
    (key, value) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange],
  );
  const clearFilter = useCallback(
    (key) => {
      const newFilters = {
        ...filters,
      };
      delete newFilters[key];
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange],
  );
  return (
    <LogAdvPanelRoot>
      <LogAdvPanelHeader>
        <LogAdvPanelTitle>Advanced Filters</LogAdvPanelTitle>
        {onClose && (
          <LogAdvPanelCloseBtn
            type="button"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X aria-hidden />
          </LogAdvPanelCloseBtn>
        )}
      </LogAdvPanelHeader>
      <LogAdvPanelStack>
        <div>
          <LogFieldLabel>Date Range</LogFieldLabel>
          <LogAdvTwoColGrid>
            <div>
              <LogAdvSubLabel htmlFor="start-date">Start Date</LogAdvSubLabel>
              <LogAdvControlInput
                id="start-date"
                type="date"
                value={
                  filters.dateRange?.start
                    ? filters.dateRange.start.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : void 0;
                  updateFilter("dateRange", {
                    ...filters.dateRange,
                    start: date,
                  });
                }}
              />
            </div>
            <div>
              <LogAdvSubLabel htmlFor="end-date">End Date</LogAdvSubLabel>
              <LogAdvControlInput
                id="end-date"
                type="date"
                value={
                  filters.dateRange?.end
                    ? filters.dateRange.end.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : void 0;
                  updateFilter("dateRange", {
                    ...filters.dateRange,
                    end: date,
                  });
                }}
              />
            </div>
          </LogAdvTwoColGrid>
          {(filters.dateRange?.start || filters.dateRange?.end) && (
            <LogAdvClearLink
              type="button"
              onClick={() => clearFilter("dateRange")}
            >
              Clear date range
            </LogAdvClearLink>
          )}
        </div>
        <div>
          <LogFieldLabel>Duration (seconds)</LogFieldLabel>
          <LogAdvTwoColGrid>
            <div>
              <LogAdvSubLabel>Min</LogAdvSubLabel>
              <LogAdvControlInput
                type="number"
                value={filters.minDuration ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value, 10)
                    : void 0;
                  updateFilter("minDuration", value);
                }}
                placeholder="Min"
              />
            </div>
            <div>
              <LogAdvSubLabel>Max</LogAdvSubLabel>
              <LogAdvControlInput
                type="number"
                value={filters.maxDuration ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value, 10)
                    : void 0;
                  updateFilter("maxDuration", value);
                }}
                placeholder="Max"
              />
            </div>
          </LogAdvTwoColGrid>
          {(filters.minDuration !== void 0 ||
            filters.maxDuration !== void 0) && (
            <LogAdvClearLink
              type="button"
              onClick={() => {
                clearFilter("minDuration");
                clearFilter("maxDuration");
              }}
            >
              Clear duration
            </LogAdvClearLink>
          )}
        </div>
        <div>
          <LogFieldLabel>Error Status</LogFieldLabel>
          <LogFilterSelect
            value={
              filters.hasError === void 0
                ? "all"
                : filters.hasError
                  ? "with-error"
                  : "no-error"
            }
            onChange={(e) => {
              const value =
                e.target.value === "all"
                  ? void 0
                  : e.target.value === "with-error"
                    ? true
                    : false;
              updateFilter("hasError", value);
            }}
          >
            <option value="all">All</option>
            <option value="with-error">With Errors</option>
            <option value="no-error">No Errors</option>
          </LogFilterSelect>
        </div>
        {availableWorkflows.length > 0 && (
          <div>
            <LogFieldLabel>Workflows</LogFieldLabel>
            <LogFilterSelect
              multiple={true}
              value={filters.workflowIds || []}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );
                updateFilter(
                  "workflowIds",
                  selected.length > 0 ? selected : void 0,
                );
              }}
              size={Math.min(availableWorkflows.length, 5)}
            >
              {availableWorkflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name || workflow.id.slice(0, 8)}...
                </option>
              ))}
            </LogFilterSelect>
            {filters.workflowIds && filters.workflowIds.length > 0 && (
              <LogAdvClearLink
                type="button"
                onClick={() => clearFilter("workflowIds")}
              >
                Clear workflows
              </LogAdvClearLink>
            )}
          </div>
        )}
      </LogAdvPanelStack>
    </LogAdvPanelRoot>
  );
}

AdvancedFiltersPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  availableWorkflows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
};

export { AdvancedFiltersPanel as default };
