const VALID_NODE_TYPES = ["agent", "condition", "loop", "start", "end"];
const VALID_EXECUTION_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
];
const VALID_CONDITION_TYPES = [
  "equals",
  "contains",
  "greater_than",
  "less_than",
  "custom",
];
const VALID_LOOP_TYPES = ["for_each", "while", "until"];
const VALID_EDGE_CONDITIONS = ["true", "false", "default"];
function isValidNodeType(value) {
  return VALID_NODE_TYPES.includes(value);
}
function isValidExecutionStatus(value) {
  return VALID_EXECUTION_STATUSES.includes(value);
}
function isValidConditionType(value) {
  return VALID_CONDITION_TYPES.includes(value);
}
function isValidLoopType(value) {
  return VALID_LOOP_TYPES.includes(value);
}
function isValidEdgeCondition(value) {
  return VALID_EDGE_CONDITIONS.includes(value);
}
export {
  isValidConditionType,
  isValidEdgeCondition,
  isValidExecutionStatus,
  isValidLoopType,
  isValidNodeType,
};
