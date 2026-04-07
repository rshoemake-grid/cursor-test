import { Link } from "react-router-dom";
import { ProviderForm } from "./ProviderForm";
import { WorkflowSettingsTab } from "./WorkflowSettingsTab";
import { AddProviderForm } from "./AddProviderForm";
import { AutoSyncIndicator } from "./AutoSyncIndicator";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
import {
  SettingsSectionStack,
  SettingsSignInNotice,
  SettingsSignInTitle,
  SettingsSignInBody,
  SettingsSignInLink,
} from "../../styles/settings.styled";
function settingsSignInNotice() {
  return (
    <SettingsSignInNotice>
      <SettingsSignInTitle>Sign in required</SettingsSignInTitle>
      <SettingsSignInBody>
        LLM provider settings and API keys are only loaded from your account
        when you are signed in. Cached values are not shown here while logged
        out.
      </SettingsSignInBody>
      <SettingsSignInLink as={Link} to="/auth">
        Go to sign in
      </SettingsSignInLink>
    </SettingsSignInNotice>
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
      <SettingsSectionStack>
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
      </SettingsSectionStack>
    );
  }
  if (activeTab === SETTINGS_TABS.LLM) {
    if (isAuthenticated === false) {
      return settingsSignInNotice();
    }
    return (
      <SettingsSectionStack>
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
      </SettingsSectionStack>
    );
  }
  return null;
}
export { SettingsTabContent };
