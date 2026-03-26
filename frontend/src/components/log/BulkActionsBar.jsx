import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Bulk Actions Bar Component
 * SOLID: Single Responsibility - only handles bulk action UI
 * DRY: Reusable bulk actions component
 * DIP: Depends on abstractions
 */ import { Trash2, X } from 'lucide-react';
/**
 * Bulk Actions Bar Component
 * Displays actions for selected executions
 */ export default function BulkActionsBar({ selectedCount, onDelete, onClearSelection, isDeleting = false }) {
    if (selectedCount === 0) {
        return null;
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "bg-primary-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between mb-4",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "flex items-center gap-3",
                children: /*#__PURE__*/ _jsxs("span", {
                    className: "font-medium",
                    children: [
                        selectedCount,
                        " execution",
                        selectedCount !== 1 ? 's' : '',
                        " selected"
                    ]
                })
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsxs("button", {
                        onClick: onDelete,
                        disabled: isDeleting,
                        className: "px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                        children: [
                            /*#__PURE__*/ _jsx(Trash2, {
                                className: "w-4 h-4"
                            }),
                            isDeleting ? 'Deleting...' : 'Delete'
                        ]
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onClearSelection,
                        className: "p-2 hover:bg-primary-700 rounded-lg transition-colors",
                        "aria-label": "Clear selection",
                        children: /*#__PURE__*/ _jsx(X, {
                            className: "w-4 h-4"
                        })
                    })
                ]
            })
        ]
    });
}
