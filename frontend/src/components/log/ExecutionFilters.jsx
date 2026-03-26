import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Execution Filters Component
 * SOLID: Single Responsibility - only handles filter UI
 * DRY: Reusable filter component
 * DIP: Depends on props abstraction
 */ import { Filter } from 'lucide-react';
import SearchBar from '../ui/SearchBar';
const STATUS_OPTIONS = [
    {
        value: 'pending',
        label: 'Pending'
    },
    {
        value: 'running',
        label: 'Running'
    },
    {
        value: 'completed',
        label: 'Completed'
    },
    {
        value: 'failed',
        label: 'Failed'
    },
    {
        value: 'paused',
        label: 'Paused'
    }
];
const SORT_OPTIONS = [
    {
        value: 'started_at',
        label: 'Start Time'
    },
    {
        value: 'completed_at',
        label: 'Completion Time'
    },
    {
        value: 'duration',
        label: 'Duration'
    },
    {
        value: 'status',
        label: 'Status'
    }
];
/**
 * Execution Filters Component
 * Provides filtering and sorting controls for executions
 */ export default function ExecutionFilters({ filters, onFiltersChange, availableWorkflows = [] }) {
    const updateFilter = (key, value)=>{
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };
    const toggleStatus = (status)=>{
        const currentStatuses = filters.status || [];
        const newStatuses = currentStatuses.includes(status) ? currentStatuses.filter((s)=>s !== status) : [
            ...currentStatuses,
            status
        ];
        updateFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
    };
    const clearFilters = ()=>{
        onFiltersChange({
            searchQuery: filters.searchQuery
        });
    };
    const hasActiveFilters = Boolean(filters.status?.length || filters.workflowId);
    return /*#__PURE__*/ _jsxs("div", {
        className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2 mb-4",
                children: [
                    /*#__PURE__*/ _jsx(Filter, {
                        className: "w-5 h-5 text-gray-500"
                    }),
                    /*#__PURE__*/ _jsx("h2", {
                        className: "text-lg font-semibold text-gray-900",
                        children: "Filters"
                    }),
                    hasActiveFilters && /*#__PURE__*/ _jsx("button", {
                        onClick: clearFilters,
                        className: "ml-auto text-sm text-primary-600 hover:text-primary-700",
                        children: "Clear Filters"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Search"
                            }),
                            /*#__PURE__*/ _jsx(SearchBar, {
                                value: filters.searchQuery || '',
                                placeholder: "Search by execution ID, workflow ID, or error message...",
                                onChange: (value)=>updateFilter('searchQuery', value || undefined)
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("label", {
                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                        children: "Status"
                                    }),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "space-y-2",
                                        children: STATUS_OPTIONS.map((option)=>/*#__PURE__*/ _jsxs("label", {
                                                className: "flex items-center gap-2 cursor-pointer",
                                                children: [
                                                    /*#__PURE__*/ _jsx("input", {
                                                        type: "checkbox",
                                                        checked: filters.status?.includes(option.value) || false,
                                                        onChange: ()=>toggleStatus(option.value),
                                                        className: "rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "text-sm text-gray-700",
                                                        children: option.label
                                                    })
                                                ]
                                            }, option.value))
                                    })
                                ]
                            }),
                            availableWorkflows.length > 0 && /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("label", {
                                        htmlFor: "workflow-select",
                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                        children: "Workflow"
                                    }),
                                    /*#__PURE__*/ _jsxs("select", {
                                        id: "workflow-select",
                                        value: filters.workflowId || '',
                                        onChange: (e)=>updateFilter('workflowId', e.target.value || undefined),
                                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                        children: [
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "",
                                                children: "All Workflows"
                                            }),
                                            availableWorkflows.map((workflow)=>/*#__PURE__*/ _jsx("option", {
                                                    value: workflow.id,
                                                    children: workflow.name
                                                }, workflow.id))
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("label", {
                                        htmlFor: "sort-by-select",
                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                        children: "Sort By"
                                    }),
                                    /*#__PURE__*/ _jsx("select", {
                                        id: "sort-by-select",
                                        value: filters.sortBy || 'started_at',
                                        onChange: (e)=>updateFilter('sortBy', e.target.value),
                                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                        children: SORT_OPTIONS.map((option)=>/*#__PURE__*/ _jsx("option", {
                                                value: option.value,
                                                children: option.label
                                            }, option.value))
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("label", {
                                        htmlFor: "sort-order-select",
                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                        children: "Order"
                                    }),
                                    /*#__PURE__*/ _jsxs("select", {
                                        id: "sort-order-select",
                                        value: filters.sortOrder || 'desc',
                                        onChange: (e)=>updateFilter('sortOrder', e.target.value),
                                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                        children: [
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "desc",
                                                children: "Descending"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "asc",
                                                children: "Ascending"
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
