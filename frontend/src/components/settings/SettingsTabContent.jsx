import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings Tab Content Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles tab content rendering
 */ import { ProviderForm } from './ProviderForm';
import { WorkflowSettingsTab } from './WorkflowSettingsTab';
import { AddProviderForm } from './AddProviderForm';
import { AutoSyncIndicator } from './AutoSyncIndicator';
import { SETTINGS_TABS } from '../../constants/settingsConstants';
/**
 * Settings Tab Content Component
 * DRY: Centralized tab content rendering
 */ export function SettingsTabContent({ activeTab, iterationLimit, onIterationLimitChange, defaultModel, onDefaultModelChange, providers, showAddProvider, onShowAddProvider, selectedTemplate, onSelectedTemplateChange, onAddProvider, showApiKeys, expandedProviders, expandedModels, testingProvider, testResults, onToggleProviderModels, onToggleApiKeyVisibility, onUpdateProvider, onDeleteProvider, onAddCustomModel, onTestProvider, onToggleModel, isModelExpanded }) {
    if (activeTab === SETTINGS_TABS.WORKFLOW) {
        return /*#__PURE__*/ _jsx(WorkflowSettingsTab, {
            iterationLimit: iterationLimit,
            onIterationLimitChange: onIterationLimitChange,
            defaultModel: defaultModel,
            onDefaultModelChange: onDefaultModelChange,
            providers: providers
        });
    }
    if (activeTab === SETTINGS_TABS.LLM) {
        return /*#__PURE__*/ _jsxs("div", {
            className: "space-y-6",
            children: [
                /*#__PURE__*/ _jsx(AddProviderForm, {
                    showAddProvider: showAddProvider,
                    onShowAddProvider: onShowAddProvider,
                    selectedTemplate: selectedTemplate,
                    onSelectedTemplateChange: onSelectedTemplateChange,
                    onAddProvider: onAddProvider
                }),
                providers.map((provider)=>/*#__PURE__*/ _jsx(ProviderForm, {
                        provider: provider,
                        showApiKeys: showApiKeys,
                        expandedProviders: expandedProviders,
                        expandedModels: expandedModels,
                        testingProvider: testingProvider,
                        testResults: testResults,
                        onToggleProviderModels: onToggleProviderModels,
                        onToggleApiKeyVisibility: onToggleApiKeyVisibility,
                        onUpdateProvider: onUpdateProvider,
                        onDeleteProvider: onDeleteProvider,
                        onAddCustomModel: onAddCustomModel,
                        onTestProvider: onTestProvider,
                        onToggleModel: onToggleModel,
                        isModelExpanded: isModelExpanded
                    }, provider.id)),
                /*#__PURE__*/ _jsx(AutoSyncIndicator, {})
            ]
        });
    }
    return null;
}
