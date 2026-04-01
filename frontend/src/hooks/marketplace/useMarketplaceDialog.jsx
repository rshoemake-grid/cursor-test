import { useState, useCallback } from "react";
function useMarketplaceDialog() {
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false);
  const [marketplaceNode, setMarketplaceNode] = useState(null);
  const openDialog = useCallback((node) => {
    setMarketplaceNode(node);
    setShowMarketplaceDialog(true);
  }, []);
  const closeDialog = useCallback(() => {
    setShowMarketplaceDialog(false);
    setMarketplaceNode(null);
  }, []);
  return {
    showMarketplaceDialog,
    marketplaceNode,
    openDialog,
    closeDialog
  };
}
export {
  useMarketplaceDialog
};
