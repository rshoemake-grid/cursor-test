/**
 * TemplateCard Component
 * Renders a single template or agent card in the marketplace
 */

import { Clock, Heart, TrendingUp } from 'lucide-react'
// Domain-based imports - Phase 7
import type { Template, AgentTemplate } from '../hooks/marketplace'

interface TemplateCardProps {
  item: Template | AgentTemplate
  isSelected: boolean
  type: 'template' | 'agent'
  onToggleSelect: (id: string) => void
  onClick: (e: React.MouseEvent, id: string) => void
  getDifficultyColor: (difficulty: string) => string
  footerText?: string
}

export function TemplateCard({
  item,
  isSelected,
  type,
  onToggleSelect,
  onClick,
  getDifficultyColor,
  footerText,
}: TemplateCardProps) {
  const isAgent = type === 'agent'
  const agent = isAgent ? (item as AgentTemplate) : null
  const template = !isAgent ? (item as Template) : null

  return (
    <div
      onClick={(e) => onClick(e, item.id)}
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-2 ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-200'
          : 'border-transparent'
      }`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelect(item.id)
              }}
              className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {isAgent ? (agent?.name || agent?.label) : template?.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {item.is_official && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Official
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {isAgent ? (
            <>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{agent?.estimated_time || 'N/A'}</span>
              </div>
              {agent?.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {agent.category
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{template?.uses_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{template?.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{template?.estimated_time || 'N/A'}</span>
              </div>
            </>
          )}
          {item.author_name && (
            <div className="flex items-center gap-1 text-gray-600">
              <span className="font-medium">By:</span>
              <span>{item.author_name}</span>
            </div>
          )}
        </div>

        {/* Difficulty */}
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
            item.difficulty || 'beginner'
          )}`}
        >
          {item.difficulty || 'beginner'}
        </span>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div
          className={`text-sm text-center py-2 px-4 rounded-lg ${
            isSelected
              ? 'bg-primary-100 text-primary-700 font-medium'
              : 'text-gray-500'
          }`}
        >
          {footerText ||
            (isSelected
              ? 'Selected - Click to use'
              : 'Click card or checkbox to select')}
        </div>
      </div>
    </div>
  )
}
