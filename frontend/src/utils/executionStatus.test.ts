// Jest globals - no import needed
import { 
  getExecutionStatusColor, 
  getExecutionStatusColorLight, 
  isValidExecutionStatus,
  type ExecutionStatus 
} from './executionStatus'

describe('executionStatus utilities', () => {
  describe('getExecutionStatusColor', () => {
    it('should return correct color for completed status', () => {
      expect(getExecutionStatusColor('completed')).toBe('bg-green-900 text-green-200')
    })

    it('should return correct color for failed status', () => {
      expect(getExecutionStatusColor('failed')).toBe('bg-red-900 text-red-200')
    })

    it('should return correct color for running status', () => {
      expect(getExecutionStatusColor('running')).toBe('bg-blue-900 text-blue-200')
    })

    it('should return correct color for pending status', () => {
      expect(getExecutionStatusColor('pending')).toBe('bg-yellow-900 text-yellow-200')
    })

    it('should return correct color for paused status', () => {
      const result = getExecutionStatusColor('paused')
      expect(result).toBe('bg-gray-900 text-gray-200')
      // Verify the exact string to kill mutants that change 'paused' to empty string
      expect(result).toContain('bg-gray-900')
      expect(result).toContain('text-gray-200')
    })

    it('should return default color for unknown status', () => {
      expect(getExecutionStatusColor('unknown')).toBe('bg-gray-900 text-gray-200')
    })
  })

  describe('getExecutionStatusColorLight', () => {
    it('should return correct light color for completed status', () => {
      expect(getExecutionStatusColorLight('completed')).toBe('bg-green-100 text-green-800')
    })

    it('should return correct light color for failed status', () => {
      expect(getExecutionStatusColorLight('failed')).toBe('bg-red-100 text-red-800')
    })

    it('should return correct light color for running status', () => {
      expect(getExecutionStatusColorLight('running')).toBe('bg-blue-100 text-blue-800')
    })

    it('should return correct light color for pending status', () => {
      expect(getExecutionStatusColorLight('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return correct light color for paused status', () => {
      const result = getExecutionStatusColorLight('paused')
      expect(result).toBe('bg-gray-100 text-gray-800')
      // Verify the exact string to kill mutants that change 'paused' to empty string
      expect(result).toContain('bg-gray-100')
      expect(result).toContain('text-gray-800')
    })

    it('should return default light color for unknown status', () => {
      expect(getExecutionStatusColorLight('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('isValidExecutionStatus', () => {
    it('should return true for valid statuses', () => {
      const validStatuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
      validStatuses.forEach(status => {
        expect(isValidExecutionStatus(status)).toBe(true)
      })
    })

    it('should return false for invalid statuses', () => {
      const invalidStatuses = ['unknown', 'invalid', '', '123', null, undefined]
      invalidStatuses.forEach(status => {
        expect(isValidExecutionStatus(status as string)).toBe(false)
      })
    })

    it('should act as a type guard', () => {
      const status: string = 'completed'
      if (isValidExecutionStatus(status)) {
        // TypeScript should know status is ExecutionStatus here
        const _test: ExecutionStatus = status
        expect(_test).toBe('completed')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle statusMap[status] || fallback for invalid status', () => {
      // Test the || operator fallback
      const invalidStatus = 'invalid-status'
      const result = getExecutionStatusColor(invalidStatus)
      // Should return fallback
      expect(result).toBe('bg-gray-900 text-gray-200')
    })

    it('should handle statusMap[status] || fallback for empty string', () => {
      const result = getExecutionStatusColor('')
      // Should return fallback
      expect(result).toBe('bg-gray-900 text-gray-200')
    })

    it('should handle statusMap[status] || fallback for light variant', () => {
      const invalidStatus = 'invalid-status'
      const result = getExecutionStatusColorLight(invalidStatus)
      // Should return fallback
      expect(result).toBe('bg-gray-100 text-gray-800')
    })

    it('should handle isValidExecutionStatus with empty string', () => {
      expect(isValidExecutionStatus('')).toBe(false)
    })

    it('should handle isValidExecutionStatus with case variations', () => {
      expect(isValidExecutionStatus('PENDING')).toBe(false) // Case sensitive
      expect(isValidExecutionStatus('Running')).toBe(false) // Case sensitive
    })

    it('should handle all statusMap keys for getExecutionStatusColor', () => {
      const statuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
      
      for (const status of statuses) {
        const result = getExecutionStatusColor(status)
        // Should not return fallback (should have status-specific color)
        expect(result).toBeTruthy()
        expect(result).toContain('bg-')
        // Verify it's not the default fallback
        if (status !== 'paused') {
          expect(result).not.toBe('bg-gray-900 text-gray-200')
        }
      }
    })

    it('should handle all statusMap keys for getExecutionStatusColorLight', () => {
      const statuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
      
      for (const status of statuses) {
        const result = getExecutionStatusColorLight(status)
        // Should not return fallback (should have status-specific color)
        expect(result).toBeTruthy()
        expect(result).toContain('bg-')
        // Verify it's not the default fallback
        if (status !== 'paused') {
          expect(result).not.toBe('bg-gray-100 text-gray-800')
        }
      }
    })
  })
})

