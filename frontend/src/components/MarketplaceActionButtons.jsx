import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Marketplace Action Buttons Component
 * Single Responsibility: Only renders action buttons for marketplace selections
 * DRY: Reusable component for workflow and agent action buttons
 */ import { Download, Trash2 } from 'lucide-react';
export function MarketplaceActionButtons({ selectedCount, hasOfficial, onLoad, onDelete, onUse, type, showDelete = true }) {
    if (selectedCount === 0) {
        return null;
    }
    const typeLabel = type === 'workflow' ? 'Workflow' : type === 'tool' ? 'Tool' : 'Agent';
    const typeLabelPlural = type === 'workflow' ? 'Workflows' : type === 'tool' ? 'Tools' : 'Agents';
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            onLoad && /*#__PURE__*/ _jsxs("button", {
                onClick: onLoad,
                className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx(Download, {
                        className: "w-4 h-4"
                    }),
                    "Load ",
                    selectedCount,
                    " ",
                    typeLabel,
                    selectedCount > 1 ? 's' : ''
                ]
            }),
            onUse && /*#__PURE__*/ _jsxs("button", {
                onClick: onUse,
                className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx(Download, {
                        className: "w-4 h-4"
                    }),
                    "Use ",
                    selectedCount,
                    " ",
                    typeLabel,
                    selectedCount > 1 ? 's' : ''
                ]
            }),
            showDelete && !hasOfficial && onDelete && /*#__PURE__*/ _jsxs("button", {
                onClick: onDelete,
                className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx(Trash2, {
                        className: "w-4 h-4"
                    }),
                    "Delete ",
                    selectedCount,
                    " ",
                    typeLabelPlural
                ]
            })
        ]
    });
}
