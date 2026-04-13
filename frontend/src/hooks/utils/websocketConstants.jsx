const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1e3,
  GOING_AWAY: 1001,
  ABNORMAL_CLOSURE: 1006,
};
const WS_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};
const EXECUTION_STATUS = {
  COMPLETED: "completed",
  FAILED: "failed",
  RUNNING: "running",
  PENDING: "pending",
  PAUSED: "paused",
};
const WS_RECONNECT = {
  BASE_DELAY: 1e3,
  MAX_DELAY: 6e4,
  MIN_DELAY: 1,
  DEFAULT_MAX_DELAY: 1e4,
  DEFAULT_SAFE_DELAY: 1e3,
};
/** Matches server `websocket_routes` handling of literal "ping" over receive_text. */
const WS_CLIENT_PING_INTERVAL_MS = 25e3;
const WS_CLOSE_REASONS = {
  EXECUTION_COMPLETED: "Execution completed",
  NO_REASON_PROVIDED: "No reason provided",
};
export {
  EXECUTION_STATUS,
  WS_CLIENT_PING_INTERVAL_MS,
  WS_CLOSE_CODES,
  WS_CLOSE_REASONS,
  WS_RECONNECT,
  WS_STATUS,
};
