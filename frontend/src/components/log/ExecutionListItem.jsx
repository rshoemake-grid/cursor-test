import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Execution List Item Component
 * SOLID: Single Responsibility - only renders a single execution item
 * DRY: Uses extracted utility functions
 * DIP: Depends on abstractions (props) not concrete implementations
 */ import { Clock, CheckCircle, Eye } from 'lucide-react';
import ExecutionStatusBadge from '../ExecutionStatusBadge';
import { getExecutionStatusIcon, formatExecutionDuration, calculateExecutionProgress } from '../../utils/executionFormat';
/**
 * Execution List Item Component
 * Renders a single execution in the log list
 */ export default function ExecutionListItem({ execution, onExecutionClick, isSelected = false, onSelect, showCheckbox = false }) {
    const isActive = execution.status === 'running' || execution.status === 'pending';
    const progress = calculateExecutionProgress(execution.node_states);
    const handleCheckboxChange = (e)=>{
        e.stopPropagation();
        onSelect?.(execution.execution_id);
    };
    const handleCheckboxClick = (e)=>{
        e.stopPropagation();
    };
    const handleItemClick = ()=>{
        if (!showCheckbox) {
            onExecutionClick(execution.execution_id);
        }
    };
    return /*#__PURE__*/ _jsx("div", {
        onClick: handleItemClick,
        className: `
        bg-white rounded-lg shadow-sm border p-4 transition-all cursor-pointer
        ${isSelected ? 'border-primary-500 bg-primary-50' : ''}
        ${isActive && !isSelected ? 'border-blue-500 hover:border-blue-400' : ''}
        ${!isActive && !isSelected ? 'border-gray-200 hover:border-gray-300' : ''}
        hover:shadow-md
      `,
        children: /*#__PURE__*/ _jsxs("div", {
            className: "flex items-start justify-between gap-4",
            children: [
                showCheckbox && /*#__PURE__*/ _jsx("div", {
                    className: "flex-shrink-0 pt-1",
                    children: /*#__PURE__*/ _jsx("input", {
                        type: "checkbox",
                        checked: isSelected,
                        onChange: handleCheckboxChange,
                        onClick: handleCheckboxClick,
                        className: "w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500",
                        "aria-label": `Select execution ${execution.execution_id}`
                    })
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "flex-1 min-w-0",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: [
                                getExecutionStatusIcon(execution.status),
                                /*#__PURE__*/ _jsxs("span", {
                                    className: "font-mono text-sm text-gray-700",
                                    children: [
                                        execution.execution_id.slice(0, 8),
                                        "..."
                                    ]
                                }),
                                /*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                                    status: execution.status,
                                    variant: "light"
                                }),
                                /*#__PURE__*/ _jsxs("span", {
                                    className: "text-xs text-gray-500",
                                    children: [
                                        "Workflow: ",
                                        execution.workflow_id.slice(0, 8),
                                        "..."
                                    ]
                                })
                            ]
                        }),
                        execution.current_node && /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: [
                                /*#__PURE__*/ _jsx("span", {
                                    className: "text-xs text-gray-500",
                                    children: "Current Node:"
                                }),
                                /*#__PURE__*/ _jsx("span", {
                                    className: "text-sm font-medium text-gray-700",
                                    children: execution.current_node
                                })
                            ]
                        }),
                        execution.status === 'running' && execution.node_states && /*#__PURE__*/ _jsx("div", {
                            className: "mb-2",
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-2 text-xs text-gray-500",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: "Progress:"
                                    }),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden max-w-xs",
                                        children: /*#__PURE__*/ _jsx("div", {
                                            className: "bg-blue-500 h-full transition-all duration-300",
                                            style: {
                                                width: `${progress}%`
                                            }
                                        })
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex flex-wrap items-center gap-3 text-xs text-gray-500",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center gap-1",
                                    children: [
                                        /*#__PURE__*/ _jsx(Clock, {
                                            className: "w-3 h-3 flex-shrink-0"
                                        }),
                                        /*#__PURE__*/ _jsxs("span", {
                                            className: "whitespace-nowrap",
                                            children: [
                                                "Started: ",
                                                new Date(execution.started_at).toLocaleString()
                                            ]
                                        })
                                    ]
                                }),
                                execution.completed_at && /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center gap-1",
                                    children: [
                                        /*#__PURE__*/ _jsx(CheckCircle, {
                                            className: "w-3 h-3 flex-shrink-0"
                                        }),
                                        /*#__PURE__*/ _jsxs("span", {
                                            className: "whitespace-nowrap",
                                            children: [
                                                "Completed: ",
                                                new Date(execution.completed_at).toLocaleString()
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "text-gray-600 whitespace-nowrap",
                                    children: [
                                        "Duration: ",
                                        formatExecutionDuration(execution.started_at, execution.completed_at)
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsx("div", {
                    className: "flex flex-col items-end gap-2 flex-shrink-0",
                    children: /*#__PURE__*/ _jsxs("button", {
                        onClick: (e)=>{
                            e.stopPropagation();
                            onExecutionClick(execution.execution_id);
                        },
                        className: "px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ _jsx(Eye, {
                                className: "w-4 h-4"
                            }),
                            "View"
                        ]
                    })
                })
            ]
        })
    });
}
