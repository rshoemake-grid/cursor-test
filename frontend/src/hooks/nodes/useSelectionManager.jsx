import { useState, useCallback } from "react";
function useSelectionManager() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  const add = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);
  const remove = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  const has = useCallback(
    (id) => {
      return selectedIds.has(id);
    },
    [selectedIds],
  );
  return {
    selectedIds,
    setSelectedIds,
    toggle,
    clear,
    add,
    remove,
    has,
    size: selectedIds.size,
  };
}
export { useSelectionManager };
