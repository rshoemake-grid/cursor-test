/**
 * CRA/Vite env often sets REACT_APP_API_BASE_URL to the API origin only (e.g. http://127.0.0.1:8000).
 * Our route paths are like /workflow-chat/chat under the FastAPI /api prefix, so the fetch base must be .../api
 * or relative /api — never http://host:8000 alone (that yields 404 Not Found on chat).
 */
function normalizeApiBaseUrl(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s === "" || s === "/") {
    return "/api";
  }
  if (!/^https?:\/\//i.test(s)) {
    const rel = s.replace(/\/$/, "");
    return rel || "/api";
  }
  try {
    const u = new URL(s);
    const path = (u.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/") {
      return `${u.origin}/api`;
    }
    return `${u.origin}${path}`;
  } catch {
    return "/api";
  }
}
const _rawApiBase =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL) ||
  "";
const API_BASE_URL = normalizeApiBaseUrl(_rawApiBase);
const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    WORKFLOWS: "/workflows",
    EXECUTIONS: "/executions",
    CHAT: "/workflow-chat/chat",
    MARKETPLACE: "/marketplace",
    TEMPLATES: "/marketplace/templates",
    AGENTS: "/marketplace/agents",
    SETTINGS: "/settings",
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      FORGOT_PASSWORD: "/auth/forgot-password",
      RESET_PASSWORD: "/auth/reset-password",
    },
    LLM: {
      TEST: "/settings/llm/test",
    },
  },
};
const STORAGE_KEYS = {
  WORKFLOW_TABS: "workflowTabs",
  ACTIVE_TAB: "activeWorkflowTabId",
  CHAT_HISTORY_PREFIX: "chat_history_",
  OFFICIAL_AGENTS_SEEDED: "officialAgentsSeeded",
  LLM_SETTINGS: "llm_settings",
  WORKFLOW_DRAFTS: "workflowDrafts",
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  AUTH_REMEMBER_ME: "auth_remember_me",
  /** Session snapshot before redirect to login (pathname, builder sub-view, etc.) */
  AUTH_RETURN_CONTEXT: "authReturnContext",
  SESSION_TOKEN: "session_token",
  PUBLISHED_AGENTS: "publishedAgents",
  REPOSITORY_AGENTS: "repositoryAgents",
  CUSTOM_AGENT_NODES: "customAgentNodes",
  CUSTOM_TOOL_NODES: "customToolNodes",
  PUBLISHED_TOOLS: "publishedTools",
  WORKFLOW_ID_PREFIX: "workflow-",
};
const DEFAULT_VALUES = {
  AWS_REGION: "us-east-1",
  DEFAULT_MODEL: "gpt-4o-mini",
  NOTIFICATION_DURATION: 5e3,
  WORKFLOW_NAME: "Untitled Workflow",
  MAX_TOKENS: 2e3,
  TEMPERATURE: 0.7,
};
const UI_CONSTANTS = {
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
  SAVE_STATUS_DELAY: 2e3,
  // Delay before resetting save status (ms)
};
const NODE_TYPES = {
  START: "start",
  END: "end",
  AGENT: "agent",
  CONDITION: "condition",
  LOOP: "loop",
  INPUT: {
    GCP_BUCKET: "gcp_bucket",
    AWS_S3: "aws_s3",
    GCP_PUBSUB: "gcp_pubsub",
    LOCAL_FILESYSTEM: "local_filesystem",
    DATABASE: "database",
    FIREBASE: "firebase",
    BIGQUERY: "bigquery",
  },
};
function buildStorageKey(prefix, suffix) {
  return suffix ? `${prefix}${suffix}` : prefix;
}
function getChatHistoryKey(workflowId, tabId = null) {
  if (workflowId !== null && workflowId !== void 0 && workflowId !== "") {
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}${workflowId}`;
  }
  if (tabId !== null && tabId !== void 0 && tabId !== "") {
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}tab_${tabId}`;
  }
  return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}new_workflow`;
}
export {
  API_CONFIG,
  DEFAULT_VALUES,
  NODE_TYPES,
  STORAGE_KEYS,
  UI_CONSTANTS,
  buildStorageKey,
  getChatHistoryKey,
};
