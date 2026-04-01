import { jsx, jsxs } from "react/jsx-runtime";
import { Filter } from "lucide-react";
import SearchBar from "../ui/SearchBar";
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "paused", label: "Paused" }
];
const SORT_OPTIONS = [
  { value: "started_at", label: "Start Time" },
  { value: "completed_at", label: "Completion Time" },
  { value: "duration", label: "Duration" },
  { value: "status", label: "Status" }
];
function ExecutionFilters({
  filters,
  onFiltersChange,
  availableWorkflows = []
}) {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };
  const toggleStatus = (status) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status) ? currentStatuses.filter((s) => s !== status) : [...currentStatuses, status];
    updateFilter("status", newStatuses.length > 0 ? newStatuses : void 0);
  };
  const clearFilters = () => {
    onFiltersChange({
      searchQuery: filters.searchQuery
      // Keep search query
    });
  };
  const hasActiveFilters = Boolean(
    filters.status?.length || filters.workflowId
  );
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Filter, { className: "w-5 h-5 text-gray-500" }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Filters" }),
      hasActiveFilters && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: clearFilters,
          className: "ml-auto text-sm text-primary-600 hover:text-primary-700",
          children: "Clear Filters"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search" }),
        /* @__PURE__ */ jsx(
          SearchBar,
          {
            value: filters.searchQuery || "",
            placeholder: "Search by execution ID, workflow ID, or error message...",
            onChange: (value) => updateFilter("searchQuery", value || void 0)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: STATUS_OPTIONS.map((option) => /* @__PURE__ */ jsxs(
            "label",
            {
              className: "flex items-center gap-2 cursor-pointer",
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: filters.status?.includes(option.value) || false,
                    onChange: () => toggleStatus(option.value),
                    className: "rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700", children: option.label })
              ]
            },
            option.value
          )) })
        ] }),
        availableWorkflows.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "workflow-select", className: "block text-sm font-medium text-gray-700 mb-2", children: "Workflow" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "workflow-select",
              value: filters.workflowId || "",
              onChange: (e) => updateFilter("workflowId", e.target.value || void 0),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "All Workflows" }),
                availableWorkflows.map((workflow) => /* @__PURE__ */ jsx("option", { value: workflow.id, children: workflow.name }, workflow.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "sort-by-select", className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort By" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              id: "sort-by-select",
              value: filters.sortBy || "started_at",
              onChange: (e) => updateFilter("sortBy", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "sort-order-select", className: "block text-sm font-medium text-gray-700 mb-2", children: "Order" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "sort-order-select",
              value: filters.sortOrder || "desc",
              onChange: (e) => updateFilter("sortOrder", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              children: [
                /* @__PURE__ */ jsx("option", { value: "desc", children: "Descending" }),
                /* @__PURE__ */ jsx("option", { value: "asc", children: "Ascending" })
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  ExecutionFilters as default
};
