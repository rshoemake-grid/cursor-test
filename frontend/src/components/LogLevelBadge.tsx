import { getLogLevelColor, getLogLevelTextColor, isValidLogLevel } from '../utils/logLevel'

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
  const normalizedLevel = isValidLogLevel(level) === true ? level : 'INFO'
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

