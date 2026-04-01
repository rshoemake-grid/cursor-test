const SETTINGS_TABS = {
  LLM: "llm",
  WORKFLOW: "workflow"
};
const DEFAULT_SORT = "popular";
const DEFAULT_PROVIDER_TEMPLATE = "openai";
const PROVIDER_TEMPLATES = {
  openai: {
    name: "OpenAI",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4",
    models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"]
  },
  anthropic: {
    name: "Anthropic",
    type: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ]
  },
  gemini: {
    name: "Google Gemini",
    type: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",
      "gemini-3-pro-image-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-preview-09-2025"
    ]
  },
  custom: {
    name: "Custom Provider",
    type: "custom",
    baseUrl: "",
    defaultModel: "",
    models: []
  }
};
export {
  DEFAULT_PROVIDER_TEMPLATE,
  DEFAULT_SORT,
  PROVIDER_TEMPLATES,
  SETTINGS_TABS
};
