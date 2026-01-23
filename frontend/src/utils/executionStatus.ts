export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'

/**
 * Get Tailwind CSS classes for execution status badge
 */
export const getExecutionStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: 'bg-green-900 text-green-200',
    failed: 'bg-red-900 text-red-200',
    running: 'bg-blue-900 text-blue-200',
    pending: 'bg-yellow-900 text-yellow-200',
    paused: 'bg-gray-900 text-gray-200',
  }
  return statusMap[status] || 'bg-gray-900 text-gray-200'
}

/**
 * Get Tailwind CSS classes for execution status badge (light theme variant)
 */
export const getExecutionStatusColorLight = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-gray-100 text-gray-800',
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Type guard to check if a string is a valid execution status
 */
export const isValidExecutionStatus = (status: string): status is ExecutionStatus => {
  return ['pending', 'running', 'completed', 'failed', 'paused'].includes(status)
}

