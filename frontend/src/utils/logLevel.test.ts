// Jest globals - no import needed
import { 
  getLogLevelColor, 
  getLogLevelTextColor, 
  isValidLogLevel,
  type LogLevel 
} from './logLevel'

describe('logLevel utilities', () => {
  describe('getLogLevelColor', () => {
    it('should return correct color for ERROR level', () => {
      expect(getLogLevelColor('ERROR')).toBe('bg-red-900/30 text-red-200')
    })

    it('should return correct color for WARNING level', () => {
      expect(getLogLevelColor('WARNING')).toBe('bg-yellow-900/30 text-yellow-200')
    })

    it('should return correct color for INFO level', () => {
      const result = getLogLevelColor('INFO')
      expect(result).toBe('bg-gray-800 text-gray-300')
      // Verify the exact string to kill mutants that change 'INFO' to empty string
      expect(result).toContain('bg-gray-800')
      expect(result).toContain('text-gray-300')
    })

    it('should return correct color for DEBUG level', () => {
      expect(getLogLevelColor('DEBUG')).toBe('bg-blue-900/30 text-blue-200')
    })

    it('should return default color for unknown level', () => {
      expect(getLogLevelColor('unknown')).toBe('bg-gray-800 text-gray-300')
    })
  })

  describe('getLogLevelTextColor', () => {
    it('should return correct text color for ERROR level', () => {
      expect(getLogLevelTextColor('ERROR')).toBe('text-red-400')
    })

    it('should return correct text color for WARNING level', () => {
      expect(getLogLevelTextColor('WARNING')).toBe('text-yellow-400')
    })

    it('should return correct text color for INFO level', () => {
      const result = getLogLevelTextColor('INFO')
      expect(result).toBe('text-gray-300')
      // Verify the exact string to kill mutants that change 'INFO' to empty string
      expect(result).toContain('text-gray-300')
    })

    it('should return correct text color for DEBUG level', () => {
      expect(getLogLevelTextColor('DEBUG')).toBe('text-blue-400')
    })

    it('should return default text color for unknown level', () => {
      expect(getLogLevelTextColor('unknown')).toBe('text-gray-300')
    })
  })

  describe('isValidLogLevel', () => {
    it('should return true for valid log levels', () => {
      const validLevels: LogLevel[] = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
      validLevels.forEach(level => {
        expect(isValidLogLevel(level)).toBe(true)
      })
    })

    it('should return false for invalid log levels', () => {
      const invalidLevels = ['unknown', 'invalid', '', '123', 'info', 'error']
      invalidLevels.forEach(level => {
        expect(isValidLogLevel(level)).toBe(false)
      })
    })

    it('should act as a type guard', () => {
      const level: string = 'ERROR'
      if (isValidLogLevel(level)) {
        // TypeScript should know level is LogLevel here
        const _test: LogLevel = level
        expect(_test).toBe('ERROR')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle levelMap[level] || fallback for invalid level', () => {
      // Test the || operator fallback
      const invalidLevel = 'invalid-level'
      const result = getLogLevelColor(invalidLevel)
      // Should return fallback
      expect(result).toBe('bg-gray-800 text-gray-300')
    })

    it('should handle levelMap[level] || fallback for empty string', () => {
      const result = getLogLevelColor('')
      // Should return fallback
      expect(result).toBe('bg-gray-800 text-gray-300')
    })

    it('should handle levelMap[level] || fallback for getLogLevelTextColor', () => {
      const invalidLevel = 'invalid-level'
      const result = getLogLevelTextColor(invalidLevel)
      // Should return fallback
      expect(result).toBe('text-gray-300')
    })

    it('should handle isValidLogLevel with empty string', () => {
      expect(isValidLogLevel('')).toBe(false)
    })

    it('should handle isValidLogLevel with case variations', () => {
      expect(isValidLogLevel('info')).toBe(false) // Case sensitive
      expect(isValidLogLevel('Error')).toBe(false) // Case sensitive
    })

    it('should handle all levelMap keys for getLogLevelColor', () => {
      const levels: LogLevel[] = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
      
      for (const level of levels) {
        const result = getLogLevelColor(level)
        // Should not return fallback (should have level-specific color)
        expect(result).toBeTruthy()
        expect(result).toContain('bg-')
        // Verify it's not the default fallback
        if (level !== 'INFO') {
          expect(result).not.toBe('bg-gray-800 text-gray-300')
        }
      }
    })

    it('should handle all levelMap keys for getLogLevelTextColor', () => {
      const levels: LogLevel[] = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
      
      for (const level of levels) {
        const result = getLogLevelTextColor(level)
        // Should not return fallback (should have level-specific color)
        expect(result).toBeTruthy()
        expect(result).toContain('text-')
        // Verify it's not the default fallback
        if (level !== 'INFO') {
          expect(result).not.toBe('text-gray-300')
        }
      }
    })
  })
})

