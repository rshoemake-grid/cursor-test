import { jsx, jsxs } from "react/jsx-runtime";
import { ProviderForm } from "./ProviderForm";
import { WorkflowSettingsTab } from "./WorkflowSettingsTab";
import { AddProviderForm } from "./AddProviderForm";
import { AutoSyncIndicator } from "./AutoSyncIndicator";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
function SettingsTabContent({
  activeTab,
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  providers,
  showAddProvider,
  onShowAddProvider,
  selectedTemplate,
  onSelectedTemplateChange,
  onAddProvider,
  showApiKeys,
  expandedProviders,
  expandedModels,
  testingProvider,
  testResults,
  onToggleProviderModels,
  onToggleApiKeyVisibility,
  onUpdateProvider,
  onDeleteProvider,
  onAddCustomModel,
  onTestProvider,
  onToggleModel,
  isModelExpanded
}) {
  if (activeTab === SETTINGS_TABS.WORKFLOW) {
    return /* @__PURE__ */ jsx(
      WorkflowSettingsTab,
      {
        iterationLimit,
        onIterationLimitChange,
        defaultModel,
        onDefaultModelChange,
        providers
      }
    );
  }
  if (activeTab === SETTINGS_TABS.LLM) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(
        AddProviderForm,
        {
          showAddProvider,
          onShowAddProvider,
          selectedTemplate,
          onSelectedTemplateChange,
          onAddProvider
        }
      ),
      providers.map((provider) => /* @__PURE__ */ jsx(
        ProviderForm,
        {
          provider,
          showApiKeys,
          expandedProviders,
          expandedModels,
          testingProvider,
          testResults,
          onToggleProviderModels,
          onToggleApiKeyVisibility,
          onUpdateProvider,
          onDeleteProvider,
          onAddCustomModel,
          onTestProvider,
          onToggleModel,
          isModelExpanded
        },
        provider.id
      )),
      /* @__PURE__ */ jsx(AutoSyncIndicator, {})
    ] });
  }
  return null;
}
export {
  SettingsTabContent
};
