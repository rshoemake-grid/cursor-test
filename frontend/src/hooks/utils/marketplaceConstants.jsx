const PENDING_AGENTS_STORAGE_KEY = "pendingAgentsToAdd";
const PENDING_TOOLS_STORAGE_KEY = "pendingToolsToAdd";
const PENDING_AGENTS = {
  MAX_AGE: 1e4,
  // 10 seconds
  MAX_CHECKS: 10,
  CHECK_INTERVAL: 1e3
  // 1 second
};
const AGENT_NODE = {
  DEFAULT_LABEL: "Agent Node",
  SPACING: 150,
  TYPE: "agent"
};
const TOOL_NODE = {
  DEFAULT_LABEL: "Tool Node",
  SPACING: 150,
  TYPE: "tool"
};
const DRAFT_UPDATE = {
  IMMEDIATE_DELAY: 0,
  FLAG_RESET_DELAY: 1e3
  // 1 second
};
export {
  AGENT_NODE,
  DRAFT_UPDATE,
  PENDING_AGENTS,
  PENDING_AGENTS_STORAGE_KEY,
  PENDING_TOOLS_STORAGE_KEY,
  TOOL_NODE
};
