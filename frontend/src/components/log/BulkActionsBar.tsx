/**
 * Bulk Actions Bar Component
 * SOLID: Single Responsibility - only handles bulk action UI
 * DRY: Reusable bulk actions component
 * DIP: Depends on abstractions
 */

import { Trash2, X } from 'lucide-react'

export interface BulkActionsBarProps {
  selectedCount: number
  onDelete: () => void
  onClearSelection: () => void
  isDeleting?: boolean
}

/**
 * Bulk Actions Bar Component
 * Displays actions for selected executions
 */
export default function BulkActionsBar({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="bg-primary-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="font-medium">
          {selectedCount} execution{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
