import { Filter } from "lucide-react";
import SearchBar from "../ui/SearchBar";
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-primary-600 hover:text-primary-700"
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <SearchBar
            value={filters.searchQuery || ""}
            placeholder="Search by execution ID, workflow ID, or error message..."
            onChange={(value) => updateFilter("searchQuery", value || void 0)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={() => toggleStatus(option.value)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          {availableWorkflows.length > 0 && (
            <div>
              <label
                htmlFor="workflow-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Workflow
              </label>
              <select
                id="workflow-select"
                value={filters.workflowId || ""}
                onChange={(e) =>
                  updateFilter("workflowId", e.target.value || void 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Workflows</option>
                {availableWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              htmlFor="sort-by-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Sort By
            </label>
            <select
              id="sort-by-select"
              value={filters.sortBy || "started_at"}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sort-order-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Order
            </label>
            <select
              id="sort-order-select"
              value={filters.sortOrder || "desc"}
              onChange={(e) => updateFilter("sortOrder", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
export { ExecutionFilters as default };
