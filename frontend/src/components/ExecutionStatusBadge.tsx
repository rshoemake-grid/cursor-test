import { getExecutionStatusColor, getExecutionStatusColorLight, isValidExecutionStatus } from '../utils/executionStatus'

interface ExecutionStatusBadgeProps {
  status: string
  variant?: 'dark' | 'light'
  className?: string
}

export default function ExecutionStatusBadge({ 
  status, 
  variant = 'dark',
  className = '' 
}: ExecutionStatusBadgeProps) {
  const normalizedStatus = isValidExecutionStatus(status) ? status : 'pending'
  const colorClasses = variant === 'light' 
    ? getExecutionStatusColorLight(normalizedStatus)
    : getExecutionStatusColor(normalizedStatus)
  
  return (
    <div className={`px-3 py-1 rounded text-sm font-medium ${colorClasses} ${className}`}>
      {normalizedStatus}
    </div>
  )
}

