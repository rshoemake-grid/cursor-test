import { useState, useEffect, useCallback } from "react";
function usePanelState({ selectedNode }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  useEffect(() => {
    setPanelOpen(Boolean(selectedNode));
  }, [selectedNode]);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);
  const openPanel = useCallback(() => {
    setPanelOpen(true);
  }, []);
  return {
    panelOpen,
    setPanelOpen,
    saveStatus,
    setSaveStatus,
    closePanel,
    openPanel
  };
}
export {
  usePanelState
};
