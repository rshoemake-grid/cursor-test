/**
 * Execution Formatting Utilities
 * DRY: Centralized formatting logic for execution-related data
 * SOLID: Single Responsibility - only handles formatting
 */

import React from 'react'
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Format duration between two timestamps
 * 
 * @param startedAt - Start timestamp
 * @param completedAt - Optional completion timestamp (uses current time if not provided)
 * @returns Formatted duration string (e.g., "5s", "2m 30s", "1h 15m")
 */
export function formatExecutionDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000) // seconds
  
  if (duration < 60) {
    return `${duration}s`
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}m ${seconds}s`
  } else {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Get status icon component for execution status
 * 
 * @param status - Execution status
 * @returns React component for the status icon
 */
export function getExecutionStatusIcon(status: string): ReactNode {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'running':
      return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />
  }
}

/**
 * Sort executions by start time (newest first)
 * 
 * @param executions - Array of executions to sort
 * @returns Sorted array (newest first)
 */
export function sortExecutionsByStartTime<T extends { started_at: string }>(
  executions: T[]
): T[] {
  return [...executions].sort((a, b) => {
    const aTime = new Date(a.started_at).getTime()
    const bTime = new Date(b.started_at).getTime()
    return bTime - aTime
  })
}

/**
 * Calculate execution progress percentage
 * 
 * @param nodeStates - Record of node states
 * @returns Progress percentage (0-100)
 */
export function calculateExecutionProgress(
  nodeStates: Record<string, { status?: string }> | undefined
): number {
  if (!nodeStates) {
    return 0
  }
  
  const nodeEntries = Object.entries(nodeStates)
  const totalNodes = nodeEntries.length
  
  if (totalNodes === 0) {
    return 0
  }
  
  const completedNodes = nodeEntries.filter(([_, state]) => {
    return state?.status === 'completed'
  }).length
  
  return Math.min(Math.floor((completedNodes / totalNodes) * 100), 100)
}
