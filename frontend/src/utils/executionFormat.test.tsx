/**
 * Tests for Execution Formatting Utilities
 * Follows SOLID, DRY, and DIP principles
 */

import {
  formatExecutionDuration,
  getExecutionStatusIcon,
  sortExecutionsByStartTime,
  calculateExecutionProgress,
} from './executionFormat'
import { render } from '@testing-library/react'

describe('executionFormat utilities', () => {
  describe('formatExecutionDuration', () => {
    it('should format duration less than 60 seconds', () => {
      const startedAt = new Date('2024-01-01T10:00:00Z').toISOString()
      const completedAt = new Date('2024-01-01T10:00:05Z').toISOString()
      
      expect(formatExecutionDuration(startedAt, completedAt)).toBe('5s')
    })

    it('should format duration less than 3600 seconds', () => {
      const startedAt = new Date('2024-01-01T10:00:00Z').toISOString()
      const completedAt = new Date('2024-01-01T10:02:30Z').toISOString()
      
      expect(formatExecutionDuration(startedAt, completedAt)).toBe('2m 30s')
    })

    it('should format duration greater than 3600 seconds', () => {
      const startedAt = new Date('2024-01-01T10:00:00Z').toISOString()
      const completedAt = new Date('2024-01-01T11:15:00Z').toISOString()
      
      expect(formatExecutionDuration(startedAt, completedAt)).toBe('1h 15m')
    })

    it('should use current time when completedAt is not provided', () => {
      const startedAt = new Date(Date.now() - 5000).toISOString()
      const result = formatExecutionDuration(startedAt)
      
      expect(result).toBe('5s')
    })

    it('should handle zero duration', () => {
      const startedAt = new Date('2024-01-01T10:00:00Z').toISOString()
      const completedAt = new Date('2024-01-01T10:00:00Z').toISOString()
      
      expect(formatExecutionDuration(startedAt, completedAt)).toBe('0s')
    })
  })

  describe('getExecutionStatusIcon', () => {
    it('should return CheckCircle for completed status', () => {
      const icon = getExecutionStatusIcon('completed')
      const { container } = render(<>{icon}</>)
      
      expect(container.querySelector('.text-green-500')).toBeInTheDocument()
    })

    it('should return XCircle for failed status', () => {
      const icon = getExecutionStatusIcon('failed')
      const { container } = render(<>{icon}</>)
      
      expect(container.querySelector('.text-red-500')).toBeInTheDocument()
    })

    it('should return Play for running status', () => {
      const icon = getExecutionStatusIcon('running')
      const { container } = render(<>{icon}</>)
      
      expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should return Clock for pending status', () => {
      const icon = getExecutionStatusIcon('pending')
      const { container } = render(<>{icon}</>)
      
      expect(container.querySelector('.text-yellow-500')).toBeInTheDocument()
    })

    it('should return AlertCircle for unknown status', () => {
      const icon = getExecutionStatusIcon('unknown')
      const { container } = render(<>{icon}</>)
      
      expect(container.querySelector('.text-gray-500')).toBeInTheDocument()
    })
  })

  describe('sortExecutionsByStartTime', () => {
    it('should sort executions newest first', () => {
      const executions = [
        { started_at: '2024-01-01T10:00:00Z', id: '1' },
        { started_at: '2024-01-01T12:00:00Z', id: '2' },
        { started_at: '2024-01-01T11:00:00Z', id: '3' },
      ]
      
      const sorted = sortExecutionsByStartTime(executions)
      
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })

    it('should not mutate original array', () => {
      const executions = [
        { started_at: '2024-01-01T10:00:00Z', id: '1' },
        { started_at: '2024-01-01T12:00:00Z', id: '2' },
      ]
      
      const original = [...executions]
      sortExecutionsByStartTime(executions)
      
      expect(executions).toEqual(original)
    })

    it('should handle empty array', () => {
      const executions: Array<{ started_at: string }> = []
      
      expect(sortExecutionsByStartTime(executions)).toEqual([])
    })
  })

  describe('calculateExecutionProgress', () => {
    it('should calculate progress correctly', () => {
      const nodeStates = {
        node1: { status: 'completed' },
        node2: { status: 'completed' },
        node3: { status: 'running' },
        node4: { status: 'pending' },
      }
      
      expect(calculateExecutionProgress(nodeStates)).toBe(50)
    })

    it('should return 100 when all nodes completed', () => {
      const nodeStates = {
        node1: { status: 'completed' },
        node2: { status: 'completed' },
      }
      
      expect(calculateExecutionProgress(nodeStates)).toBe(100)
    })

    it('should return 0 when no nodes completed', () => {
      const nodeStates = {
        node1: { status: 'running' },
        node2: { status: 'pending' },
      }
      
      expect(calculateExecutionProgress(nodeStates)).toBe(0)
    })

    it('should return 0 when nodeStates is undefined', () => {
      expect(calculateExecutionProgress(undefined)).toBe(0)
    })

    it('should return 0 when nodeStates is empty', () => {
      expect(calculateExecutionProgress({})).toBe(0)
    })

    it('should cap progress at 100', () => {
      const nodeStates = {
        node1: { status: 'completed' },
        node2: { status: 'completed' },
        node3: { status: 'completed' },
      }
      
      // This should still return 100, not more
      expect(calculateExecutionProgress(nodeStates)).toBe(100)
    })
  })
})
