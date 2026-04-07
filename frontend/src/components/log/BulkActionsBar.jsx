import { Trash2, X } from "lucide-react";
import {
  LogBulkBar,
  LogBulkLeft,
  LogBulkCount,
  LogBulkActions,
  LogBulkDeleteBtn,
  LogBulkCloseBtn,
} from "../../styles/logComponents.styled";

function BulkActionsBar({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
}) {
  if (selectedCount === 0) {
    return null;
  }
  return (
    <LogBulkBar>
      <LogBulkLeft>
        <LogBulkCount>
          {selectedCount} execution{selectedCount !== 1 ? "s" : ""} selected
        </LogBulkCount>
      </LogBulkLeft>
      <LogBulkActions>
        <LogBulkDeleteBtn onClick={onDelete} disabled={isDeleting}>
          <Trash2 aria-hidden />
          {isDeleting ? "Deleting..." : "Delete"}
        </LogBulkDeleteBtn>
        <LogBulkCloseBtn onClick={onClearSelection} aria-label="Clear selection">
          <X aria-hidden />
        </LogBulkCloseBtn>
      </LogBulkActions>
    </LogBulkBar>
  );
}
export { BulkActionsBar as default };
