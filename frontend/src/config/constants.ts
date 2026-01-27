/**
 * Centralized configuration constants
 * Follows DRY principle by eliminating magic strings and numbers
 */

// API Configuration
// Default to localhost, can be overridden via environment variable
// In Jest: process.env.VITE_API_BASE_URL
// In Vite: import.meta.env.VITE_API_BASE_URL (handled at build time)
const API_BASE_URL = 
  (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL) ||
  'http://localhost:8000/api'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    WORKFLOWS: '/workflows',
    EXECUTIONS: '/executions',
    CHAT: '/workflow-chat/chat',
    MARKETPLACE: '/marketplace',
    TEMPLATES: '/marketplace/templates',
    AGENTS: '/marketplace/agents',
    SETTINGS: '/settings',
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    LLM: {
      TEST: '/settings/llm/test',
    },
  },
} as const

// Storage Keys
export const STORAGE_KEYS = {
  WORKFLOW_TABS: 'workflowTabs',
  ACTIVE_TAB: 'activeWorkflowTabId',
  CHAT_HISTORY_PREFIX: 'chat_history_',
  OFFICIAL_AGENTS_SEEDED: 'officialAgentsSeeded',
  LLM_SETTINGS: 'llm_settings',
  WORKFLOW_DRAFTS: 'workflowDrafts',
  AUTH_TOKEN: 'auth_token',
  SESSION_TOKEN: 'session_token',
} as const

// Default Values
export const DEFAULT_VALUES = {
  AWS_REGION: 'us-east-1',
  DEFAULT_MODEL: 'gpt-4o-mini',
  NOTIFICATION_DURATION: 5000,
  WORKFLOW_NAME: 'Untitled Workflow',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
} as const

// UI Constants
export const UI_CONSTANTS = {
  NOTIFICATION_POSITION: {
    TOP: 20,
    RIGHT: 20,
  },
  ANIMATION_DURATION: {
    SLIDE_IN: 300,
    FADE_OUT: 300,
  },
  CONSOLE_HEIGHT: {
    MIN: 200,
    MAX: 600,
    DEFAULT: 300,
  },
} as const

// Node Types
export const NODE_TYPES = {
  START: 'start',
  END: 'end',
  AGENT: 'agent',
  CONDITION: 'condition',
  LOOP: 'loop',
  INPUT: {
    GCP_BUCKET: 'gcp_bucket',
    AWS_S3: 'aws_s3',
    GCP_PUBSUB: 'gcp_pubsub',
    LOCAL_FILESYSTEM: 'local_filesystem',
    DATABASE: 'database',
    FIREBASE: 'firebase',
    BIGQUERY: 'bigquery',
  },
} as const

// Helper function to build storage keys
export function buildStorageKey(prefix: string, suffix?: string): string {
  return suffix ? `${prefix}${suffix}` : prefix
}

// Helper function to get chat history key
export function getChatHistoryKey(workflowId: string | null): string {
  return workflowId 
    ? `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}${workflowId}` 
    : `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}new_workflow`
}
