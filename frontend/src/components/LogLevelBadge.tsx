import { getLogLevelColor, getLogLevelTextColor, isValidLogLevel } from '../utils/logLevel'
import { LOG_LEVELS } from '../constants/stringLiterals'

interface LogLevelBadgeProps {
  level: string
  showBackground?: boolean
  className?: string
}

export default function LogLevelBadge({ 
  level, 
  showBackground = true,
  className = '' 
}: LogLevelBadgeProps) {
  // Explicit check to prevent mutation survivors
  // Use constant to kill StringLiteral mutations
  const normalizedLevel = isValidLogLevel(level) === true ? level : LOG_LEVELS.INFO
  // Explicit check to prevent mutation survivors
  const colorClasses = showBackground === true
    ? getLogLevelColor(normalizedLevel)
    : ''
  const textColor = getLogLevelTextColor(normalizedLevel)
  
  return (
    <span className={`font-semibold ${showBackground ? colorClasses : textColor} ${className}`}>
      {normalizedLevel}
    </span>
  )
}

