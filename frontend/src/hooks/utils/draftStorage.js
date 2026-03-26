/**
 * Draft Storage Utilities
 * Common utilities for loading and saving workflow drafts
 */ // Domain-based imports - Phase 7
import { getLocalStorageItem, setLocalStorageItem } from '../storage';
const DRAFT_STORAGE_KEY = 'workflowBuilderDrafts';
/**
 * Load drafts from storage
 * 
 * @param options Storage and logging options
 * @returns Record of tab drafts keyed by tab ID
 */ export function loadDraftsFromStorage(options) {
    const drafts = getLocalStorageItem(DRAFT_STORAGE_KEY, {}, options);
    return typeof drafts === 'object' && drafts !== null ? drafts : {};
}
/**
 * Save drafts to storage
 * 
 * @param drafts Record of tab drafts to save
 * @param options Storage and logging options
 */ export function saveDraftsToStorage(drafts, options) {
    setLocalStorageItem(DRAFT_STORAGE_KEY, drafts, options);
}
/**
 * Get draft for a specific tab
 * 
 * @param tabId Tab ID to get draft for
 * @param options Storage and logging options
 * @returns Draft for the tab, or undefined if not found
 */ export function getDraftForTab(tabId, options) {
    const drafts = loadDraftsFromStorage(options);
    return drafts[tabId];
}
/**
 * Save draft for a specific tab
 * 
 * @param tabId Tab ID to save draft for
 * @param draft Draft data to save
 * @param options Storage and logging options
 */ export function saveDraftForTab(tabId, draft, options) {
    const drafts = loadDraftsFromStorage(options);
    drafts[tabId] = draft;
    saveDraftsToStorage(drafts, options);
}
/**
 * Delete draft for a specific tab
 * 
 * @param tabId Tab ID to delete draft for
 * @param options Storage and logging options
 */ export function deleteDraftForTab(tabId, options) {
    const drafts = loadDraftsFromStorage(options);
    delete drafts[tabId];
    saveDraftsToStorage(drafts, options);
}
/**
 * Clear all drafts from storage
 * 
 * @param options Storage and logging options
 */ export function clearAllDrafts(options) {
    saveDraftsToStorage({}, options);
}
/**
 * Check if a draft exists for a tab
 * 
 * @param tabId Tab ID to check
 * @param options Storage and logging options
 * @returns True if draft exists, false otherwise
 */ export function draftExists(tabId, options) {
    const draft = getDraftForTab(tabId, options);
    return draft !== undefined;
}
