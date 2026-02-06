/**
 * Confirmation Dialog Utilities
 * Reusable confirmation patterns to eliminate DRY violations
 */

import { showConfirm } from '../../utils/confirm'
import { logicalOr } from './logicalOr'

/**
 * Confirmation options for unsaved changes
 */
const UNSAVED_CHANGES_OPTIONS = {
  title: 'Unsaved Changes',
  confirmText: 'Close',
  cancelText: 'Cancel',
  type: 'warning' as const
}

/**
 * Confirm unsaved changes before closing
 * 
 * @param onConfirm Callback to execute if confirmed
 * @returns Promise that resolves when confirmation is complete
 */
export async function confirmUnsavedChanges(
  onConfirm: () => void | Promise<void>
): Promise<void> {
  const confirmed = await showConfirm(
    'This workflow has unsaved changes. Close anyway?',
    UNSAVED_CHANGES_OPTIONS
  )
  
  if (confirmed) {
    await onConfirm()
  }
}

/**
 * Confirm delete action
 * 
 * @param itemName Name of the item to delete (for display)
 * @param onConfirm Callback to execute if confirmed
 * @param options Optional confirmation options
 * @returns Promise that resolves when confirmation is complete
 */
export async function confirmDelete(
  itemName: string,
  onConfirm: () => void | Promise<void>,
  options?: {
    title?: string
    confirmText?: string
    cancelText?: string
  }
): Promise<void> {
  const confirmed = await showConfirm(
    `Are you sure you want to delete "${itemName}"?`,
    { 
      title: logicalOr(options?.title, 'Delete'), 
      confirmText: logicalOr(options?.confirmText, 'Delete'), 
      cancelText: logicalOr(options?.cancelText, 'Cancel'), 
      type: 'danger' 
    }
  )
  
  if (confirmed) {
    await onConfirm()
  }
}

/**
 * Generic confirmation wrapper
 * 
 * @param message Confirmation message
 * @param options Confirmation options
 * @param onConfirm Callback to execute if confirmed
 * @returns Promise that resolves when confirmation is complete
 */
export async function confirmAction(
  message: string,
  options: {
    title?: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'warning' | 'danger'
  },
  onConfirm: () => void | Promise<void>
): Promise<void> {
  const confirmed = await showConfirm(message, options)
  
  if (confirmed) {
    await onConfirm()
  }
}
