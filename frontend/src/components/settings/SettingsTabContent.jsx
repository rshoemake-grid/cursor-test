import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ProviderForm } from "./ProviderForm";
import { WorkflowSettingsTab } from "./WorkflowSettingsTab";
import { AddProviderForm } from "./AddProviderForm";
import { AutoSyncIndicator } from "./AutoSyncIndicator";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
function settingsSignInNotice() {
  return /* @__PURE__ */ jsxs("div", {
    className: "rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950",
    children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Sign in required" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-700", children: [
        "LLM provider settings and API keys are only loaded from your account when you are signed in. ",
        "Cached values are not shown here while logged out."
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/auth",
          className: "mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800 underline",
          children: "Go to sign in"
        }
      )
    ]
  });
}
function SettingsTabContent({
  isAuthenticated = true,
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
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      isAuthenticated === false && settingsSignInNotice(),
      /* @__PURE__ */ jsx(
        WorkflowSettingsTab,
        {
          readOnly: isAuthenticated === false,
          iterationLimit,
          onIterationLimitChange,
          defaultModel,
          onDefaultModelChange,
          providers
        }
      )
    ] });
  }
  if (activeTab === SETTINGS_TABS.LLM) {
    if (isAuthenticated === false) {
      return settingsSignInNotice();
    }
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
