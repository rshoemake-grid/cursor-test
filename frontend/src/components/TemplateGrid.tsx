/**
 * TemplateGrid Component
 * Renders a grid of template/agent cards with empty state handling
 * Performance: Memoized to prevent unnecessary re-renders when parent updates
 */

import { memo } from 'react'
import { TemplateCard } from './TemplateCard'
// Domain-based imports - Phase 7
import type { Template, AgentTemplate } from '../hooks/marketplace'

interface TemplateGridProps {
  items: (Template | AgentTemplate)[]
  selectedIds: Set<string>
  type: 'template' | 'agent'
  onToggleSelect: (id: string) => void
  onCardClick: (e: React.MouseEvent, id: string) => void
  getDifficultyColor: (difficulty: string) => string
  emptyMessage?: string
  footerText?: string
}

export const TemplateGrid = memo(function TemplateGrid({
  items,
  selectedIds,
  type,
  onToggleSelect,
  onCardClick,
  getDifficultyColor,
  emptyMessage = 'No items found. Try adjusting your filters.',
  footerText,
}: TemplateGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  // Filter out duplicates by ID to prevent React key warnings
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex((t) => t.id === item.id)
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueItems.map((item, index) => {
        const isSelected = selectedIds.has(item.id)
        // Use combination of id and index to ensure unique keys even if duplicates slip through
        return (
          <TemplateCard
            key={`${item.id}-${index}`}
            item={item}
            isSelected={isSelected}
            type={type}
            onToggleSelect={onToggleSelect}
            onClick={onCardClick}
            getDifficultyColor={getDifficultyColor}
            footerText={footerText}
          />
        )
      })}
    </div>
  )
})
