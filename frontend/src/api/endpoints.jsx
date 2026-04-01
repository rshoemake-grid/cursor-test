const workflowEndpoints = {
  list: () => "/workflows",
  detail: (id) => `/workflows/${id}`,
  execute: (id) => `/workflows/${id}/execute`,
  publish: (id) => `/workflows/${id}/publish`,
  bulkDelete: () => "/workflows/bulk-delete"
};
const executionEndpoints = {
  list: () => "/executions",
  detail: (id) => `/executions/${id}`,
  logs: (id) => `/executions/${id}/logs`,
  downloadLogs: (id) => `/executions/${id}/logs/download`,
  cancel: (id) => `/executions/${id}/cancel`
};
const templateEndpoints = {
  delete: (id) => `/templates/${id}`
};
const marketplaceEndpoints = {
  agents: () => "/marketplace/agents"
};
const settingsEndpoints = {
  llm: () => "/settings/llm"
};
const chatEndpoints = {
  chat: () => "/workflow-chat/chat"
};
export {
  chatEndpoints,
  executionEndpoints,
  marketplaceEndpoints,
  settingsEndpoints,
  templateEndpoints,
  workflowEndpoints
};
