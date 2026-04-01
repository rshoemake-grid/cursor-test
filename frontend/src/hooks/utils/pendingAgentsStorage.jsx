import { PENDING_AGENTS_STORAGE_KEY } from "./marketplaceConstants";
function clearPendingAgents(storage) {
  if (storage !== null && storage !== void 0) {
    storage.removeItem(PENDING_AGENTS_STORAGE_KEY);
  }
}
export {
  clearPendingAgents
};
