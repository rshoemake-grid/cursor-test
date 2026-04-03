import { Link } from "react-router-dom";
import { ProviderForm } from "./ProviderForm";
import { WorkflowSettingsTab } from "./WorkflowSettingsTab";
import { AddProviderForm } from "./AddProviderForm";
import { AutoSyncIndicator } from "./AutoSyncIndicator";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
function settingsSignInNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <p className="font-semibold text-gray-900">Sign in required</p>
      <p className="mt-2 text-sm text-gray-700">
        LLM provider settings and API keys are only loaded from your account
        when you are signed in. Cached values are not shown here while logged
        out.
      </p>
      <Link
        to="/auth"
        className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800 underline"
      >
        Go to sign in
      </Link>
    </div>
  );
}
function SettingsTabContent({
  isAuthenticated = true,
  activeTab,
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  chatAssistantModel,
  onChatAssistantModelChange,
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
  isModelExpanded,
}) {
  if (activeTab === SETTINGS_TABS.WORKFLOW) {
    return (
      <div className="space-y-6">
        {isAuthenticated === false && settingsSignInNotice()}
        <WorkflowSettingsTab
          readOnly={isAuthenticated === false}
          iterationLimit={iterationLimit}
          onIterationLimitChange={onIterationLimitChange}
          defaultModel={defaultModel}
          onDefaultModelChange={onDefaultModelChange}
          chatAssistantModel={chatAssistantModel}
          onChatAssistantModelChange={onChatAssistantModelChange}
          providers={providers}
        />
      </div>
    );
  }
  if (activeTab === SETTINGS_TABS.LLM) {
    if (isAuthenticated === false) {
      return settingsSignInNotice();
    }
    return (
      <div className="space-y-6">
        <AddProviderForm
          showAddProvider={showAddProvider}
          onShowAddProvider={onShowAddProvider}
          selectedTemplate={selectedTemplate}
          onSelectedTemplateChange={onSelectedTemplateChange}
          onAddProvider={onAddProvider}
        />
        {providers.map((provider) => (
          <ProviderForm
            key={provider.id}
            provider={provider}
            showApiKeys={showApiKeys}
            expandedProviders={expandedProviders}
            expandedModels={expandedModels}
            testingProvider={testingProvider}
            testResults={testResults}
            onToggleProviderModels={onToggleProviderModels}
            onToggleApiKeyVisibility={onToggleApiKeyVisibility}
            onUpdateProvider={onUpdateProvider}
            onDeleteProvider={onDeleteProvider}
            onAddCustomModel={onAddCustomModel}
            onTestProvider={onTestProvider}
            onToggleModel={onToggleModel}
            isModelExpanded={isModelExpanded}
          />
        ))}
        <AutoSyncIndicator />
      </div>
    );
  }
  return null;
}
export { SettingsTabContent };
