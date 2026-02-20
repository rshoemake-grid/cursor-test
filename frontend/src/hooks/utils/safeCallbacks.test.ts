/**
 * Tests for Safe Callback Helpers
 * Tests mutation-resistant callback invocation helpers
 */

import {
  safeShowError,
  safeShowSuccess,
  safeOnComplete,
} from './safeCallbacks'
import type { DeletionCallbacks } from './agentDeletionService'

describe('safeShowError', () => {
  it('should handle callbacks as null', () => {
    expect(() => safeShowError(null, 'test error')).not.toThrow()
  })

  it('should handle callbacks as undefined', () => {
    expect(() => safeShowError(undefined, 'test error')).not.toThrow()
  })

  it('should handle callbacks.showError as undefined', () => {
    const callbacks = {} as DeletionCallbacks
    expect(() => safeShowError(callbacks, 'test error')).not.toThrow()
  })

  it('should handle callbacks.showError as null', () => {
    const callbacks = { showError: null } as any as DeletionCallbacks
    expect(() => safeShowError(callbacks, 'test error')).not.toThrow()
  })

  it('should handle callbacks.showError as non-function (string)', () => {
    const callbacks = { showError: 'not a function' } as any as DeletionCallbacks
    expect(() => safeShowError(callbacks, 'test error')).not.toThrow()
  })

  it('should handle callbacks.showError as non-function (number)', () => {
    const callbacks = { showError: 123 } as any as DeletionCallbacks
    expect(() => safeShowError(callbacks, 'test error')).not.toThrow()
  })

  it('should call valid callbacks.showError function', () => {
    const mockShowError = jest.fn()
    const callbacks: DeletionCallbacks = {
      showError: mockShowError,
      showSuccess: jest.fn(),
    }
    safeShowError(callbacks, 'test error message')
    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(mockShowError).toHaveBeenCalledWith('test error message')
  })

  it('should catch and ignore callback execution errors', () => {
    const mockShowError = jest.fn(() => {
      throw new Error('Callback error')
    })
    const callbacks: DeletionCallbacks = {
      showError: mockShowError,
      showSuccess: jest.fn(),
    }
    expect(() => safeShowError(callbacks, 'test error')).not.toThrow()
    expect(mockShowError).toHaveBeenCalledTimes(1)
  })
})

describe('safeShowSuccess', () => {
  it('should handle callbacks as null', () => {
    expect(() => safeShowSuccess(null, 'test success')).not.toThrow()
  })

  it('should handle callbacks as undefined', () => {
    expect(() => safeShowSuccess(undefined, 'test success')).not.toThrow()
  })

  it('should handle callbacks.showSuccess as undefined', () => {
    const callbacks = {} as DeletionCallbacks
    expect(() => safeShowSuccess(callbacks, 'test success')).not.toThrow()
  })

  it('should handle callbacks.showSuccess as null', () => {
    const callbacks = { showSuccess: null } as any as DeletionCallbacks
    expect(() => safeShowSuccess(callbacks, 'test success')).not.toThrow()
  })

  it('should handle callbacks.showSuccess as non-function', () => {
    const callbacks = { showSuccess: 'not a function' } as any as DeletionCallbacks
    expect(() => safeShowSuccess(callbacks, 'test success')).not.toThrow()
  })

  it('should call valid callbacks.showSuccess function', () => {
    const mockShowSuccess = jest.fn()
    const callbacks: DeletionCallbacks = {
      showError: jest.fn(),
      showSuccess: mockShowSuccess,
    }
    safeShowSuccess(callbacks, 'test success message')
    expect(mockShowSuccess).toHaveBeenCalledTimes(1)
    expect(mockShowSuccess).toHaveBeenCalledWith('test success message')
  })

  it('should catch and ignore callback execution errors', () => {
    const mockShowSuccess = jest.fn(() => {
      throw new Error('Callback error')
    })
    const callbacks: DeletionCallbacks = {
      showError: jest.fn(),
      showSuccess: mockShowSuccess,
    }
    expect(() => safeShowSuccess(callbacks, 'test success')).not.toThrow()
    expect(mockShowSuccess).toHaveBeenCalledTimes(1)
  })
})

describe('safeOnComplete', () => {
  it('should handle callbacks as null', () => {
    expect(() => safeOnComplete(null)).not.toThrow()
  })

  it('should handle callbacks as undefined', () => {
    expect(() => safeOnComplete(undefined)).not.toThrow()
  })

  it('should handle callbacks.onComplete as undefined (optional)', () => {
    const callbacks: DeletionCallbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    }
    expect(() => safeOnComplete(callbacks)).not.toThrow()
  })

  it('should handle callbacks.onComplete as null', () => {
    const callbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      onComplete: null,
    } as any as DeletionCallbacks
    expect(() => safeOnComplete(callbacks)).not.toThrow()
  })

  it('should handle callbacks.onComplete as non-function', () => {
    const callbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      onComplete: 'not a function',
    } as any as DeletionCallbacks
    expect(() => safeOnComplete(callbacks)).not.toThrow()
  })

  it('should call valid callbacks.onComplete function', () => {
    const mockOnComplete = jest.fn()
    const callbacks: DeletionCallbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      onComplete: mockOnComplete,
    }
    safeOnComplete(callbacks)
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
    expect(mockOnComplete).toHaveBeenCalledWith()
  })

  it('should catch and ignore callback execution errors', () => {
    const mockOnComplete = jest.fn(() => {
      throw new Error('Callback error')
    })
    const callbacks: DeletionCallbacks = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      onComplete: mockOnComplete,
    }
    expect(() => safeOnComplete(callbacks)).not.toThrow()
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })
})
