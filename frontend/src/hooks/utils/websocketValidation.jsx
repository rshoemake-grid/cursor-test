import { WS_CLOSE_CODES } from "./websocketConstants";
const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};
function isValidWebSocket(ws) {
  if (ws === null || ws === void 0) {
    return false;
  }
  const readyState = ws.readyState;
  if (readyState === WS_READY_STATE.OPEN) {
    return true;
  }
  return false;
}
function hasPendingReconnection(timeout) {
  if (timeout === null || timeout === void 0) {
    return false;
  }
  return true;
}
function sanitizeReconnectionDelay(delay) {
  const MIN_DELAY = 1;
  const MAX_DELAY = 6e4;
  if (delay < MIN_DELAY) {
    return MIN_DELAY;
  }
  if (delay > MAX_DELAY) {
    return MAX_DELAY;
  }
  return delay;
}
function isCleanClosure(event) {
  if (event.wasClean === true && event.code === WS_CLOSE_CODES.NORMAL_CLOSURE) {
    return true;
  }
  return false;
}
function getCloseReason(event) {
  if (event.reason !== null && event.reason !== void 0 && event.reason.length > 0) {
    return event.reason;
  }
  return "No reason provided";
}
export {
  getCloseReason,
  hasPendingReconnection,
  isCleanClosure,
  isValidWebSocket,
  sanitizeReconnectionDelay
};
