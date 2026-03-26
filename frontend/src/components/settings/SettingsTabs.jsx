import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings Tabs Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles tab navigation
 */ import { SettingsTabButton } from './SettingsTabButton';
import { SETTINGS_TABS } from '../../constants/settingsConstants';
/**
 * Settings Tabs Component
 * DRY: Centralized tab navigation
 */ export function SettingsTabs({ activeTab, onTabChange }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex flex-col gap-2 min-w-[170px]",
        children: [
            /*#__PURE__*/ _jsx(SettingsTabButton, {
                label: "LLM Providers",
                isActive: activeTab === SETTINGS_TABS.LLM,
                onClick: ()=>onTabChange(SETTINGS_TABS.LLM)
            }),
            /*#__PURE__*/ _jsx(SettingsTabButton, {
                label: "Workflow Generation",
                isActive: activeTab === SETTINGS_TABS.WORKFLOW,
                onClick: ()=>onTabChange(SETTINGS_TABS.WORKFLOW)
            })
        ]
    });
}
