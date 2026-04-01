import { getLocalStorageItem, setLocalStorageItem } from "../storage";
const DRAFT_STORAGE_KEY = "workflowBuilderDrafts";
function loadDraftsFromStorage(options) {
  const drafts = getLocalStorageItem(
    DRAFT_STORAGE_KEY,
    {},
    options
  );
  return typeof drafts === "object" && drafts !== null ? drafts : {};
}
function saveDraftsToStorage(drafts, options) {
  setLocalStorageItem(DRAFT_STORAGE_KEY, drafts, options);
}
function getDraftForTab(tabId, options) {
  const drafts = loadDraftsFromStorage(options);
  return drafts[tabId];
}
function saveDraftForTab(tabId, draft, options) {
  const drafts = loadDraftsFromStorage(options);
  drafts[tabId] = draft;
  saveDraftsToStorage(drafts, options);
}
function deleteDraftForTab(tabId, options) {
  const drafts = loadDraftsFromStorage(options);
  delete drafts[tabId];
  saveDraftsToStorage(drafts, options);
}
function clearAllDrafts(options) {
  saveDraftsToStorage({}, options);
}
function draftExists(tabId, options) {
  const draft = getDraftForTab(tabId, options);
  return draft !== void 0;
}
export {
  clearAllDrafts,
  deleteDraftForTab,
  draftExists,
  getDraftForTab,
  loadDraftsFromStorage,
  saveDraftForTab,
  saveDraftsToStorage
};
