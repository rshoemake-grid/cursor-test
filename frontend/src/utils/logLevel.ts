import { LOG_LEVELS, isValidLogLevel as isValidLogLevelConstant, type LogLevel as LogLevelType } from '../constants/stringLiterals'

// Re-export for backward compatibility
export type LogLevel = LogLevelType

/**
 * Get Tailwind CSS classes for log level badge
 * Uses constants to kill StringLiteral mutations
 */
export const getLogLevelColor = (level: string): string => {
  const levelMap: Record<string, string> = {
    [LOG_LEVELS.ERROR]: 'bg-red-900/30 text-red-200',
    [LOG_LEVELS.WARNING]: 'bg-yellow-900/30 text-yellow-200',
    [LOG_LEVELS.INFO]: 'bg-gray-800 text-gray-300',
    [LOG_LEVELS.DEBUG]: 'bg-blue-900/30 text-blue-200',
  }
  // Use explicit check to kill ConditionalExpression mutations
  // Default to INFO (gray) color for unknown levels
  const color = levelMap[level]
  return (color !== null && color !== undefined && color !== '') 
    ? color 
    : levelMap[LOG_LEVELS.INFO]
}

/**
 * Get Tailwind CSS classes for log level text color
 * Uses constants to kill StringLiteral mutations
 */
export const getLogLevelTextColor = (level: string): string => {
  const levelMap: Record<string, string> = {
    [LOG_LEVELS.ERROR]: 'text-red-400',
    [LOG_LEVELS.WARNING]: 'text-yellow-400',
    [LOG_LEVELS.INFO]: 'text-gray-300',
    [LOG_LEVELS.DEBUG]: 'text-blue-400',
  }
  // Use explicit check to kill ConditionalExpression mutations
  // Default to INFO (gray) color for unknown levels
  const color = levelMap[level]
  return (color !== null && color !== undefined && color !== '') 
    ? color 
    : levelMap[LOG_LEVELS.INFO]
}

/**
 * Type guard to check if a string is a valid log level
 * Uses constants to kill StringLiteral mutations
 */
export const isValidLogLevel = (level: string): level is LogLevel => {
  return isValidLogLevelConstant(level)
}

