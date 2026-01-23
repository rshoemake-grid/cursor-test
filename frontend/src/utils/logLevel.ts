export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'

/**
 * Get Tailwind CSS classes for log level badge
 */
export const getLogLevelColor = (level: string): string => {
  const levelMap: Record<string, string> = {
    ERROR: 'bg-red-900/30 text-red-200',
    WARNING: 'bg-yellow-900/30 text-yellow-200',
    INFO: 'bg-gray-800 text-gray-300',
    DEBUG: 'bg-blue-900/30 text-blue-200',
  }
  return levelMap[level] || 'bg-gray-800 text-gray-300'
}

/**
 * Get Tailwind CSS classes for log level text color
 */
export const getLogLevelTextColor = (level: string): string => {
  const levelMap: Record<string, string> = {
    ERROR: 'text-red-400',
    WARNING: 'text-yellow-400',
    INFO: 'text-gray-300',
    DEBUG: 'text-blue-400',
  }
  return levelMap[level] || 'text-gray-300'
}

/**
 * Type guard to check if a string is a valid log level
 */
export const isValidLogLevel = (level: string): level is LogLevel => {
  return ['INFO', 'WARNING', 'ERROR', 'DEBUG'].includes(level)
}

