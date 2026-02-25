/**
 * Advanced Filters Panel Component
 * SOLID: Single Responsibility - only handles advanced filter UI
 * DRY: Reusable filter panel component
 * DIP: Depends on abstractions
 */

import { useCallback } from 'react'
import { X } from 'lucide-react'
import type { AdvancedFilterOptions } from '../../hooks/log/useAdvancedFilters'

export interface AdvancedFiltersPanelProps {
  filters: AdvancedFilterOptions
  onFiltersChange: (filters: AdvancedFilterOptions) => void
  onClose?: () => void
  availableWorkflows?: Array<{ id: string; name?: string }>
}

/**
 * Advanced Filters Panel Component
 * Provides advanced filtering options for executions
 */
export default function AdvancedFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
  availableWorkflows = [],
}: AdvancedFiltersPanelProps) {
  const updateFilter = useCallback(
    (key: keyof AdvancedFilterOptions, value: any) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      })
    },
    [filters, onFiltersChange]
  )

  const clearFilter = useCallback(
    (key: keyof AdvancedFilterOptions) => {
      const newFilters = { ...filters }
      delete newFilters[key]
      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="start-date" className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={
                  filters.dateRange?.start
                    ? filters.dateRange.start.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  updateFilter('dateRange', {
                    ...filters.dateRange,
                    start: date,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input
                id="end-date"
                type="date"
                value={
                  filters.dateRange?.end
                    ? filters.dateRange.end.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  updateFilter('dateRange', {
                    ...filters.dateRange,
                    end: date,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {(filters.dateRange?.start || filters.dateRange?.end) && (
            <button
              onClick={() => clearFilter('dateRange')}
              className="mt-1 text-xs text-primary-600 hover:text-primary-700"
            >
              Clear date range
            </button>
          )}
        </div>

        {/* Duration Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (seconds)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <input
                type="number"
                value={filters.minDuration ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                  updateFilter('minDuration', value)
                }}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <input
                type="number"
                value={filters.maxDuration ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                  updateFilter('maxDuration', value)
                }}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {(filters.minDuration !== undefined || filters.maxDuration !== undefined) && (
            <button
              onClick={() => {
                clearFilter('minDuration')
                clearFilter('maxDuration')
              }}
              className="mt-1 text-xs text-primary-600 hover:text-primary-700"
            >
              Clear duration
            </button>
          )}
        </div>

        {/* Error Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Error Status
          </label>
          <select
            value={
              filters.hasError === undefined
                ? 'all'
                : filters.hasError
                ? 'with-error'
                : 'no-error'
            }
            onChange={(e) => {
              const value =
                e.target.value === 'all'
                  ? undefined
                  : e.target.value === 'with-error'
                  ? true
                  : false
              updateFilter('hasError', value)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="with-error">With Errors</option>
            <option value="no-error">No Errors</option>
          </select>
        </div>

        {/* Workflow Filter */}
        {availableWorkflows.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflows
            </label>
            <select
              multiple
              value={filters.workflowIds || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                updateFilter('workflowIds', selected.length > 0 ? selected : undefined)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              size={Math.min(availableWorkflows.length, 5)}
            >
              {availableWorkflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name || workflow.id.slice(0, 8)}...
                </option>
              ))}
            </select>
            {filters.workflowIds && filters.workflowIds.length > 0 && (
              <button
                onClick={() => clearFilter('workflowIds')}
                className="mt-1 text-xs text-primary-600 hover:text-primary-700"
              >
                Clear workflows
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
