/**
 * Settings Tab Button Component
 * Extracted from SettingsPage to improve DRY compliance
 * Single Responsibility: Only renders a settings tab button
 */ import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Settings Tab Button Component
 * DRY: Reusable tab button for settings tabs
 */ export function SettingsTabButton({ label, isActive, onClick }) {
    return /*#__PURE__*/ _jsx("button", {
        onClick: onClick,
        className: `text-left px-4 py-3 rounded-lg border transition ${isActive ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700'}`,
        children: label
    });
}
