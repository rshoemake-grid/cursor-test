/**
 * Execution List Item Component
 * SOLID: Single Responsibility - only renders a single execution item
 * DRY: Uses extracted utility functions
 * DIP: Depends on abstractions (props) not concrete implementations
 */

import { Clock, CheckCircle, Eye } from 'lucide-react'
import ExecutionStatusBadge from '../ExecutionStatusBadge'
import {
  getExecutionStatusIcon,
  formatExecutionDuration,
  calculateExecutionProgress,
} from '../../utils/executionFormat'
import type { ExecutionState } from '../../types/workflow'

export interface ExecutionListItemProps {
  execution: ExecutionState
  onExecutionClick: (executionId: string) => void
  isSelected?: boolean
  onSelect?: (executionId: string) => void
  showCheckbox?: boolean
}

/**
 * Execution List Item Component
 * Renders a single execution in the log list
 */
export default function ExecutionListItem({
  execution,
  onExecutionClick,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: ExecutionListItemProps) {
  const isActive = execution.status === 'running' || execution.status === 'pending'
  const progress = calculateExecutionProgress(execution.node_states)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(execution.execution_id)
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleItemClick = () => {
    if (!showCheckbox) {
      onExecutionClick(execution.execution_id)
    }
  }

  return (
    <div
      onClick={handleItemClick}
      className={`
        bg-white rounded-lg shadow-sm border p-4 transition-all cursor-pointer
        ${isSelected ? 'border-primary-500 bg-primary-50' : ''}
        ${isActive && !isSelected ? 'border-blue-500 hover:border-blue-400' : ''}
        ${!isActive && !isSelected ? 'border-gray-200 hover:border-gray-300' : ''}
        hover:shadow-md
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Checkbox for bulk selection */}
        {showCheckbox && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={handleCheckboxClick}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              aria-label={`Select execution ${execution.execution_id}`}
            />
          </div>
        )}
        {/* Left side: Execution info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getExecutionStatusIcon(execution.status)}
            <span className="font-mono text-sm text-gray-700">
              {execution.execution_id.slice(0, 8)}...
            </span>
            <ExecutionStatusBadge status={execution.status} variant="light" />
            <span className="text-xs text-gray-500">
              Workflow: {execution.workflow_id.slice(0, 8)}...
            </span>
          </div>

          {/* Current Node */}
          {execution.current_node && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">Current Node:</span>
              <span className="text-sm font-medium text-gray-700">
                {execution.current_node}
              </span>
            </div>
          )}

          {/* Progress indicator for running executions */}
          {execution.status === 'running' && execution.node_states && (
            <div className="mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Progress:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden max-w-xs">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Started: {new Date(execution.started_at).toLocaleString()}
              </span>
            </div>
            {execution.completed_at && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  Completed: {new Date(execution.completed_at).toLocaleString()}
                </span>
              </div>
            )}
            <div className="text-gray-600 whitespace-nowrap">
              Duration: {formatExecutionDuration(execution.started_at, execution.completed_at)}
            </div>
          </div>
        </div>

        {/* Right side: View button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExecutionClick(execution.execution_id)
            }}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      </div>
    </div>
  )
}
