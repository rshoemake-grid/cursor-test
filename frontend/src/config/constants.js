/**
 * Centralized configuration constants
 * Follows DRY principle by eliminating magic strings and numbers
 */ // API Configuration — CRA: REACT_APP_API_BASE_URL or same-origin /api (setupProxy in dev)
const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL || '/api';
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
            RESET_PASSWORD: '/auth/reset-password'
        },
        LLM: {
            TEST: '/settings/llm/test'
        }
    }
};
// Storage Keys
export const STORAGE_KEYS = {
    WORKFLOW_TABS: 'workflowTabs',
    ACTIVE_TAB: 'activeWorkflowTabId',
    CHAT_HISTORY_PREFIX: 'chat_history_',
    /** Persisted max tool rounds for workflow chat composer (1–50). */
    WORKFLOW_CHAT_ITERATION_LIMIT: 'workflow_chat_iteration_limit',
    OFFICIAL_AGENTS_SEEDED: 'officialAgentsSeeded',
    LLM_SETTINGS: 'llm_settings',
    WORKFLOW_DRAFTS: 'workflowDrafts',
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    AUTH_REMEMBER_ME: 'auth_remember_me',
    SESSION_TOKEN: 'session_token',
    PUBLISHED_AGENTS: 'publishedAgents',
    REPOSITORY_AGENTS: 'repositoryAgents',
    CUSTOM_AGENT_NODES: 'customAgentNodes',
    CUSTOM_TOOL_NODES: 'customToolNodes',
    PUBLISHED_TOOLS: 'publishedTools',
    WORKFLOW_ID_PREFIX: 'workflow-'
};
// Default Values
export const DEFAULT_VALUES = {
    AWS_REGION: 'us-east-1',
    DEFAULT_MODEL: 'gpt-4o-mini',
    NOTIFICATION_DURATION: 5000,
    WORKFLOW_NAME: 'Untitled Workflow',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7
};
// UI Constants
export const UI_CONSTANTS = {
    NOTIFICATION_POSITION: {
        TOP: 20,
        RIGHT: 20
    },
    ANIMATION_DURATION: {
        SLIDE_IN: 300,
        FADE_OUT: 300
    },
    CONSOLE_HEIGHT: {
        MIN: 200,
        MAX: 600,
        DEFAULT: 300
    },
    SAVE_STATUS_DELAY: 2000
};
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
        BIGQUERY: 'bigquery'
    }
};
// Helper function to build storage keys
export function buildStorageKey(prefix, suffix) {
    return suffix ? `${prefix}${suffix}` : prefix;
}
// Helper function to get chat history key (per tab when tabId is set so each new-workflow tab has its own session)
export function getChatHistoryKey(workflowId, tabId) {
    if (tabId != null && String(tabId).trim() !== '') {
        return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}tab_${tabId}`;
    }
    if (workflowId) {
        return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}${workflowId}`;
    }
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}new_workflow`;
}
