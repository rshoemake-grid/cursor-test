/**
 * Marketplace Tab Button Component
 * Extracted from MarketplacePage to improve DRY compliance
 * Single Responsibility: Only renders a tab button
 */ import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Marketplace Tab Button Component
 * DRY: Reusable tab button for all marketplace tabs
 */ export function MarketplaceTabButton({ label, icon: Icon, isActive, onClick, iconSize = 'w-5 h-5' }) {
    return /*#__PURE__*/ _jsxs("button", {
        onClick: onClick,
        className: `px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-gray-900'}`,
        children: [
            /*#__PURE__*/ _jsx(Icon, {
                className: iconSize
            }),
            label
        ]
    });
}
