import { PENDING_AGENTS } from "./marketplaceConstants";
function createPendingAgentsPolling(checkPendingAgents, _logger) {
  let checkCount = 0;
  const maxChecks = PENDING_AGENTS.MAX_CHECKS;
  const interval = setInterval(() => {
    checkPendingAgents();
    checkCount++;
    if (checkCount >= maxChecks) {
      clearInterval(interval);
    }
  }, PENDING_AGENTS.CHECK_INTERVAL);
  const cleanup = () => {
    clearInterval(interval);
  };
  return { interval, cleanup };
}
export { createPendingAgentsPolling };
