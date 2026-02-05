/**
 * Marketplace Action Buttons Component
 * Single Responsibility: Only renders action buttons for marketplace selections
 * DRY: Reusable component for workflow and agent action buttons
 */

import React from 'react'
import { Download, Trash2 } from 'lucide-react'

interface ActionButtonsProps {
  selectedCount: number
  hasOfficial: boolean
  onLoad?: () => void
  onDelete?: () => void
  onUse?: () => void
  type: 'workflow' | 'agent'
  showDelete?: boolean
}

export function MarketplaceActionButtons({
  selectedCount,
  hasOfficial,
  onLoad,
  onDelete,
  onUse,
  type,
  showDelete = true,
}: ActionButtonsProps) {
  if (selectedCount === 0) {
    return null
  }

  const typeLabel = type === 'workflow' ? 'Workflow' : 'Agent'
  const typeLabelPlural = type === 'workflow' ? 'Workflows' : 'Agents'

  return (
    <>
      {onLoad && (
        <button
          onClick={onLoad}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Load {selectedCount} {typeLabel}{selectedCount > 1 ? 's' : ''}
        </button>
      )}
      
      {onUse && (
        <button
          onClick={onUse}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Use {selectedCount} {typeLabel}{selectedCount > 1 ? 's' : ''}
        </button>
      )}

      {showDelete && !hasOfficial && onDelete && (
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete {selectedCount} {typeLabelPlural}
        </button>
      )}
    </>
  )
}
