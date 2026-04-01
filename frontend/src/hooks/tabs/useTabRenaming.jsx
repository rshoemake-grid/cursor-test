import { useState, useEffect, useRef, useCallback } from "react";
import { showError as defaultShowError } from "../../utils/notifications";
import { logger as defaultLogger } from "../../utils/logger";
import { validateWorkflowName, sanitizeName, hasNameChanged } from "../utils/validation";
import { logicalOr } from "../utils/logicalOr";
function useTabRenaming({
  tabs,
  onRename,
  showError = defaultShowError,
  logger = defaultLogger
}) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const editingInputRef = useRef(null);
  const renameInFlightRef = useRef(false);
  useEffect(() => {
    if (editingTabId && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.select();
    }
  }, [editingTabId]);
  const startEditing = useCallback((tab, event) => {
    if (event) {
      event.stopPropagation();
    }
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  }, []);
  const commitRename = useCallback(async (tabId, requestedName) => {
    if (renameInFlightRef.current) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) {
      setEditingTabId(null);
      setEditingName("");
      return;
    }
    const trimmedName = sanitizeName(requestedName);
    const validation = validateWorkflowName(trimmedName);
    if (!validation.isValid) {
      const errorMsg = logicalOr(validation.error, "Invalid workflow name.");
      const errorStr = errorMsg !== null && errorMsg !== void 0 ? errorMsg : "Invalid workflow name.";
      showError(errorStr);
      return;
    }
    if (!hasNameChanged(trimmedName, tab.name)) {
      setEditingTabId(null);
      setEditingName("");
      return;
    }
    renameInFlightRef.current = true;
    const previousName = tab.name;
    try {
      await onRename(tabId, trimmedName, previousName);
      setEditingTabId(null);
      setEditingName("");
    } catch (error) {
      logger.error("Failed to rename tab:", error);
    } finally {
      renameInFlightRef.current = false;
    }
  }, [tabs, onRename, showError, logger]);
  const cancelEditing = useCallback(() => {
    setEditingTabId(null);
    setEditingName("");
  }, []);
  const handleInputBlur = useCallback((tabId) => {
    setTimeout(() => {
      if (editingTabId === tabId) {
        commitRename(tabId, editingName);
      }
    }, 100);
  }, [editingTabId, editingName, commitRename]);
  const handleInputKeyDown = useCallback((tabId, event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename(tabId, editingName);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }, [editingName, commitRename, cancelEditing]);
  return {
    editingTabId,
    editingName,
    editingInputRef,
    setEditingName,
    startEditing,
    commitRename,
    cancelEditing,
    handleInputBlur,
    handleInputKeyDown
  };
}
export {
  useTabRenaming
};
