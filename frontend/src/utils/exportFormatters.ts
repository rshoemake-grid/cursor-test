/**
 * Export Formatting Utilities
 * DRY: Centralized export logic
 * SOLID: Single Responsibility - only handles data formatting for export
 */

import type { ExecutionState } from '../types/workflow'

/**
 * Export executions to JSON format
 */
export function exportToJSON(executions: ExecutionState[]): string {
  return JSON.stringify(executions, null, 2)
}

/**
 * Export executions to CSV format
 */
export function exportToCSV(executions: ExecutionState[]): string {
  if (executions.length === 0) {
    return ''
  }

  const headers = [
    'Execution ID',
    'Workflow ID',
    'Status',
    'Started At',
    'Completed At',
    'Duration (seconds)',
    'Current Node',
    'Error',
  ]

  const rows = executions.map((execution) => {
    const duration = execution.completed_at
      ? Math.floor(
          (new Date(execution.completed_at).getTime() -
            new Date(execution.started_at).getTime()) /
            1000
        )
      : Math.floor(
          (Date.now() - new Date(execution.started_at).getTime()) / 1000
        )

    return [
      execution.execution_id,
      execution.workflow_id,
      execution.status,
      execution.started_at,
      execution.completed_at || '',
      duration.toString(),
      execution.current_node || '',
      execution.error || '',
    ]
  })

  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )

  return csvRows.join('\n')
}

/**
 * Download data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export executions to JSON file
 */
export function exportExecutionsToJSON(
  executions: ExecutionState[],
  filename?: string
): void {
  const json = exportToJSON(executions)
  const defaultFilename = `executions-${new Date().toISOString().split('T')[0]}.json`
  downloadFile(json, filename || defaultFilename, 'application/json')
}

/**
 * Export executions to CSV file
 */
export function exportExecutionsToCSV(
  executions: ExecutionState[],
  filename?: string
): void {
  const csv = exportToCSV(executions)
  const defaultFilename = `executions-${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename || defaultFilename, 'text/csv')
}
