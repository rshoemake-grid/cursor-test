/**
 * Marketplace Dialog Hook
 * Manages marketplace dialog state and handlers
 */

import { useState, useCallback } from 'react'

export function useMarketplaceDialog() {
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false)
  const [marketplaceNode, setMarketplaceNode] = useState<any>(null)

  const openDialog = useCallback((node: any) => {
    setMarketplaceNode(node)
    setShowMarketplaceDialog(true)
  }, [])

  const closeDialog = useCallback(() => {
    setShowMarketplaceDialog(false)
    setMarketplaceNode(null)
  }, [])

  return {
    showMarketplaceDialog,
    marketplaceNode,
    openDialog,
    closeDialog,
  }
}
