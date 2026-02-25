/**
 * Tests for Export Formatting Utilities
 * Follows SOLID, DRY, and DIP principles
 */

import {
  exportToJSON,
  exportToCSV,
  exportExecutionsToJSON,
  exportExecutionsToCSV,
} from './exportFormatters'
import type { ExecutionState } from '../types/workflow'

describe('exportFormatters utilities', () => {
  const mockExecution1: ExecutionState = {
    execution_id: 'exec-1',
    workflow_id: 'workflow-1',
    status: 'completed',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:00:05Z',
    node_states: {},
    variables: {},
    logs: [],
  }

  const mockExecution2: ExecutionState = {
    execution_id: 'exec-2',
    workflow_id: 'workflow-2',
    status: 'failed',
    started_at: '2024-01-01T11:00:00Z',
    completed_at: '2024-01-01T11:00:10Z',
    error: 'Test error',
    node_states: {},
    variables: {},
    logs: [],
  }

  describe('exportToJSON', () => {
    it('should export executions to JSON', () => {
      const result = exportToJSON([mockExecution1, mockExecution2])
      const parsed = JSON.parse(result)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].execution_id).toBe('exec-1')
      expect(parsed[1].execution_id).toBe('exec-2')
    })

    it('should handle empty array', () => {
      const result = exportToJSON([])
      expect(result).toBe('[]')
    })

    it('should format JSON with indentation', () => {
      const result = exportToJSON([mockExecution1])
      expect(result).toContain('\n')
      expect(result).toContain('  ') // Indentation
    })
  })

  describe('exportToCSV', () => {
    it('should export executions to CSV', () => {
      const result = exportToCSV([mockExecution1, mockExecution2])
      const lines = result.split('\n')

      expect(lines[0]).toContain('Execution ID')
      expect(lines[0]).toContain('Status')
      expect(lines.length).toBe(3) // Header + 2 data rows
    })

    it('should handle empty array', () => {
      const result = exportToCSV([])
      expect(result).toBe('')
    })

    it('should escape quotes in CSV', () => {
      const executionWithQuote: ExecutionState = {
        ...mockExecution1,
        error: 'Error with "quotes"',
      }

      const result = exportToCSV([executionWithQuote])
      expect(result).toContain('""quotes""')
    })

    it('should include all required fields', () => {
      const result = exportToCSV([mockExecution1])
      expect(result).toContain('Execution ID')
      expect(result).toContain('Workflow ID')
      expect(result).toContain('Status')
      expect(result).toContain('Started At')
      expect(result).toContain('Completed At')
      expect(result).toContain('Duration')
      expect(result).toContain('Current Node')
      expect(result).toContain('Error')
    })
  })

  describe('exportExecutionsToJSON', () => {
    beforeEach(() => {
      // Mock document.createElement and URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
    })

    it('should create download link for JSON', () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any))
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any))
      const clickSpy = jest.fn()

      createElementSpy.mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: clickSpy,
          } as any
        }
        return document.createElement(tagName)
      })

      exportExecutionsToJSON([mockExecution1])

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('exportExecutionsToCSV', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
    })

    it('should create download link for CSV', () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any))
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any))
      const clickSpy = jest.fn()

      createElementSpy.mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: clickSpy,
          } as any
        }
        return document.createElement(tagName)
      })

      exportExecutionsToCSV([mockExecution1])

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })
})
