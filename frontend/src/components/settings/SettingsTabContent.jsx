import PropTypes from "prop-types";
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
  shell,
  workflowGeneration,
  providersData,
  addProvider,
  providerManagement,
}) {
  const { isAuthenticated = true, activeTab } = shell;
  const {
    iterationLimit,
    onIterationLimitChange,
    defaultModel,
    onDefaultModelChange,
    chatAssistantModel,
    onChatAssistantModelChange,
  } = workflowGeneration;
  const { list: providers } = providersData;
  const {
    showAddProvider,
    onShowAddProvider,
    selectedTemplate,
    onSelectedTemplateChange,
    onAddProvider,
  } = addProvider;
  const {
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
  } = providerManagement;
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

SettingsTabContent.propTypes = {
  shell: PropTypes.shape({
    isAuthenticated: PropTypes.bool,
    activeTab: PropTypes.string.isRequired,
  }).isRequired,
  workflowGeneration: PropTypes.shape({
    iterationLimit: PropTypes.number.isRequired,
    onIterationLimitChange: PropTypes.func.isRequired,
    defaultModel: PropTypes.string,
    onDefaultModelChange: PropTypes.func.isRequired,
    chatAssistantModel: PropTypes.string,
    onChatAssistantModelChange: PropTypes.func.isRequired,
  }).isRequired,
  providersData: PropTypes.shape({
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  addProvider: PropTypes.shape({
    showAddProvider: PropTypes.bool.isRequired,
    onShowAddProvider: PropTypes.func.isRequired,
    selectedTemplate: PropTypes.string.isRequired,
    onSelectedTemplateChange: PropTypes.func.isRequired,
    onAddProvider: PropTypes.func.isRequired,
  }).isRequired,
  providerManagement: PropTypes.shape({
    showApiKeys: PropTypes.object.isRequired,
    expandedProviders: PropTypes.object.isRequired,
    expandedModels: PropTypes.object.isRequired,
    testingProvider: PropTypes.string,
    testResults: PropTypes.object.isRequired,
    onToggleProviderModels: PropTypes.func.isRequired,
    onToggleApiKeyVisibility: PropTypes.func.isRequired,
    onUpdateProvider: PropTypes.func.isRequired,
    onDeleteProvider: PropTypes.func.isRequired,
    onAddCustomModel: PropTypes.func.isRequired,
    onTestProvider: PropTypes.func.isRequired,
    onToggleModel: PropTypes.func.isRequired,
    isModelExpanded: PropTypes.func.isRequired,
  }).isRequired,
};

export { SettingsTabContent };
