import { useState, useMemo, useEffect } from "react";
import { showConfirm } from "../utils/confirm";
import { useAuth } from "../contexts/AuthContext";
import { defaultAdapters } from "../types/adapters";
import { useLLMProviders, useProviderManagement } from "../hooks/providers";
import { SettingsService } from "../services/SettingsService";
import { useSettingsSync } from "../hooks/settings/useSettingsSync";
import { useModelExpansion } from "../hooks/settings/useModelExpansion";
import { useSettingsStateSync } from "../hooks/settings/useSettingsStateSync";
import { SettingsTabs } from "../components/settings/SettingsTabs";
import { SettingsTabContent } from "../components/settings/SettingsTabContent";
import { SettingsHeader } from "../components/settings/SettingsHeader";
import { API_CONFIG } from "../config/constants";
import {
  PROVIDER_TEMPLATES,
  SETTINGS_TABS,
  DEFAULT_PROVIDER_TEMPLATE,
} from "../constants/settingsConstants";
function SettingsPage({
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL,
  consoleAdapter = defaultAdapters.createConsoleAdapter(),
} = {}) {
  const { isAuthenticated, token } = useAuth();
  const settingsService = useMemo(
    () => new SettingsService(httpClient, storage, apiBaseUrl),
    [httpClient, storage, apiBaseUrl],
  );
  const {
    providers: loadedProviders,
    iterationLimit: loadedIterationLimit,
    defaultModel: loadedDefaultModel,
    chatAssistantModel: loadedChatAssistantModel,
  } = useLLMProviders({
    storage,
    isAuthenticated,
  });
  const [providers, setProviders] = useState([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    DEFAULT_PROVIDER_TEMPLATE,
  );
  const [showApiKeys, setShowApiKeys] = useState({});
  const [iterationLimit, setIterationLimit] = useState(10);
  const [defaultModel, setDefaultModel] = useState("");
  const [chatAssistantModel, setChatAssistantModel] = useState("");
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS.LLM);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      setProviders([]);
      setIterationLimit(10);
      setDefaultModel("");
      setChatAssistantModel("");
      setSettingsLoaded(false);
      setShowAddProvider(false);
    }
  }, [isAuthenticated]);
  const modelExpansion = useModelExpansion();
  const {
    expandedModels,
    expandedProviders,
    toggleProviderModels,
    toggleModel,
    isModelExpanded,
  } = modelExpansion;
  useSettingsStateSync({
    loadedProviders,
    loadedIterationLimit,
    loadedDefaultModel,
    loadedChatAssistantModel,
    providers,
    iterationLimit,
    defaultModel,
    chatAssistantModel,
    settingsLoaded,
    setProviders,
    setIterationLimit,
    setDefaultModel,
    setChatAssistantModel,
    setSettingsLoaded,
    onLoadComplete: (settings) => {
      if (settings.providers && settings.providers.length > 0) {
        setSettingsLoaded(true);
      }
    },
  });
  const {
    saveProviders,
    updateProvider,
    testProvider,
    addCustomModel,
    testingProvider,
    testResults,
  } = useProviderManagement({
    service: settingsService,
    providers,
    setProviders,
    iterationLimit,
    defaultModel,
    chatAssistantModel,
    token,
  });
  const { handleManualSync } = useSettingsSync({
    isAuthenticated,
    token: token || null,
    providers,
    iterationLimit,
    defaultModel,
    chatAssistantModel,
    settingsService,
    settingsLoaded,
    consoleAdapter,
  });
  const handleAddProvider = () => {
    const template = PROVIDER_TEMPLATES[selectedTemplate];
    const newProvider = {
      id: `provider_${Date.now()}`,
      name: template.name,
      type: template.type,
      apiKey: "",
      baseUrl: template.baseUrl,
      defaultModel: template.defaultModel,
      models: [...template.models],
      enabled: true,
    };
    saveProviders([...providers, newProvider]);
    setShowAddProvider(false);
  };
  const handleDeleteProvider = async (id) => {
    const confirmed = await showConfirm("Delete this provider?", {
      title: "Delete Provider",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (confirmed) {
      await saveProviders(providers.filter((p) => p.id !== id));
    }
  };
  const handleAddCustomModel = (providerId) => {
    const modelName = prompt("Enter custom model name:");
    if (modelName) {
      addCustomModel(providerId, modelName);
    }
  };
  const handleTestProvider = (provider) => {
    testProvider(provider);
  };
  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <SettingsHeader onSyncClick={handleManualSync} />
        <div className="flex gap-8">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 space-y-6">
            <SettingsTabContent
              isAuthenticated={isAuthenticated}
              activeTab={activeTab}
              iterationLimit={iterationLimit}
              onIterationLimitChange={setIterationLimit}
              defaultModel={defaultModel}
              onDefaultModelChange={setDefaultModel}
              chatAssistantModel={chatAssistantModel}
              onChatAssistantModelChange={setChatAssistantModel}
              providers={providers}
              showAddProvider={showAddProvider}
              onShowAddProvider={setShowAddProvider}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
              onAddProvider={handleAddProvider}
              showApiKeys={showApiKeys}
              expandedProviders={expandedProviders}
              expandedModels={expandedModels}
              testingProvider={testingProvider}
              testResults={testResults}
              onToggleProviderModels={toggleProviderModels}
              onToggleApiKeyVisibility={(id) =>
                setShowApiKeys((prev) => ({
                  ...prev,
                  [id]: !prev[id],
                }))
              }
              onUpdateProvider={updateProvider}
              onDeleteProvider={handleDeleteProvider}
              onAddCustomModel={handleAddCustomModel}
              onTestProvider={handleTestProvider}
              onToggleModel={toggleModel}
              isModelExpanded={isModelExpanded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export { SettingsPage as default };
