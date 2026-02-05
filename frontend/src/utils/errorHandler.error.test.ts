/**
 * Tests for errorHandler error handling guards
 * Ensures all error paths are mutation-resistant
 */

import {
  handleApiError,
  handleStorageError,
  handleError,
} from './errorHandler'
import { logger } from './logger'
import { showError } from './notifications'

jest.mock('./logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('./notifications', () => ({
  showError: jest.fn(),
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>
const mockShowError = showError as jest.MockedFunction<typeof showError>

describe('errorHandler - Error Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError - null/undefined guards', () => {
    it('should handle null error object', () => {
      const result = handleApiError(null as any)
      expect(result).toBe('An error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle undefined error object', () => {
      const result = handleApiError(undefined as any)
      expect(result).toBe('An error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle error without response property', () => {
      const error = { message: 'Error message' }
      const result = handleApiError(error)
      expect(result).toBe('Error message')
    })

    it('should handle error.response without data property', () => {
      const error = { response: {} }
      const result = handleApiError(error)
      expect(result).toBe('An error occurred')
    })

    it('should handle error.response.data without detail or message', () => {
      const error = { response: { data: {} } }
      const result = handleApiError(error)
      expect(result).toBe('An error occurred')
    })

    it('should extract error.response.data.detail', () => {
      const error = {
        response: {
          data: { detail: 'Custom error detail' },
        },
      }
      const result = handleApiError(error)
      expect(result).toBe('Custom error detail')
    })

    it('should extract error.response.data.message when detail is missing', () => {
      const error = {
        response: {
          data: { message: 'Error message' },
        },
      }
      const result = handleApiError(error)
      expect(result).toBe('Error message')
    })

    it('should extract error.message when response is missing', () => {
      const error = { message: 'Error message' }
      const result = handleApiError(error)
      expect(result).toBe('Error message')
    })

    it('should use default message when all properties are missing', () => {
      const error = {}
      const result = handleApiError(error)
      expect(result).toBe('An error occurred')
    })

    it('should handle error.response.data.detail as null', () => {
      const error = {
        response: {
          data: { detail: null, message: 'Fallback message' },
        },
      }
      const result = handleApiError(error)
      expect(result).toBe('Fallback message')
    })

    it('should handle error.response.data.message as null', () => {
      const error = {
        response: {
          data: { message: null },
        },
        message: 'Fallback message',
      }
      const result = handleApiError(error)
      expect(result).toBe('Fallback message')
    })

    it('should handle error.message as null', () => {
      const error = { message: null }
      const result = handleApiError(error)
      expect(result).toBe('An error occurred')
    })

    it('should log error with context', () => {
      handleApiError(new Error('Test error'), { context: 'TestContext' })
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[TestContext] API Error:',
        expect.any(Error)
      )
    })

    it('should show notification when requested', () => {
      handleApiError(new Error('Test error'), { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith('Test error')
    })

    it('should not show notification when not requested', () => {
      handleApiError(new Error('Test error'), { showNotification: false })
      expect(mockShowError).not.toHaveBeenCalled()
    })
  })

  describe('handleStorageError - error object guards', () => {
    it('should handle null error object', () => {
      handleStorageError(null as any, 'getItem', 'key')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle undefined error object', () => {
      handleStorageError(undefined as any, 'getItem', 'key')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle error without message property', () => {
      const error = { code: 'QUOTA_EXCEEDED' }
      handleStorageError(error, 'setItem', 'key', { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to setItem storage: Unknown error'
      )
    })

    it('should handle Error instance', () => {
      const error = new Error('Storage error')
      handleStorageError(error, 'getItem', 'key')
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[Storage Error Handler] Storage getItem error for key "key":',
        error
      )
    })

    it('should handle error with message property', () => {
      const error = { message: 'Quota exceeded' }
      handleStorageError(error, 'setItem', 'key', { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to setItem storage: Quota exceeded'
      )
    })

    it('should handle error.message as null', () => {
      const error = { message: null }
      handleStorageError(error, 'removeItem', 'key', { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to removeItem storage: Unknown error'
      )
    })

    it('should handle error.message as undefined', () => {
      const error = { message: undefined }
      handleStorageError(error, 'clear', 'all', { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to clear storage: Unknown error'
      )
    })

    it('should log with context when provided', () => {
      const error = new Error('Test error')
      handleStorageError(error, 'getItem', 'key', { context: 'TestContext' })
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[TestContext] Storage getItem error for key "key":',
        error
      )
    })
  })

  describe('handleError - type guards', () => {
    it('should handle null error', () => {
      const result = handleError(null as any)
      expect(result).toBe('An unexpected error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle undefined error', () => {
      const result = handleError(undefined as any)
      expect(result).toBe('An unexpected error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle Error instance', () => {
      const error = new Error('Error message')
      const result = handleError(error)
      expect(result).toBe('Error message')
      expect(mockLoggerError).toHaveBeenCalledWith('[Error Handler] Error:', error)
    })

    it('should handle string error', () => {
      const result = handleError('String error')
      expect(result).toBe('String error')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle number error', () => {
      const result = handleError(500 as any)
      expect(result).toBe('An unexpected error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle object error without message', () => {
      const error = { code: 500 }
      const result = handleError(error)
      expect(result).toBe('An unexpected error occurred')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle Error instance with null message', () => {
      const error = new Error('')
      error.message = null as any
      const result = handleError(error)
      expect(result).toBe('An unexpected error occurred')
    })

    it('should use custom default message', () => {
      const result = handleError(null as any, {
        defaultMessage: 'Custom default',
      })
      expect(result).toBe('Custom default')
    })

    it('should log with context when provided', () => {
      const error = new Error('Test error')
      handleError(error, { context: 'TestContext' })
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[TestContext] Error:',
        error
      )
    })

    it('should show notification when requested', () => {
      handleError(new Error('Test error'), { showNotification: true })
      expect(mockShowError).toHaveBeenCalledWith('Test error')
    })

    it('should not show notification when not requested', () => {
      handleError(new Error('Test error'), { showNotification: false })
      expect(mockShowError).not.toHaveBeenCalled()
    })
  })
})
