import { handleApiError, handleStorageError, handleError } from './errorHandler'
import { logger } from './logger'
import { showError } from './notifications'

// Mock dependencies
jest.mock('./logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('./notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
}))

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('should extract error message from response.data.detail', () => {
      const error = {
        response: {
          data: { detail: 'Custom error message' },
          status: 400,
        },
      }

      const message = handleApiError(error)

      expect(message).toBe('Custom error message')
      expect(logger.error).toHaveBeenCalled()
      expect(showError).toHaveBeenCalledWith('Custom error message')
    })

    it('should extract error message from response.data.message', () => {
      const error = {
        response: {
          data: { message: 'Error message' },
          status: 500,
        },
      }

      const message = handleApiError(error)

      expect(message).toBe('Error message')
    })

    it('should fall back to error.message', () => {
      const error = new Error('Network error')

      const message = handleApiError(error)

      expect(message).toBe('Network error')
    })

    it('should use default message when no message available', () => {
      const error = {}

      const message = handleApiError(error, { defaultMessage: 'Default error' })

      expect(message).toBe('Default error')
    })

    it('should not show notification when showNotification is false', () => {
      const error = { message: 'Error' }

      handleApiError(error, { showNotification: false })

      expect(showError).not.toHaveBeenCalled()
    })

    it('should not log when logError is false', () => {
      const error = { message: 'Error' }

      handleApiError(error, { logError: false })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should show notification when showNotification is true', () => {
      const error = { message: 'Storage error' }
      handleStorageError(error, 'getItem', 'key', { showNotification: true })
      expect(showError).toHaveBeenCalledWith(expect.stringContaining('Failed to getItem storage'))
    })

    it('should include context in log messages', () => {
      const error = { message: 'Error' }

      handleApiError(error, { context: 'WorkflowChat' })

      expect(logger.error).toHaveBeenCalledWith('[WorkflowChat] API Error:', error)
    })

    it('should log error details when response is available', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Not found' },
        },
        config: { url: '/api/workflows/123' },
      }

      handleApiError(error, { context: 'API' })

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenCalledWith('[API] API Error:', error)
      expect(logger.error).toHaveBeenCalledWith('[API] Error details:', {
        status: 404,
        statusText: 'Not Found',
        data: { detail: 'Not found' },
        url: '/api/workflows/123',
      })
    })
  })

  describe('handleStorageError', () => {
    it('should log storage errors', () => {
      const error = new Error('Quota exceeded')
      
      handleStorageError(error, 'setItem', 'test-key')

      expect(logger.error).toHaveBeenCalledWith(
        '[Storage Error Handler] Storage setItem error for key "test-key":',
        error
      )
    })

    it('should include context in log messages', () => {
      const error = new Error('Storage error')
      
      handleStorageError(error, 'getItem', 'key', { context: 'WorkflowChat' })

      expect(logger.error).toHaveBeenCalledWith(
        '[WorkflowChat] Storage getItem error for key "key":',
        error
      )
    })

    it('should show notification when requested', () => {
      const error = new Error('Storage error')
      
      handleStorageError(error, 'setItem', 'key', { showNotification: true })

      expect(showError).toHaveBeenCalledWith('Failed to setItem storage: Storage error')
    })

    it('should not show notification by default', () => {
      const error = new Error('Storage error')
      
      handleStorageError(error, 'getItem', 'key')

      expect(showError).not.toHaveBeenCalled()
    })
  })

  describe('handleError', () => {
    it('should handle Error instances', () => {
      const error = new Error('Generic error')

      const message = handleError(error)

      expect(message).toBe('Generic error')
      expect(logger.error).toHaveBeenCalled()
      expect(showError).toHaveBeenCalledWith('Generic error')
    })

    it('should handle string errors', () => {
      const message = handleError('String error')

      expect(message).toBe('String error')
    })

    it('should use default message for unknown error types', () => {
      const message = handleError({}, { defaultMessage: 'Default' })

      expect(message).toBe('Default')
    })

    it('should include context in log messages', () => {
      handleError(new Error('Error'), { context: 'Component' })

      expect(logger.error).toHaveBeenCalledWith('[Component] Error:', expect.any(Error))
    })

    it('should not show notification when showNotification is false', () => {
      handleError(new Error('Error'), { showNotification: false })

      expect(showError).not.toHaveBeenCalled()
    })

    it('should not log when logError is false', () => {
      handleError(new Error('Error'), { logError: false })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should handle storage error without message', () => {
      const error = {}
      
      handleStorageError(error, 'getItem', 'key', { showNotification: true })

      expect(showError).toHaveBeenCalledWith('Failed to getItem storage: Unknown error')
    })

    it('should not log storage error when logError is false', () => {
      const error = new Error('Storage error')
      
      handleStorageError(error, 'setItem', 'key', { logError: false })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should handle error.response without status', () => {
      const error = {
        response: {
          data: { detail: 'Error without status' },
        },
      }

      const message = handleApiError(error)

      expect(message).toBe('Error without status')
      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle error.response without data', () => {
      const error = {
        response: {
          status: 500,
          statusText: 'Server Error',
        },
        message: 'Network error',
      }

      const message = handleApiError(error)

      expect(message).toBe('Network error')
    })

    it('should handle error with config but no url', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Not found' },
        },
        config: {},
      }

      handleApiError(error, { context: 'API' })

      expect(logger.error).toHaveBeenCalledWith('[API] Error details:', {
        status: 404,
        statusText: 'Not Found',
        data: { detail: 'Not found' },
        url: undefined,
      })
    })

    it('should handle error without response or message', () => {
      const error = {}

      const message = handleApiError(error, { defaultMessage: 'Default' })

      expect(message).toBe('Default')
    })

    it('should handle error with empty string message', () => {
      const error = { message: '' }

      const message = handleApiError(error, { defaultMessage: 'Default' })

      expect(message).toBe('')
    })

    it('should handle error.response.data.detail being empty string', () => {
      const error = {
        response: {
          data: { detail: '' },
        },
        message: 'Fallback message',
      }

      const message = handleApiError(error)

      // Empty string is falsy, should fall back to message
      expect(message).toBe('Fallback message')
    })

    it('should handle error.response.data.message being empty string', () => {
      const error = {
        response: {
          data: { message: '' },
        },
        message: 'Fallback message',
      }

      const message = handleApiError(error)

      // Empty string is falsy, should fall back to message
      expect(message).toBe('Fallback message')
    })

    it('should handle handleError with null error', () => {
      const message = handleError(null as any, { defaultMessage: 'Default' })

      expect(message).toBe('Default')
    })

    it('should handle handleError with number error', () => {
      const message = handleError(123 as any, { defaultMessage: 'Default' })

      expect(message).toBe('Default')
    })

    it('should handle handleError with boolean error', () => {
      const message = handleError(true as any, { defaultMessage: 'Default' })

      expect(message).toBe('Default')
    })

    it('should handle handleStorageError with null error', () => {
      handleStorageError(null as any, 'getItem', 'key')

      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle handleStorageError with error that has no message property', () => {
      const error = { code: 'QUOTA_EXCEEDED' }
      
      handleStorageError(error, 'setItem', 'key', { showNotification: true })

      expect(showError).toHaveBeenCalledWith('Failed to setItem storage: Unknown error')
    })
  })
})
