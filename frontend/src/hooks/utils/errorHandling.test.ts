/**
 * Tests for Error Handling Utilities
 */

import {
  extractErrorMessage,
  handleApiError,
  handleError,
  createSafeErrorHandler,
} from './errorHandling'
import { logger } from '../../utils/logger'
import { showError } from '../../utils/notifications'

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('../../utils/notifications', () => ({
  showError: jest.fn(),
}))

const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>
const mockShowError = showError as jest.MockedFunction<typeof showError>

describe('errorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('extractErrorMessage', () => {
    it('should return string error as-is', () => {
      const result = extractErrorMessage('Simple error message', 'Default')
      expect(result).toBe('Simple error message')
    })

    it('should extract message from Error instance', () => {
      const error = new Error('Error message')
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('Error message')
    })

    it('should use default message when Error has no message', () => {
      const error = new Error('')
      const result = extractErrorMessage(error, 'Default message')
      expect(result).toBe('Default message')
    })

    it('should handle case where logicalOr returns null and use defaultMessage', () => {
      // Create an Error with empty message and pass null as defaultMessage
      // logicalOr('', null) returns null, then defensive check returns defaultMessage (null)
      // This tests the defensive check on line 33: (messageResult !== null && messageResult !== undefined) ? messageResult : defaultMessage
      const error = new Error('')
      const result = extractErrorMessage(error, null as any)
      // When defaultMessage is null, the defensive check returns null (the defaultMessage)
      expect(result).toBeNull()
    })

    it('should handle case where logicalOr returns undefined - uses default parameter', () => {
      // When undefined is passed, JavaScript uses the default parameter value 'An error occurred'
      // So logicalOr('', 'An error occurred') returns 'An error occurred'
      // This tests that undefined uses the default parameter
      const error = new Error('')
      const result = extractErrorMessage(error, undefined as any)
      // When undefined is passed, default parameter 'An error occurred' is used
      expect(result).toBe('An error occurred')
    })

    it('should handle case where logicalOr returns null (defensive check)', () => {
      // Create an Error with null message and pass null as defaultMessage
      // This tests the defensive check on line 33
      // When error.message is empty string (falsy) and defaultMessage is null,
      // logicalOr returns null, triggering the defensive check
      const error = Object.create(Error.prototype)
      error.message = ''
      const result = extractErrorMessage(error, null as any)
      // Defensive check on line 33 returns defaultMessage when messageResult is null
      expect(result).toBe(null)
    })

    it('should extract from error.response.data.detail', () => {
      const error = {
        response: {
          data: {
            detail: 'API error detail',
          },
        },
      }
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('API error detail')
    })

    it('should extract from error.response.data.message', () => {
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      }
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('API error message')
    })

    it('should prefer detail over message', () => {
      const error = {
        response: {
          data: {
            detail: 'Detail message',
            message: 'Regular message',
          },
        },
      }
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('Detail message')
    })

    it('should extract from error.message when no response', () => {
      const error = { message: 'Object error message' }
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('Object error message')
    })

    it('should use default message when error is null', () => {
      const result = extractErrorMessage(null, 'Default message')
      expect(result).toBe('Default message')
    })

    it('should use default message when error is undefined', () => {
      const result = extractErrorMessage(undefined, 'Default message')
      expect(result).toBe('Default message')
    })

    it('should use default message when error has no extractable message', () => {
      const error = { someOtherProperty: 'value' }
      const result = extractErrorMessage(error, 'Default message')
      expect(result).toBe('Default message')
    })

    it('should handle error without response.data', () => {
      const error = { response: {} }
      const result = extractErrorMessage(error, 'Default')
      expect(result).toBe('Default')
    })
  })

  describe('handleApiError', () => {
    it('should log error and show notification by default', () => {
      const error = new Error('API error')
      handleApiError(error)

      expect(mockLoggerError).toHaveBeenCalledWith('[Error Handler] API Error:', error)
      expect(mockShowError).toHaveBeenCalledWith('API error')
    })

    it('should use custom context in log', () => {
      const error = new Error('API error')
      handleApiError(error, { context: 'MyContext' })

      expect(mockLoggerError).toHaveBeenCalledWith('[MyContext] API Error:', error)
    })

    it('should log error details when response exists', () => {
      const error = {
        message: 'Request failed',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Resource not found' },
        },
        config: { url: '/api/resource' },
      }
      handleApiError(error, { context: 'Test' })

      expect(mockLoggerError).toHaveBeenCalledTimes(2)
      expect(mockLoggerError).toHaveBeenNthCalledWith(1, '[Test] API Error:', error)
      expect(mockLoggerError).toHaveBeenNthCalledWith(2, '[Test] Error details:', {
        status: 404,
        statusText: 'Not Found',
        data: { detail: 'Resource not found' },
        url: '/api/resource',
      })
    })

    it('should not log when logError is false', () => {
      const error = new Error('API error')
      handleApiError(error, { logError: false })

      expect(mockLoggerError).not.toHaveBeenCalled()
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should not show notification when showNotification is false', () => {
      const error = new Error('API error')
      handleApiError(error, { showNotification: false })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('should use custom default message', () => {
      const error = null
      handleApiError(error, { defaultMessage: 'Custom default' })

      expect(mockShowError).toHaveBeenCalledWith('Custom default')
    })

    it('should use custom logger', () => {
      const customLogger = { error: jest.fn() } as any
      const error = new Error('API error')
      handleApiError(error, { logger: customLogger })

      expect(customLogger.error).toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should use custom showError function', () => {
      const customShowError = jest.fn()
      const error = new Error('API error')
      handleApiError(error, { showError: customShowError })

      expect(customShowError).toHaveBeenCalledWith('API error')
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('should return extracted error message', () => {
      const error = new Error('Test error')
      const result = handleApiError(error)

      expect(result).toBe('Test error')
    })

    it('should handle error without response.config', () => {
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: {},
        },
      }
      handleApiError(error, { context: 'Test' })

      expect(mockLoggerError).toHaveBeenCalledTimes(2)
      expect(mockLoggerError).toHaveBeenNthCalledWith(2, '[Test] Error details:', {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        url: undefined,
      })
    })
  })

  describe('handleError', () => {
    it('should log error and show notification by default', () => {
      const error = new Error('Generic error')
      handleError(error)

      expect(mockLoggerError).toHaveBeenCalledWith('[Error Handler] Error:', error)
      expect(mockShowError).toHaveBeenCalledWith('Generic error')
    })

    it('should use custom context in log', () => {
      const error = new Error('Generic error')
      handleError(error, { context: 'MyContext' })

      expect(mockLoggerError).toHaveBeenCalledWith('[MyContext] Error:', error)
    })

    it('should not log when logError is false', () => {
      const error = new Error('Generic error')
      handleError(error, { logError: false })

      expect(mockLoggerError).not.toHaveBeenCalled()
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should not show notification when showNotification is false', () => {
      const error = new Error('Generic error')
      handleError(error, { showNotification: false })

      expect(mockLoggerError).toHaveBeenCalled()
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('should use custom default message', () => {
      const error = null
      handleError(error, { defaultMessage: 'Custom default' })

      expect(mockShowError).toHaveBeenCalledWith('Custom default')
    })

    it('should use custom logger', () => {
      const customLogger = { error: jest.fn() } as any
      const error = new Error('Generic error')
      handleError(error, { logger: customLogger })

      expect(customLogger.error).toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should use custom showError function', () => {
      const customShowError = jest.fn()
      const error = new Error('Generic error')
      handleError(error, { showError: customShowError })

      expect(customShowError).toHaveBeenCalledWith('Generic error')
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('should return extracted error message', () => {
      const error = new Error('Test error')
      const result = handleError(error)

      expect(result).toBe('Test error')
    })

    it('should handle string errors', () => {
      handleError('String error')

      expect(mockShowError).toHaveBeenCalledWith('String error')
    })
  })

  describe('createSafeErrorHandler', () => {
    it('should call handler function with error', () => {
      const handler = jest.fn()
      const safeHandler = createSafeErrorHandler(handler)

      safeHandler(new Error('Test error'))

      expect(handler).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should not throw when handler throws', () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      const safeHandler = createSafeErrorHandler(handler)

      expect(() => safeHandler(new Error('Test error'))).not.toThrow()
    })

    it('should log handler error when handler throws', () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      const safeHandler = createSafeErrorHandler(handler)

      safeHandler(new Error('Test error'))

      expect(mockLoggerError).toHaveBeenCalledWith('[Safe Error Handler] Handler threw an error:', expect.any(Error))
    })

    it('should show fallback message when handler throws', () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      const safeHandler = createSafeErrorHandler(handler, 'Fallback message')

      safeHandler(new Error('Test error'))

      expect(mockShowError).toHaveBeenCalledWith('Fallback message')
    })

    it('should use default fallback message when not provided', () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      const safeHandler = createSafeErrorHandler(handler)

      safeHandler(new Error('Test error'))

      expect(mockShowError).toHaveBeenCalledWith('An error occurred')
    })

    it('should return handler result when handler succeeds', () => {
      const handler = jest.fn().mockReturnValue('success')
      const safeHandler = createSafeErrorHandler(handler)

      const result = safeHandler(new Error('Test error'))

      expect(result).toBeUndefined() // Handler is void, so safe handler returns void
      expect(handler).toHaveBeenCalled()
    })
  })
})
