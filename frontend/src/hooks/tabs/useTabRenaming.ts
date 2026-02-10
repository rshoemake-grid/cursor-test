/**
 * Tab Renaming Hook
 * Manages tab name editing state and operations
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { showError as defaultShowError } from '../../utils/notifications'
import { logger as defaultLogger } from '../../utils/logger'
import type { WorkflowTabData } from '../../contexts/WorkflowTabsContext'
import { validateWorkflowName, sanitizeName, hasNameChanged } from '../utils/validation'
import { logicalOr } from '../utils/logicalOr'

interface UseTabRenamingOptions {
  tabs: WorkflowTabData[]
  onRename: (tabId: string, newName: string, previousName: string) => Promise<void> | void
  showError?: typeof defaultShowError
  logger?: typeof defaultLogger
}

/**
 * Hook for managing tab renaming
 * 
 * @param options Configuration options
 * @returns Renaming state and handlers
 */
export function useTabRenaming({ 
  tabs, 
  onRename,
  showError = defaultShowError,
  logger = defaultLogger
}: UseTabRenamingOptions) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editingInputRef = useRef<HTMLInputElement>(null)
  const renameInFlightRef = useRef(false)

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabId && editingInputRef.current) {
      editingInputRef.current.focus()
      editingInputRef.current.select()
    }
  }, [editingTabId])

  const startEditing = useCallback((tab: WorkflowTabData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setEditingTabId(tab.id)
    setEditingName(tab.name)
  }, [])

  const commitRename = useCallback(async (tabId: string, requestedName: string) => {
    if (renameInFlightRef.current) return

    const tab = tabs.find(t => t.id === tabId)
    if (!tab) {
      setEditingTabId(null)
      setEditingName('')
      return
    }

    const trimmedName = sanitizeName(requestedName)
    const validation = validateWorkflowName(trimmedName)
    if (!validation.isValid) {
      const errorMsg = logicalOr(validation.error, 'Invalid workflow name.')
      const errorStr = (errorMsg !== null && errorMsg !== undefined) ? errorMsg : 'Invalid workflow name.'
      showError(errorStr)
      return
    }

    if (!hasNameChanged(trimmedName, tab.name)) {
      setEditingTabId(null)
      setEditingName('')
      return
    }

    renameInFlightRef.current = true
    const previousName = tab.name
    
    try {
      await onRename(tabId, trimmedName, previousName)
      setEditingTabId(null)
      setEditingName('')
    } catch (error) {
      logger.error('Failed to rename tab:', error)
      // Error handling is done in onRename callback
    } finally {
      renameInFlightRef.current = false
    }
  }, [tabs, onRename, showError, logger])

  const cancelEditing = useCallback(() => {
    setEditingTabId(null)
    setEditingName('')
  }, [])

  const handleInputBlur = useCallback((tabId: string) => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      if (editingTabId === tabId) {
        commitRename(tabId, editingName)
      }
    }, 100)
  }, [editingTabId, editingName, commitRename])

  const handleInputKeyDown = useCallback((tabId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename(tabId, editingName)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }, [editingName, commitRename, cancelEditing])

  return {
    editingTabId,
    editingName,
    editingInputRef,
    setEditingName,
    startEditing,
    commitRename,
    cancelEditing,
    handleInputBlur,
    handleInputKeyDown,
  }
}
