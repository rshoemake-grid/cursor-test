import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Advanced Filters Panel Component
 * SOLID: Single Responsibility - only handles advanced filter UI
 * DRY: Reusable filter panel component
 * DIP: Depends on abstractions
 */ import { useCallback } from 'react';
import { X } from 'lucide-react';
/**
 * Advanced Filters Panel Component
 * Provides advanced filtering options for executions
 */ export default function AdvancedFiltersPanel({ filters, onFiltersChange, onClose, availableWorkflows = [] }) {
    const updateFilter = useCallback((key, value)=>{
        onFiltersChange({
            ...filters,
            [key]: value
        });
    }, [
        filters,
        onFiltersChange
    ]);
    const clearFilter = useCallback((key)=>{
        const newFilters = {
            ...filters
        };
        delete newFilters[key];
        onFiltersChange(newFilters);
    }, [
        filters,
        onFiltersChange
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        className: "bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ _jsx("h3", {
                        className: "text-lg font-semibold text-gray-900",
                        children: "Advanced Filters"
                    }),
                    onClose && /*#__PURE__*/ _jsx("button", {
                        onClick: onClose,
                        className: "p-1 hover:bg-gray-100 rounded transition-colors",
                        "aria-label": "Close filters",
                        children: /*#__PURE__*/ _jsx(X, {
                            className: "w-4 h-4"
                        })
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
                                children: "Date Range"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                htmlFor: "start-date",
                                                className: "text-xs text-gray-500 mb-1 block",
                                                children: "Start Date"
                                            }),
                                            /*#__PURE__*/ _jsx("input", {
                                                id: "start-date",
                                                type: "date",
                                                value: filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : '',
                                                onChange: (e)=>{
                                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                                    updateFilter('dateRange', {
                                                        ...filters.dateRange,
                                                        start: date
                                                    });
                                                },
                                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                htmlFor: "end-date",
                                                className: "text-xs text-gray-500 mb-1 block",
                                                children: "End Date"
                                            }),
                                            /*#__PURE__*/ _jsx("input", {
                                                id: "end-date",
                                                type: "date",
                                                value: filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : '',
                                                onChange: (e)=>{
                                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                                    updateFilter('dateRange', {
                                                        ...filters.dateRange,
                                                        end: date
                                                    });
                                                },
                                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            })
                                        ]
                                    })
                                ]
                            }),
                            (filters.dateRange?.start || filters.dateRange?.end) && /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>clearFilter('dateRange'),
                                className: "mt-1 text-xs text-primary-600 hover:text-primary-700",
                                children: "Clear date range"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Duration (seconds)"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-xs text-gray-500 mb-1 block",
                                                children: "Min"
                                            }),
                                            /*#__PURE__*/ _jsx("input", {
                                                type: "number",
                                                value: filters.minDuration ?? '',
                                                onChange: (e)=>{
                                                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                                    updateFilter('minDuration', value);
                                                },
                                                placeholder: "Min",
                                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-xs text-gray-500 mb-1 block",
                                                children: "Max"
                                            }),
                                            /*#__PURE__*/ _jsx("input", {
                                                type: "number",
                                                value: filters.maxDuration ?? '',
                                                onChange: (e)=>{
                                                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                                    updateFilter('maxDuration', value);
                                                },
                                                placeholder: "Max",
                                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            })
                                        ]
                                    })
                                ]
                            }),
                            (filters.minDuration !== undefined || filters.maxDuration !== undefined) && /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>{
                                    clearFilter('minDuration');
                                    clearFilter('maxDuration');
                                },
                                className: "mt-1 text-xs text-primary-600 hover:text-primary-700",
                                children: "Clear duration"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Error Status"
                            }),
                            /*#__PURE__*/ _jsxs("select", {
                                value: filters.hasError === undefined ? 'all' : filters.hasError ? 'with-error' : 'no-error',
                                onChange: (e)=>{
                                    const value = e.target.value === 'all' ? undefined : e.target.value === 'with-error' ? true : false;
                                    updateFilter('hasError', value);
                                },
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                children: [
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "all",
                                        children: "All"
                                    }),
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "with-error",
                                        children: "With Errors"
                                    }),
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "no-error",
                                        children: "No Errors"
                                    })
                                ]
                            })
                        ]
                    }),
                    availableWorkflows.length > 0 && /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Workflows"
                            }),
                            /*#__PURE__*/ _jsx("select", {
                                multiple: true,
                                value: filters.workflowIds || [],
                                onChange: (e)=>{
                                    const selected = Array.from(e.target.selectedOptions, (option)=>option.value);
                                    updateFilter('workflowIds', selected.length > 0 ? selected : undefined);
                                },
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                size: Math.min(availableWorkflows.length, 5),
                                children: availableWorkflows.map((workflow)=>/*#__PURE__*/ _jsxs("option", {
                                        value: workflow.id,
                                        children: [
                                            workflow.name || workflow.id.slice(0, 8),
                                            "..."
                                        ]
                                    }, workflow.id))
                            }),
                            filters.workflowIds && filters.workflowIds.length > 0 && /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>clearFilter('workflowIds'),
                                className: "mt-1 text-xs text-primary-600 hover:text-primary-700",
                                children: "Clear workflows"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
