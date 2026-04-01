import { jsx, jsxs } from "react/jsx-runtime";
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
  DEFAULT_PROVIDER_TEMPLATE
} from "../constants/settingsConstants";
function SettingsPage({
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL,
  consoleAdapter = defaultAdapters.createConsoleAdapter()
} = {}) {
  const { isAuthenticated, token } = useAuth();
  const settingsService = useMemo(
    () => new SettingsService(httpClient, storage, apiBaseUrl),
    [httpClient, storage, apiBaseUrl]
  );
  const { providers: loadedProviders, iterationLimit: loadedIterationLimit, defaultModel: loadedDefaultModel } = useLLMProviders({
    storage,
    isAuthenticated
  });
  const [providers, setProviders] = useState([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_PROVIDER_TEMPLATE);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [iterationLimit, setIterationLimit] = useState(10);
  const [defaultModel, setDefaultModel] = useState("");
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS.LLM);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      setProviders([]);
      setIterationLimit(10);
      setDefaultModel("");
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
    isModelExpanded
  } = modelExpansion;
  useSettingsStateSync({
    loadedProviders,
    loadedIterationLimit,
    loadedDefaultModel,
    providers,
    iterationLimit,
    defaultModel,
    settingsLoaded,
    setProviders,
    setIterationLimit,
    setDefaultModel,
    setSettingsLoaded,
    onLoadComplete: (settings) => {
      if (settings.providers && settings.providers.length > 0) {
        setSettingsLoaded(true);
      }
    }
  });
  const {
    saveProviders,
    updateProvider,
    testProvider,
    addCustomModel,
    testingProvider,
    testResults
  } = useProviderManagement({
    service: settingsService,
    providers,
    setProviders,
    iterationLimit,
    defaultModel,
    token
  });
  const { handleManualSync } = useSettingsSync({
    isAuthenticated,
    token: token || null,
    providers,
    iterationLimit,
    defaultModel,
    settingsService,
    settingsLoaded,
    consoleAdapter
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
      enabled: true
    };
    saveProviders([...providers, newProvider]);
    setShowAddProvider(false);
  };
  const handleDeleteProvider = async (id) => {
    const confirmed = await showConfirm(
      "Delete this provider?",
      { title: "Delete Provider", confirmText: "Delete", cancelText: "Cancel", type: "danger" }
    );
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
  return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx(SettingsHeader, { onSyncClick: handleManualSync }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-8", children: [
      /* @__PURE__ */ jsx(
        SettingsTabs,
        {
          activeTab,
          onTabChange: setActiveTab
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-6", children: /* @__PURE__ */ jsx(
        SettingsTabContent,
        {
          isAuthenticated,
          activeTab,
          iterationLimit,
          onIterationLimitChange: setIterationLimit,
          defaultModel,
          onDefaultModelChange: setDefaultModel,
          providers,
          showAddProvider,
          onShowAddProvider: setShowAddProvider,
          selectedTemplate,
          onSelectedTemplateChange: setSelectedTemplate,
          onAddProvider: handleAddProvider,
          showApiKeys,
          expandedProviders,
          expandedModels,
          testingProvider,
          testResults,
          onToggleProviderModels: toggleProviderModels,
          onToggleApiKeyVisibility: (id) => setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] })),
          onUpdateProvider: updateProvider,
          onDeleteProvider: handleDeleteProvider,
          onAddCustomModel: handleAddCustomModel,
          onTestProvider: handleTestProvider,
          onToggleModel: toggleModel,
          isModelExpanded
        }
      ) })
    ] })
  ] }) });
}
export {
  SettingsPage as default
};
