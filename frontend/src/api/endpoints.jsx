const workflowEndpoints = {
  list: () => "/workflows",
  detail: (id) => `/workflows/${id}`,
  execute: (id) => `/workflows/${id}/execute`,
  publish: (id) => `/workflows/${id}/publish`,
  bulkDelete: () => "/workflows/bulk-delete",
};
const executionEndpoints = {
  list: () => "/executions",
  detail: (id) => `/executions/${id}`,
  logs: (id) => `/executions/${id}/logs`,
  downloadLogs: (id) => `/executions/${id}/logs/download`,
  cancel: (id) => `/executions/${id}/cancel`,
};
const templateEndpoints = {
  delete: (id) => `/templates/${id}`,
};
const marketplaceEndpoints = {
  agents: () => "/marketplace/agents",
};
const settingsEndpoints = {
  llm: () => "/settings/llm",
};
const chatEndpoints = {
  chat: () => "/workflow-chat/chat",
};
const storageEndpoints = {
  gcpListObjects: () => "/storage/gcp/list-objects",
  gcpListBuckets: () => "/storage/gcp/list-buckets",
  gcpListProjects: () => "/storage/gcp/list-projects",
  gcpDefaultProject: () => "/storage/gcp/default-project",
  gcpPubsubListTopics: () => "/storage/gcp/pubsub/list-topics",
  gcpPubsubListSubscriptions: () => "/storage/gcp/pubsub/list-subscriptions",
  bigqueryListDatasets: () => "/storage/bigquery/list-datasets",
  bigqueryListTables: () => "/storage/bigquery/list-tables",
  firestoreListCollections: () => "/storage/firestore/list-collections",
  awsListObjects: () => "/storage/aws/list-objects",
  awsListBuckets: () => "/storage/aws/list-buckets",
  awsListRegions: () => "/storage/aws/list-regions",
  localListDirectory: () => "/storage/local/list-directory",
};
export {
  chatEndpoints,
  executionEndpoints,
  marketplaceEndpoints,
  settingsEndpoints,
  storageEndpoints,
  templateEndpoints,
  workflowEndpoints,
};
