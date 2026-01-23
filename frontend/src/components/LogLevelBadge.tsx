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
  const normalizedLevel = isValidLogLevel(level) ? level : 'INFO'
  const colorClasses = showBackground 
    ? getLogLevelColor(normalizedLevel)
    : ''
  const textColor = getLogLevelTextColor(normalizedLevel)
  
  return (
    <span className={`font-semibold ${showBackground ? colorClasses : textColor} ${className}`}>
      {normalizedLevel}
    </span>
  )
}

