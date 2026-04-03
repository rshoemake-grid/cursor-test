import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../config/constants";
import {
  isValidProvidersArray,
  canExtractModelsFromProvider,
  isValidData,
  hasProviders,
} from "../utils/providerValidation";
import { logicalOr, logicalOrToEmptyArray } from "../utils/logicalOr";
const DEFAULT_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI)", provider: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o (OpenAI)", provider: "OpenAI" },
  { value: "gpt-4", label: "GPT-4 (OpenAI)", provider: "OpenAI" },
  {
    value: "gpt-3.5-turbo",
    label: "GPT-3.5 Turbo (OpenAI)",
    provider: "OpenAI",
  },
];
function extractModelsFromProviders(providers) {
  const models = [];
  if (!isValidProvidersArray(providers)) {
    return models;
  }
  providers.forEach((provider) => {
    if (canExtractModelsFromProvider(provider)) {
      provider.models.forEach((model) => {
        models.push({
          value: model,
          label: `${model} (${provider.name})`,
          provider: provider.name,
        });
      });
    }
  });
  return models;
}
function loadFromStorage(storage) {
  if (!storage) {
    return null;
  }
  try {
    const saved = storage.getItem(STORAGE_KEYS.LLM_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        providers: logicalOrToEmptyArray(parsed.providers),
        iteration_limit: parsed.iteration_limit,
        default_model: parsed.default_model,
        chat_assistant_model: parsed.chat_assistant_model,
      };
    }
  } catch (e) {
    logger.error("Failed to parse LLM settings from storage:", e);
  }
  return null;
}
function useLLMProviders({
  storage = null,
  isAuthenticated = true,
  onLoadComplete,
} = {}) {
  const [availableModels, setAvailableModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [iterationLimit, setIterationLimit] = useState(void 0);
  const [defaultModel, setDefaultModel] = useState(void 0);
  const [chatAssistantModel, setChatAssistantModel] = useState(void 0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      if (!isAuthenticated) {
        setAvailableModels(DEFAULT_MODELS);
        setProviders([]);
        setIterationLimit(void 0);
        setDefaultModel(void 0);
        setChatAssistantModel(void 0);
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getLLMSettings();
        if (
          isValidData(data) &&
          isValidData(data.providers) &&
          isValidProvidersArray(data.providers) &&
          hasProviders(data.providers)
        ) {
          const models = extractModelsFromProviders(data.providers);
          if (models.length > 0) {
            setAvailableModels(models);
            setProviders(data.providers);
            if (typeof data.iteration_limit === "number") {
              setIterationLimit(data.iteration_limit);
            }
            if (data.default_model) {
              setDefaultModel(data.default_model);
            }
            if (typeof data.chat_assistant_model === "string") {
              setChatAssistantModel(data.chat_assistant_model);
            } else {
              setChatAssistantModel("");
            }
            if (storage) {
              try {
                storage.setItem(
                  STORAGE_KEYS.LLM_SETTINGS,
                  JSON.stringify({
                    providers: logicalOrToEmptyArray(data.providers),
                    iteration_limit: data.iteration_limit,
                    default_model: logicalOr(data.default_model, ""),
                    chat_assistant_model:
                      typeof data.chat_assistant_model === "string"
                        ? data.chat_assistant_model
                        : "",
                  }),
                );
              } catch (e) {
                logger.error("Failed to save LLM settings to storage:", e);
              }
            }
            if (onLoadComplete) {
              onLoadComplete({
                providers: data.providers,
                iteration_limit: data.iteration_limit,
                default_model: data.default_model,
                chat_assistant_model: data.chat_assistant_model,
              });
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        logger.debug("Could not load from backend, trying storage", e);
      }
      const storedSettings = loadFromStorage(storage);
      if (
        isValidData(storedSettings) &&
        isValidData(storedSettings.providers) &&
        isValidProvidersArray(storedSettings.providers) &&
        hasProviders(storedSettings.providers)
      ) {
        const models = extractModelsFromProviders(storedSettings.providers);
        if (models.length > 0) {
          setAvailableModels(models);
          setProviders(storedSettings.providers);
          if (typeof storedSettings.iteration_limit === "number") {
            setIterationLimit(storedSettings.iteration_limit);
          }
          if (storedSettings.default_model) {
            setDefaultModel(storedSettings.default_model);
          }
          if (typeof storedSettings.chat_assistant_model === "string") {
            setChatAssistantModel(storedSettings.chat_assistant_model);
          }
          if (onLoadComplete) {
            onLoadComplete(storedSettings);
          }
          setIsLoading(false);
          return;
        }
      }
      setAvailableModels(DEFAULT_MODELS);
      setProviders([]);
      setIsLoading(false);
    };
    loadProviders();
  }, [isAuthenticated]);
  return {
    availableModels,
    providers,
    iterationLimit,
    defaultModel,
    chatAssistantModel,
    isLoading,
  };
}
export { useLLMProviders };
