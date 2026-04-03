import { PENDING_AGENTS } from "./marketplaceConstants";
function isValidPendingAgents(pending) {
  if (pending === null || pending === void 0) {
    return false;
  }
  if (typeof pending.tabId !== "string" || pending.tabId === "") {
    return false;
  }
  if (typeof pending.timestamp !== "number" || pending.timestamp < 0) {
    return false;
  }
  if (!Array.isArray(pending.agents)) {
    return false;
  }
  return true;
}
function isPendingAgentsValid(
  pending,
  currentTabId,
  maxAge = PENDING_AGENTS.MAX_AGE,
) {
  if (pending === null || pending === void 0) {
    return false;
  }
  if (pending.tabId !== currentTabId) {
    return false;
  }
  const age = Date.now() - pending.timestamp;
  if (age < 0) {
    return false;
  }
  if (age >= maxAge) {
    return false;
  }
  return true;
}
function isPendingAgentsForDifferentTab(pending, currentTabId) {
  if (pending === null || pending === void 0) {
    return false;
  }
  return pending.tabId !== currentTabId;
}
function isPendingAgentsTooOld(pending, maxAge = PENDING_AGENTS.MAX_AGE) {
  if (pending === null || pending === void 0) {
    return false;
  }
  const age = Date.now() - pending.timestamp;
  if (age < 0) {
    return true;
  }
  return age >= maxAge;
}
export {
  isPendingAgentsForDifferentTab,
  isPendingAgentsTooOld,
  isPendingAgentsValid,
  isValidPendingAgents,
};
