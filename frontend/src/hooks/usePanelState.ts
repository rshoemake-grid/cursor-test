/**
 * Panel State Hook
 * Manages panel open/close state and save status
 */

import { useState, useEffect, useCallback } from 'react'

interface UsePanelStateOptions {
  selectedNode: any | null
}

/**
 * Hook for managing panel state
 * 
 * @param options Configuration options
 * @returns Panel state and handlers
 */
export function usePanelState({ selectedNode }: UsePanelStateOptions) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Auto-open panel when node is selected
  useEffect(() => {
    setPanelOpen(Boolean(selectedNode))
  }, [selectedNode])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const openPanel = useCallback(() => {
    setPanelOpen(true)
  }, [])

  return {
    panelOpen,
    setPanelOpen,
    saveStatus,
    setSaveStatus,
    closePanel,
    openPanel,
  }
}
