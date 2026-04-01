const CONDITION_TYPES = {
  EQUALS: "equals",
  NOT_EQUALS: "not_equals",
  CONTAINS: "contains",
  NOT_CONTAINS: "not_contains",
  GREATER_THAN: "greater_than",
  NOT_GREATER_THAN: "not_greater_than",
  LESS_THAN: "less_than",
  NOT_LESS_THAN: "not_less_than",
  EMPTY: "empty",
  NOT_EMPTY: "not_empty",
  CUSTOM: "custom"
};
const EXECUTION_STATUSES = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  PAUSED: "paused"
};
const LOG_LEVELS = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  DEBUG: "DEBUG"
};
const NODE_TYPES = {
  START: "start",
  END: "end",
  AGENT: "agent",
  CONDITION: "condition",
  LOOP: "loop",
  INPUT: "input",
  DATABASE: "database",
  FIREBASE: "firebase",
  BIGQUERY: "bigquery",
  LOCAL_FILESYSTEM: "local_filesystem",
  AWS_S3: "aws_s3",
  GCP_BUCKET: "gcp_bucket",
  GCP_PUBSUB: "gcp_pubsub"
};
const FIREBASE_SERVICES = {
  FIRESTORE: "firestore",
  REALTIME_DB: "realtime_db",
  STORAGE: "storage"
};
const INPUT_MODES = {
  READ: "read",
  WRITE: "write"
};
function isValidConditionType(value) {
  return Object.values(CONDITION_TYPES).includes(value);
}
function isValidExecutionStatus(value) {
  return Object.values(EXECUTION_STATUSES).includes(value);
}
function isValidLogLevel(value) {
  return Object.values(LOG_LEVELS).includes(value);
}
export {
  CONDITION_TYPES,
  EXECUTION_STATUSES,
  FIREBASE_SERVICES,
  INPUT_MODES,
  LOG_LEVELS,
  NODE_TYPES,
  isValidConditionType,
  isValidExecutionStatus,
  isValidLogLevel
};
