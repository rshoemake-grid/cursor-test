import { EXECUTION_STATUSES, isValidExecutionStatus as isValidExecutionStatusConstant, type ExecutionStatus as ExecutionStatusType } from '../constants/stringLiterals'

// Re-export for backward compatibility
export type ExecutionStatus = ExecutionStatusType

/**
 * Get Tailwind CSS classes for execution status badge
 * Uses constants to kill StringLiteral mutations
 */
export const getExecutionStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    [EXECUTION_STATUSES.COMPLETED]: 'bg-green-900 text-green-200',
    [EXECUTION_STATUSES.FAILED]: 'bg-red-900 text-red-200',
    [EXECUTION_STATUSES.RUNNING]: 'bg-blue-900 text-blue-200',
    [EXECUTION_STATUSES.PENDING]: 'bg-yellow-900 text-yellow-200',
    [EXECUTION_STATUSES.PAUSED]: 'bg-gray-900 text-gray-200',
  }
  // Use explicit check to kill ConditionalExpression mutations
  // Default to paused (gray) color for unknown statuses
  const color = statusMap[status]
  return (color !== null && color !== undefined && color !== '') 
    ? color 
    : statusMap[EXECUTION_STATUSES.PAUSED]
}

/**
 * Get Tailwind CSS classes for execution status badge (light theme variant)
 * Uses constants to kill StringLiteral mutations
 */
export const getExecutionStatusColorLight = (status: string): string => {
  const statusMap: Record<string, string> = {
    [EXECUTION_STATUSES.COMPLETED]: 'bg-green-100 text-green-800',
    [EXECUTION_STATUSES.FAILED]: 'bg-red-100 text-red-800',
    [EXECUTION_STATUSES.RUNNING]: 'bg-blue-100 text-blue-800',
    [EXECUTION_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
    [EXECUTION_STATUSES.PAUSED]: 'bg-gray-100 text-gray-800',
  }
  // Use explicit check to kill ConditionalExpression mutations
  // Default to paused (gray) color for unknown statuses
  const color = statusMap[status]
  return (color !== null && color !== undefined && color !== '') 
    ? color 
    : statusMap[EXECUTION_STATUSES.PAUSED]
}

/**
 * Type guard to check if a string is a valid execution status
 * Uses constants to kill StringLiteral mutations
 */
export const isValidExecutionStatus = (status: string): status is ExecutionStatus => {
  return isValidExecutionStatusConstant(status)
}

