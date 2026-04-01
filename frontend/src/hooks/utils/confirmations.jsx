import { showConfirm } from "../../utils/confirm";
import { logicalOr } from "./logicalOr";
const UNSAVED_CHANGES_OPTIONS = {
  title: "Unsaved Changes",
  confirmText: "Close",
  cancelText: "Cancel",
  type: "warning"
};
async function confirmUnsavedChanges(onConfirm) {
  const confirmed = await showConfirm(
    "This workflow has unsaved changes. Close anyway?",
    UNSAVED_CHANGES_OPTIONS
  );
  if (confirmed) {
    await onConfirm();
  }
}
async function confirmDelete(itemName, onConfirm, options) {
  const confirmed = await showConfirm(
    `Are you sure you want to delete "${itemName}"?`,
    {
      title: logicalOr(options?.title, "Delete") !== null && logicalOr(options?.title, "Delete") !== void 0 ? logicalOr(options?.title, "Delete") : "Delete",
      confirmText: logicalOr(options?.confirmText, "Delete") !== null && logicalOr(options?.confirmText, "Delete") !== void 0 ? logicalOr(options?.confirmText, "Delete") : "Delete",
      cancelText: logicalOr(options?.cancelText, "Cancel") !== null && logicalOr(options?.cancelText, "Cancel") !== void 0 ? logicalOr(options?.cancelText, "Cancel") : "Cancel",
      type: "danger"
    }
  );
  if (confirmed) {
    await onConfirm();
  }
}
async function confirmAction(message, options, onConfirm) {
  const confirmed = await showConfirm(message, options);
  if (confirmed) {
    await onConfirm();
  }
}
export {
  confirmAction,
  confirmDelete,
  confirmUnsavedChanges
};
