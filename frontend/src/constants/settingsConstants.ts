/**
 * Settings Constants
 * Centralized constants for settings page to prevent string literal mutations
 * DRY: Single source of truth for magic values
 */

/**
 * Settings tab types
 */
export const SETTINGS_TABS = {
  LLM: 'llm',
  WORKFLOW: 'workflow',
} as const

/**
 * Default sort value
 */
export const DEFAULT_SORT = 'popular' as const

/**
 * Default provider template
 */
export const DEFAULT_PROVIDER_TEMPLATE = 'openai' as const

/**
 * Provider templates configuration
 */
export const PROVIDER_TEMPLATES = {
  openai: {
    name: 'OpenAI',
    type: 'openai' as const,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini']
  },
  anthropic: {
    name: 'Anthropic',
    type: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  gemini: {
    name: 'Google Gemini',
    type: 'gemini' as const,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3-pro-image-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-image',
      'gemini-2.5-flash-preview-09-2025'
    ]
  },
  custom: {
    name: 'Custom Provider',
    type: 'custom' as const,
    baseUrl: '',
    defaultModel: '',
    models: []
  }
} as const
